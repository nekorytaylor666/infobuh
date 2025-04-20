import * as path from "node:path";
import * as fs from "node:fs";

const inputFileNames = ["bin-data.csv", "combined-bin-data.csv"];
const outputFileName = "final-merged-data.csv";

/**
 * Finds the full paths to the input CSV files.
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
			console.error(
				`Error: ${filename} not found in ${scriptDir} or ${projectRootDir}. Cannot merge.`,
			);
			process.exit(1); // Exit if a required input file is missing
		}
	}

	// Ensure exactly two files were found
	if (foundPaths.length !== 2) {
		console.error(
			`Error: Expected 2 input files (${inputFileNames.join(
				", ",
			)}), but found ${foundPaths.length}. Cannot merge.`,
		);
		process.exit(1);
	}

	return foundPaths;
}

/**
 * Merges two CSV files into one, taking the header from the first file only.
 */
function mergeCsvFiles() {
	const csvFilePaths = findInputFilePaths(inputFileNames);
	const [firstFilePath, secondFilePath] = csvFilePaths;

	// Place output file in the directory of the first input file
	const outputCsvPath = path.resolve(
		path.dirname(firstFilePath),
		outputFileName,
	);

	try {
		console.log(`Reading first CSV file (including header): ${firstFilePath}`);
		const firstFileContent = fs.readFileSync(firstFilePath, "utf8");

		console.log(`Reading second CSV file (skipping header): ${secondFilePath}`);
		const secondFileContent = fs.readFileSync(secondFilePath, "utf8");

		// Split into lines and remove the header from the second file
		const firstFileLines = firstFileContent.split(/\r?\n/); // Handle Windows/Unix line endings
		const secondFileLines = secondFileContent.split(/\r?\n/);

		// Ensure the first file is not empty and potentially remove trailing blank lines
		while (
			firstFileLines.length > 0 &&
			firstFileLines[firstFileLines.length - 1].trim() === ""
		) {
			firstFileLines.pop();
		}

		// Ensure the second file has more than just a header and potentially remove trailing blank lines
		while (
			secondFileLines.length > 0 &&
			secondFileLines[secondFileLines.length - 1].trim() === ""
		) {
			secondFileLines.pop();
		}

		const secondFileContentWithoutHeader = secondFileLines.slice(1); // Skip header

		if (firstFileLines.length === 0) {
			console.error(
				`Error: First file ${firstFilePath} is empty. Cannot merge.`,
			);
			process.exit(1);
		}

		// Combine lines
		const combinedLines = [
			...firstFileLines,
			...secondFileContentWithoutHeader,
		];

		console.log(`Writing merged data to CSV file: ${outputCsvPath}`);
		fs.writeFileSync(outputCsvPath, combinedLines.join("\n"), "utf8");
		console.log("Merge successful!");
	} catch (error) {
		console.error("Error during merge:", error);
		process.exit(1);
	}
}

// Run the merge operation
mergeCsvFiles();
