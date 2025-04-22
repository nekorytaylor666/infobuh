import * as path from "node:path";
import * as fs from "node:fs";
import { Writable } from "node:stream"; // For fetch stream
import { pipeline } from "node:stream/promises"; // For pipeline
import csv from "csv-parser"; // Import csv-parser
import { BinRegistryEntry, createDbClient } from "@accounting-kz/db";

const db = createDbClient(process.env.DATABASE_URL! as string);
// Define the structure for a legal entity based on expected columns
interface LegalEntity {
	bin?: string; // БИН
	name?: string; // Наименование
	iin?: string; // ИИН
	// Add other relevant fields from your XLSX if needed
	originalData: Record<string, string | number | null>; // Keep the original row data
}

const csvFileName = "bin-data.csv";
// Define the target path within the package
const targetCsvPath = path.resolve(__dirname, csvFileName);
let legalEntities: LegalEntity[] = [];
let isInitialized = false; // Flag to track initialization

/**
 * Normalizes header names by converting to lowercase and removing extra spaces.
 */
function normalizeHeader(header: string): string {
	// csv-parser handles quotes automatically, so just lowercase and trim
	return header.toLowerCase().trim();
}

/**
 * Returns the fixed path where the CSV file should be located after download.
 */
function getCsvPath(): string {
	return targetCsvPath;
}

/**
 * Downloads the CSV file from the given URL and saves it locally.
 */
async function downloadCsv(url: string, destination: string): Promise<void> {
	console.log(`Attempting to download CSV from ${url} to ${destination}...`);
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(
				`Failed to download CSV: ${response.status} ${response.statusText}`,
			);
		}
		if (!response.body) {
			throw new Error("Response body is null");
		}

		// Get total size for progress calculation
		const totalSizeHeader = response.headers.get("Content-Length");
		const totalSize = totalSizeHeader
			? Number.parseInt(totalSizeHeader, 10)
			: null;
		let downloadedSize = 0;
		let lastLoggedPercent = -1; // To throttle logging

		if (totalSize) {
			console.log(
				`Total file size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`,
			);
		} else {
			console.log(
				"Content-Length header not found, cannot display progress percentage.",
			);
		}

		// Ensure the directory exists
		await fs.promises.mkdir(path.dirname(destination), { recursive: true });

		// Create a writable stream to the destination file
		const fileStream = fs.createWriteStream(destination);

		// Manually read from the web stream and write to the file stream
		// to correctly implement progress reporting.
		const reader = response.body.getReader();
		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				break; // Stream finished
			}

			if (value) {
				fileStream.write(value); // Write chunk to file
				downloadedSize += value.length; // Update downloaded size

				// Log progress
				if (totalSize) {
					const percent = Math.floor((downloadedSize / totalSize) * 100);
					// Log progress every 5% or so
					if (percent >= lastLoggedPercent + 5) {
						process.stdout.write(
							`Downloading: ${percent}% (${(
								downloadedSize /
								1024 /
								1024
							).toFixed(2)} MB / ${(totalSize / 1024 / 1024).toFixed(2)} MB)\r`,
						);
						lastLoggedPercent = percent;
					}
				} else {
					// Log progress in MB if total size is unknown
					process.stdout.write(
						`Downloading: ${(downloadedSize / 1024 / 1024).toFixed(2)} MB\r`,
					);
				}
			}
		}

		fileStream.end(); // Close the file stream

		// Wait for the file stream to finish writing
		await new Promise<void>((resolve, reject) => {
			fileStream.on("finish", () => resolve());
			fileStream.on("error", reject);
		});

		// Ensure the final progress (100%) is shown
		process.stdout.write("\nDownload complete.                        \n");

		console.log(`Successfully downloaded CSV to ${destination}`);
	} catch (error) {
		console.error(`\nError downloading CSV from ${url}:`, error);
		// Attempt to delete partially downloaded file
		try {
			if (fs.existsSync(destination)) {
				await fs.promises.unlink(destination);
			}
		} catch (cleanupError) {
			console.error(
				`Error cleaning up partially downloaded file ${destination}:`,
				cleanupError,
			);
		}
		throw error; // Re-throw the download error
	}
}

/**
 * Loads data from the specified CSV file using a stream parser.
 */
async function loadDataFromCsv(csvFilePath: string): Promise<LegalEntity[]> {
	console.log(`Attempting to load data via stream from: ${csvFilePath}`);
	const entities: LegalEntity[] = [];

	return new Promise((resolve, reject) => {
		console.log(`[loadDataFromCsv] Verifying existence of: ${csvFilePath}`);
		if (!fs.existsSync(csvFilePath)) {
			console.error(
				`[loadDataFromCsv] File does not exist at path: ${csvFilePath}`,
			);
			// Optionally list directory contents for debugging
			try {
				const dirContents = fs.readdirSync(path.dirname(csvFilePath));
				console.log(
					`[loadDataFromCsv] Contents of directory ${path.dirname(
						csvFilePath,
					)}:`,
					dirContents,
				);
			} catch (dirError) {
				console.error(
					`[loadDataFromCsv] Failed to read directory ${path.dirname(
						csvFilePath,
					)}:`,
					dirError,
				);
			}
			return reject(
				new Error(`File not found at the time of reading: ${csvFilePath}`),
			);
		}

		const fileStream = fs.createReadStream(csvFilePath);

		fileStream
			.pipe(
				csv({
					mapHeaders: ({ header }) => normalizeHeader(header), // Normalize headers
					// No need to handle quotes explicitly here, csv-parser does it
				}),
			)
			.on("data", (row: Record<string, string | null>) => {
				// Assuming header names are normalized by mapHeaders
				const bin = row["бин"];
				const name = row["наименование"];
				const iin = row["иин"];

				// Only include rows that have at least a BIN or Name
				if (bin || name) {
					const entity: LegalEntity = {
						bin: bin ?? undefined,
						name: name ?? undefined,
						iin: iin ?? undefined,
						originalData: row, // Keep the parsed row data
					};
					entities.push(entity);
				}

				// Optional: Log progress every N records
				if (entities.length % 100000 === 0) {
					process.stdout.write(`Processed ${entities.length} records...\r`);
				}
			})
			.on("end", () => {
				process.stdout.write("\n"); // New line after progress indicator
				console.log(
					`Successfully loaded ${entities.length} records from ${csvFilePath}.`,
				);
				// Check if required headers were found (implicitly checked by accessing bin/name)
				// We might want a more explicit check if the file could be missing headers entirely
				// For now, assume if we processed records, headers were okay.
				resolve(entities);
			})
			.on("error", (error) => {
				console.error(
					`Error reading or processing CSV stream from ${csvFilePath}:`,
					error,
				);
				reject(error); // Reject the promise on stream error
			});
	});
}

/**
 * Initializes the bin verifier by downloading the CSV (if needed) and loading it into memory.
 * Should be called once during application startup.
 */
export async function initializeBinData(downloadUrl: string): Promise<void> {
	if (isInitialized) {
		console.warn("Bin verifier already initialized.");
		return;
	}
	console.log("Initializing bin verifier...");
	try {
		const csvPath = getCsvPath();

		// Check if the file already exists
		if (fs.existsSync(csvPath)) {
			console.log(`Local file found at ${csvPath}. Skipping download.`);
		} else {
			console.log(
				`Local file not found. Attempting download from ${downloadUrl}...`,
			);
			await downloadCsv(downloadUrl, csvPath);
		}

		// Load data from the (now existing) local file
		legalEntities = await loadDataFromCsv(csvPath);
		isInitialized = true;
		console.log("Bin verifier initialized successfully.");
	} catch (error) {
		console.error("Failed to initialize bin-verifier:", error);
		isInitialized = false; // Ensure flag is false on failure
		legalEntities = [];
		throw new Error("Bin verifier initialization failed.", { cause: error });
	}
}

/**
 * Finds the first legal entity matching the query (case-insensitive)
 * by BIN, Name, or IIN. Returns undefined if not initialized or not found.
 */
export async function findEntity(
	query: string,
): Promise<BinRegistryEntry | undefined> {
	if (!query) return undefined;

	return await db.query.binRegistry.findFirst({
		where: (binRegistry, { eq }) => eq(binRegistry.bin, query),
	});
}

/**
 * Finds all legal entities matching the query (case-insensitive)
 * by BIN, Name, or IIN. Returns empty array if not initialized or not found.
 */
export async function findAllEntities(
	query: string,
): Promise<BinRegistryEntry[]> {
	if (!query) return [];

	return await db.query.binRegistry.findMany({
		where: (binRegistry, { eq }) => eq(binRegistry.bin, query),
	});
}
