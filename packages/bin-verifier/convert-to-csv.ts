import * as xlsx from "xlsx";
import * as path from "node:path";
import * as fs from "node:fs";

const inputFileNames = ["1.xlsx", "2.xlsx", "3.xlsx", "4.xlsx"];
const outputFileName = "combined-bin-data.csv";

/**
 * Finds the full paths to the input XLSX files.
 * Checks both the script's directory and the project root for each file.
 * @param filenames - Array of filenames to search for.
 * @returns Array of full paths for found files.
 */
function findInputFilePaths(filenames: string[]): string[] {
	const foundPaths: string[] = [];
	const scriptDir = path.resolve(__dirname);
	const projectRootDir = path.resolve(__dirname, "../../");

	for (const filename of filenames) {
		const pathInScriptDir = path.resolve(scriptDir, filename);
		const pathInProjectRoot = path.resolve(projectRootDir, filename);

		if (fs.existsSync(pathInScriptDir)) {
			console.log(`Found input file at: ${pathInScriptDir}`);
			foundPaths.push(pathInScriptDir);
		} else if (fs.existsSync(pathInProjectRoot)) {
			console.log(`Found input file at project root: ${pathInProjectRoot}`);
			foundPaths.push(pathInProjectRoot);
		} else {
			console.warn(
				`Warning: ${filename} not found in ${scriptDir} or ${projectRootDir}`,
			);
		}
	}
	return foundPaths;
}

/**
 * Converts multiple XLSX files to a single CSV file, combining all sheets.
 */
function convertXlsxToCsv() {
	const xlsxFilePaths = findInputFilePaths(inputFileNames);
	if (xlsxFilePaths.length === 0) {
		console.error("Error: No input XLSX files found. Exiting.");
		process.exit(1); // Exit if no input files found
	}

	// Place output file in the directory of the first found input file
	const outputCsvPath = path.resolve(
		path.dirname(xlsxFilePaths[0]),
		outputFileName,
	);

	try {
		const combinedCsvLines: string[] = [];
		let isFirstSheet = true; // Tracks if we are processing the very first sheet overall

		for (const xlsxFilePath of xlsxFilePaths) {
			console.log(`Reading XLSX file: ${xlsxFilePath}`);
			const workbook = xlsx.readFile(xlsxFilePath);

			for (const sheetName of workbook.SheetNames) {
				console.log(
					`Processing sheet: ${sheetName} from ${path.basename(xlsxFilePath)}`,
				);
				const worksheet = workbook.Sheets[sheetName];

				// Convert sheet to array of arrays (rows)
				const data: unknown[][] = xlsx.utils.sheet_to_json(worksheet, {
					header: 1, // Get data as array of arrays
					blankrows: false, // Skip empty rows
				});

				if (data.length === 0) {
					console.log(
						`Sheet ${sheetName} is empty or contains only blank rows, skipping.`,
					);
					continue; // Skip empty sheets
				}

				const dataToAppend = isFirstSheet ? data : data.slice(1); // Skip header if not the first sheet

				if (dataToAppend.length > 0) {
					// Convert array of arrays to CSV lines
					const csvSheetLines = dataToAppend.map((row) =>
						row
							.map((cell) => {
								const cellStr = String(cell ?? ""); // Ensure cell content is a string, handle null/undefined
								// Escape double quotes by doubling them and enclose in double quotes if necessary (contains comma, newline, or double quote)
								if (/[,\n"]/.test(cellStr)) {
									return `"${cellStr.replace(/"/g, '""')}"`;
								}
								return cellStr;
							})
							.join(","),
					);
					combinedCsvLines.push(...csvSheetLines);
					isFirstSheet = false; // Header has been processed (or skipped)
				} else if (!isFirstSheet) {
					console.log(
						`Sheet ${sheetName} only contained a header, skipping content.`,
					);
				}
			}
		}

		if (combinedCsvLines.length === 0) {
			console.warn(
				"Warning: No data found in any sheets across all input files.",
			);
			// Decide if an empty file should be created or not
			// fs.writeFileSync(outputCsvPath, "", "utf8");
			console.log("No output file generated as no data was found.");
			return; // Exit function, no file to write
		}

		console.log(`Writing combined data to CSV file: ${outputCsvPath}`);
		fs.writeFileSync(outputCsvPath, combinedCsvLines.join("\n"), "utf8");
		console.log("Conversion successful!");
	} catch (error) {
		console.error("Error during conversion:", error); // Fixed linter error here
		process.exit(1);
	}
}

// Run the conversion
convertXlsxToCsv();
