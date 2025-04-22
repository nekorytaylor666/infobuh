import * as path from "node:path";
import * as fs from "node:fs";
import csv from "csv-parser";
import {
	binRegistry,
	createDbClient,
	type Database,
	sql,
} from "@accounting-kz/db";

// Type definition for the database instance (adjust based on your setup)
// biome-ignore lint/suspicious/noExplicitAny: Use specific schema type if possible	ype Database = NodePgDatabase<any>; // Replace 'any' with your schema import if possible

const CSV_DOWNLOAD_URL = process.env.BIN_CSV_URL; // Get URL from env variable
const LOCAL_CSV_PATH = path.resolve(__dirname, "bin-data.csv"); // Store in a data subdir

/**
 * Helper function to parse DD.MM.YYYY date strings.
 * Returns a Date object or null if parsing fails.
 */
function parseDate(dateString: string | null | undefined): Date | null {
	if (!dateString) return null;
	const parts = dateString.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
	if (parts) {
		// Note: Month is 0-indexed in JavaScript Date
		const day = Number.parseInt(parts[1], 10);
		const month = Number.parseInt(parts[2], 10) - 1;
		const year = Number.parseInt(parts[3], 10);
		const date = new Date(Date.UTC(year, month, day)); // Use UTC
		// Basic validation
		if (
			date.getUTCFullYear() === year &&
			date.getUTCMonth() === month &&
			date.getUTCDate() === day
		) {
			return date;
		}
	}
	// console.warn(`Failed to parse date string: ${dateString}`); // Optional logging
	return null;
}

/**
 * Normalizes header names from the specific CSV format to schema keys.
 */
function normalizeHeader(header: string): string {
	const headerMap: Record<string, string> = {
		бин: "bin",
		"толық атауы": "fullNameKz",
		"полное наименование": "fullNameRu",
		"дата регистрации": "registrationDate",
		окэд: "oked",
		"негізгі қызмет түрінің атауы": "primaryActivityKz",
		"наименование основного вида деятельности": "primaryActivityRu",
		"втор.окэд": "secondaryOked",
		крп: "krp",
		"ккж атауы": "krpNameKz",
		"наименование крп": "krpNameRu",
		ксэ: "kse",
		"эсж атауы": "kseNameKz",
		"наименование ксэ": "kseNameRu",
		кфс: "kfs",
		"мнж атауы": "kfsNameKz",
		"наименование кфс": "kfsNameRu",
		като: "kato",
		"елді мекеннің атауы": "localityNameKz",
		"наименование населенного пункта": "localityNameRu",
		'"заңды мекен-жайы, юридический адрес"': "legalAddress",
		'"басшының таә, фио руководителя"': "directorName",
	};
	const lowerTrimmed = header.toLowerCase().trim();
	return headerMap[lowerTrimmed] || lowerTrimmed;
}

/**
 * Downloads the CSV file from the given URL if it doesn't exist locally.
 */
async function downloadCsvIfNeeded(
	url: string,
	destination: string,
): Promise<boolean> {
	console.log(`Checking for CSV at ${destination}...`);
	if (fs.existsSync(destination)) {
		console.log("Local CSV found. Skipping download.");
		return true;
	}

	console.log(`Local CSV not found. Downloading from ${url}...`);
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(
				`Download failed: ${response.status} ${response.statusText}`,
			);
		}
		if (!response.body) {
			throw new Error("Response body is null");
		}

		const totalSizeHeader = response.headers.get("Content-Length");
		const totalSize = totalSizeHeader
			? Number.parseInt(totalSizeHeader, 10)
			: null;
		let downloadedSize = 0;

		await fs.promises.mkdir(path.dirname(destination), { recursive: true });
		const fileStream = fs.createWriteStream(destination);
		const reader = response.body.getReader();

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			if (value) {
				fileStream.write(value);
				downloadedSize += value.length;
				if (totalSize) {
					const percent = Math.floor((downloadedSize / totalSize) * 100);
					process.stdout.write(`Downloading: ${percent}%\r`);
				} else {
					process.stdout.write(
						`Downloading: ${(downloadedSize / 1024 / 1024).toFixed(2)} MB\r`,
					);
				}
			}
		}
		fileStream.end();
		await new Promise<void>((resolve, reject) => {
			fileStream.on("finish", resolve);
			fileStream.on("error", reject);
		});
		process.stdout.write("\nDownload complete.\n");
		return true;
	} catch (error) {
		console.error("\nError downloading CSV:", error);
		try {
			if (fs.existsSync(destination)) await fs.promises.unlink(destination);
		} catch (cleanupError) {
			console.error("Error cleaning up partial download:", cleanupError);
		}
		return false;
	}
}

/**
 * Parses data from the specified CSV file using a stream parser.
 */
async function parseCsvData(
	csvFilePath: string,
): Promise<Record<string, string | null>[]> {
	console.log(`Parsing CSV data from: ${csvFilePath}`);
	const records: Record<string, string | null>[] = [];

	return new Promise((resolve, reject) => {
		if (!fs.existsSync(csvFilePath)) {
			return reject(new Error(`CSV file not found: ${csvFilePath}`));
		}

		fs.createReadStream(csvFilePath)
			.pipe(csv({ mapHeaders: ({ header }) => normalizeHeader(header) }))
			.on("data", (row) => {
				if (row.bin?.trim()) {
					records.push(row);
				}
				if (records.length % 50000 === 0) {
					process.stdout.write(`Parsed ${records.length} records...\r`);
				}
			})
			.on("end", () => {
				process.stdout.write("\n");
				console.log(`Parsed ${records.length} valid records.`);
				resolve(records);
			})
			.on("error", (error) => {
				console.error("Error processing CSV:", error);
				reject(error);
			});
	});
}

/**
 * Seeds the bin_registry table using batch inserts with conflict handling.
 */
async function seedBinRegistry(
	db: Database,
	data: Record<string, string | null>[],
	batchSize = 500,
): Promise<void> {
	console.log(`Seeding ${data.length} records into bin_registry...`);
	let processedCount = 0;
	let failedCount = 0;

	for (let i = 0; i < data.length; i += batchSize) {
		const batch = data.slice(i, i + batchSize);
		const valuesToInsert = batch
			.map((row) => {
				if (!row.bin || !row.bin.trim()) return null;
				const registrationDate = parseDate(row.registrationDate);
				return {
					bin: row.bin.trim(),
					fullNameKz: row.fullNameKz || null,
					fullNameRu: row.fullNameRu || null,
					registrationDate: registrationDate
						? registrationDate.toISOString()
						: null,
					oked: row.oked || null,
					primaryActivityKz: row.primaryActivityKz || null,
					primaryActivityRu: row.primaryActivityRu || null,
					secondaryOked: row.secondaryOked || null,
					krp: row.krp || null,
					krpNameKz: row.krpNameKz || null,
					krpNameRu: row.krpNameRu || null,
					kse: row.kse || null,
					kseNameKz: row.kseNameKz || null,
					kseNameRu: row.kseNameRu || null,
					kfs: row.kfs || null,
					kfsNameKz: row.kfsNameKz || null,
					kfsNameRu: row.kfsNameRu || null,
					kato: row.kato || null,
					localityNameKz: row.localityNameKz || null,
					localityNameRu: row.localityNameRu || null,
					legalAddress: row.legalAddress || null,
					directorName: row.directorName || null,
				};
			})
			.filter((item): item is NonNullable<typeof item> => item !== null);

		failedCount += batch.length - valuesToInsert.length; // Count skipped rows

		if (valuesToInsert.length > 0) {
			try {
				await db
					.insert(binRegistry)
					.values(valuesToInsert)
					.onConflictDoUpdate({
						target: binRegistry.bin,
						set: {
							fullNameKz: sql`excluded.full_name_kz`,
							fullNameRu: sql`excluded.full_name_ru`,
							registrationDate: sql`excluded.registration_date`,
							oked: sql`excluded.oked`,
							primaryActivityKz: sql`excluded.primary_activity_kz`,
							primaryActivityRu: sql`excluded.primary_activity_ru`,
							secondaryOked: sql`excluded.secondary_oked`,
							krp: sql`excluded.krp`,
							krpNameKz: sql`excluded.krp_name_kz`,
							krpNameRu: sql`excluded.krp_name_ru`,
							kse: sql`excluded.kse`,
							kseNameKz: sql`excluded.kse_name_kz`,
							kseNameRu: sql`excluded.kse_name_ru`,
							kfs: sql`excluded.kfs`,
							kfsNameKz: sql`excluded.kfs_name_kz`,
							kfsNameRu: sql`excluded.kfs_name_ru`,
							kato: sql`excluded.kato`,
							localityNameKz: sql`excluded.locality_name_kz`,
							localityNameRu: sql`excluded.locality_name_ru`,
							legalAddress: sql`excluded.legal_address`,
							directorName: sql`excluded.director_name`,
							updatedAt: new Date(),
						},
					});

				processedCount += valuesToInsert.length;
				process.stdout.write(
					`Processed ${processedCount} / ${data.length} records...\r`,
				);
			} catch (error) {
				failedCount += valuesToInsert.length;
				console.error(`\nError seeding batch (index ${i}):`, error);
			}
		}
	}

	process.stdout.write("\n");
	console.log(
		`Seeding finished. ${processedCount} records processed. ${failedCount} skipped/failed.`,
	);
}

/**
 * Main seeding function.
 */
async function runSeed() {
	if (!CSV_DOWNLOAD_URL) {
		console.error("Error: BIN_CSV_URL environment variable is not set.");
		process.exit(1);
	}

	let db: Database | undefined;
	try {
		db = createDbClient(process.env.DATABASE_URL as string); // Get DB connection
		const downloaded = await downloadCsvIfNeeded(
			CSV_DOWNLOAD_URL,
			LOCAL_CSV_PATH,
		);
		if (downloaded) {
			const parsedData = await parseCsvData(LOCAL_CSV_PATH);
			if (parsedData.length > 0) {
				await seedBinRegistry(db, parsedData);
				console.log("Database seeding completed successfully.");
			} else {
				console.log("No valid data parsed from CSV to seed.");
			}
		} else {
			console.error("Failed to download CSV, cannot seed database.");
			process.exit(1);
		}
	} catch (error) {
		console.error("Error during the seeding process:", error);
		process.exit(1);
	} finally {
		// Optionally close DB connection if needed
		// await db?.end();
	}
}

// Run the seeding process if the script is executed directly
if (require.main === module) {
	runSeed();
}
