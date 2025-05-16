import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";

interface UgdEntry {
	code: string;
	bin: string;
	originalName: string;
	originalRegion?: string;
	searchableNameTokens: string[]; // Normalized and tokenized name for searching
	searchableRegion?: string; // Normalized region name
	isDistrictUgd: boolean;
}

interface CsvRecord {
	code: string;
	bin: string;
	name: string;
	region?: string;
}

let ugdData: UgdEntry[] = [];
let isInitialized = false;

// Generic normalizer
function normalizeText(text?: string | null): string {
	if (!text) return "";
	return text
		.toLowerCase()
		.replace(/[.,]/g, " ") // Replace punctuation with space for tokenization
		.replace(/\s+/g, " ") // Collapse multiple spaces
		.trim();
}

// Normalizes UGD names for better matching
function normalizeUgdNameForSearch(name: string): string[] {
	let normalized = name.toLowerCase();

	// Remove common prefixes
	normalized = normalized.replace(
		/^(угд|дгд|ну|департамент государственных доходов)\s*(по|по)?\s*/,
		"",
	);
	normalized = normalized.replace(/^(городу|г\.|пос\.|село|с\.)\s*/, "");

	// Handle "X району", "Y району" -> extract X or Y and simplify
	// e.g., "аккольскому району" -> "аккольск"
	// e.g., "району имени казыбек би" -> "казыбек би"
	const rayonMatchTraditional = normalized.match(
		/^([^\s]+)(?:ому|скому|скому|овскому|евскому|скому|ынскому|енскому|им\.)\s+району/,
	);
	if (rayonMatchTraditional?.[1]) {
		normalized = rayonMatchTraditional[1];
		if (normalized.endsWith("ск")) {
			// Keep as is, e.g., "есильск"
		} else if (normalized.endsWith("ом") || normalized.endsWith("ым")) {
			normalized = normalized.slice(0, -2); // есильскому -> есильск (approx)
		}
	}

	const rayonImeniMatch = normalized.match(/^району\s+(?:имени\s*)?([^,]+)/);
	if (rayonImeniMatch?.[1]) {
		normalized = rayonImeniMatch[1];
	}

	// Handle quoted names e.g. "Астана-жаңа қала"
	const quotedMatch = normalized.match(/^"([^"]+)"/);
	if (quotedMatch?.[1]) {
		normalized = quotedMatch[1];
	}

	// Remove "району", "район", "облысы", "область" if they are standalone words or at end
	normalized = normalized.replace(/\s*району\s*|\s*район\s*$/, " ");
	normalized = normalized.replace(/\s*облысы\s*|\s*область\s*$/, " ");

	return normalizeText(normalized)
		.split(" ")
		.filter((t) => t.length > 1 || /\d/.test(t)); // Keep short digits
}

function normalizeRegion(regionText?: string | null): string | undefined {
	if (!regionText) return undefined;
	let normalized = regionText.toLowerCase().trim();
	normalized = normalized.replace(/\s*(область|обл\.|обл)$/, "");
	normalized = normalized.replace(/^(г\s*|город\s*)/, "");
	return normalizeText(normalized).replace(/\s+/g, " "); // Ensure single space
}

function isDistrictName(name: string): boolean {
	const lname = name.toLowerCase();
	return lname.includes("район") || lname.includes("району");
}

async function initializeUgdData(): Promise<void> {
	if (isInitialized) return;
	try {
		const csvFilePath = path.resolve(__dirname, "ugd.csv");
		const fileContent = fs.readFileSync(csvFilePath, { encoding: "utf-8" });
		const records: CsvRecord[] = parse(fileContent, {
			columns: ["code", "bin", "name", "region"],
			skip_empty_lines: true,
			trim: true,
			from_line: 2, // Skip header
		});

		ugdData = records.map((record) => {
			const name = record.name.trim();
			const region = record.region?.trim();
			return {
				code: record.code,
				bin: record.bin,
				originalName: name,
				originalRegion: region,
				searchableNameTokens: normalizeUgdNameForSearch(name),
				searchableRegion: normalizeRegion(region),
				isDistrictUgd: isDistrictName(name),
			};
		});

		console.log(
			`Initialized UGD data with ${ugdData.length} entries. First few samples:`,
		);
		// ugdData.slice(0, 5).forEach(entry => console.log(JSON.stringify(entry, null, 2)));

		isInitialized = true;
	} catch (error) {
		console.error("Failed to initialize UGD data:", error);
		isInitialized = false;
	}
}

interface ParsedAddress {
	rawInput: string;
	inputRegions: string[]; // Normalized region terms from input
	inputDistricts: string[]; // Normalized district terms from input
	generalTerms: string[]; // Other normalized terms
	allNormalizedTerms: string[];
}

function parseAddressInput(localityName: string): ParsedAddress {
	const rawParts = localityName
		.split(/[,;/\s]+(?:и|или|or)[\s,;]+|[,;/]/)
		.map((p) => p.trim())
		.filter((p) => p.length > 0);

	const inputRegions: string[] = [];
	const inputDistricts: string[] = [];
	const generalTerms: string[] = [];
	const allNormalizedTermsSet = new Set<string>();

	for (const part of rawParts) {
		const lowPart = part.toLowerCase();
		let normalizedPart = normalizeText(lowPart);

		if (
			lowPart.endsWith(" область") ||
			lowPart.endsWith(" обл") ||
			lowPart.endsWith(" обл.") ||
			lowPart.startsWith("г.алматы") || // Treat as region
			lowPart.startsWith("г.астана") || // Treat as region
			lowPart.startsWith("г.нур-султан") || // Treat as region
			lowPart.startsWith("г.шымкент") // Treat as region
		) {
			const regionName = normalizeRegion(lowPart);
			if (regionName) {
				inputRegions.push(regionName);
				normalizedPart.split(" ").forEach((t) => allNormalizedTermsSet.add(t));
				continue; // Processed as region
			}
		}

		if (
			lowPart.includes(" район") ||
			lowPart.includes(" р-н") ||
			lowPart.includes(" ауданы")
		) {
			// Attempt to extract just the district name itself
			const districtCore = normalizeText(
				lowPart
					.replace(/\s*(район|р-н|ауданы)$/, "")
					.replace(/^(район|р-н|ауданы)\s*/, ""),
			);
			if (districtCore) {
				inputDistricts.push(
					...districtCore.split(" ").filter((t) => t.length > 1),
				);
				districtCore.split(" ").forEach((t) => allNormalizedTermsSet.add(t));
				continue; // Processed as district
			}
		}

		// General terms after stripping common prefixes/suffixes
		const generalCleaned = normalizeText(
			lowPart
				.replace(/^(город|г\.|пос\.|село|с\.|область|обл\.|район|р-н)\s*/, "")
				.replace(/\s*(город|г\.|пос\.|село|с\.|область|обл\.|район|р-н)$/, ""),
		);

		if (generalCleaned) {
			const terms = generalCleaned.split(" ").filter((t) => t.length > 0);
			generalTerms.push(...terms);
			terms.forEach((t) => allNormalizedTermsSet.add(t));
		} else if (normalizedPart) {
			// Fallback to the initially normalized part if cleaning removed everything
			const terms = normalizedPart.split(" ").filter((t) => t.length > 0);
			generalTerms.push(...terms);
			terms.forEach((t) => allNormalizedTermsSet.add(t));
		}
	}
	// Ensure unique terms
	const uniqueInputRegions = [...new Set(inputRegions)];
	const uniqueInputDistricts = [
		...new Set(inputDistricts.filter((t) => t.length > 1)),
	]; // filter short noisy district terms
	const uniqueGeneralTerms = [
		...new Set(
			generalTerms.filter(
				(t) =>
					!uniqueInputRegions.includes(t) && !uniqueInputDistricts.includes(t),
			),
		),
	];

	return {
		rawInput: localityName,
		inputRegions: uniqueInputRegions,
		inputDistricts: uniqueInputDistricts,
		generalTerms: uniqueGeneralTerms,
		allNormalizedTerms: [
			...new Set([
				...uniqueInputRegions,
				...uniqueInputDistricts,
				...uniqueGeneralTerms,
			]),
		],
	};
}

interface MatchCandidate {
	ugd: UgdEntry;
	score: number;
	debug: string[];
}

export async function findUgdByAddressComponents(addressComponents: {
	localityName?: string | null;
}): Promise<UgdEntry | null> {
	if (!isInitialized) {
		await initializeUgdData();
		if (!isInitialized || !ugdData.length) {
			console.warn("UGD data not available.");
			return null;
		}
	}

	const localityName = addressComponents.localityName;
	if (!localityName) {
		console.warn("No localityName provided.");
		return null;
	}

	const parsedAddress = parseAddressInput(localityName);
	console.log("Parsed Address Input:", JSON.stringify(parsedAddress, null, 2));

	if (parsedAddress.allNormalizedTerms.length === 0) {
		console.warn("Locality name resulted in no searchable terms.");
		return null;
	}

	const candidates: MatchCandidate[] = [];

	for (const ugd of ugdData) {
		let score = 0;
		const debug: string[] = [];

		// 1. Region Matching
		if (parsedAddress.inputRegions.length > 0) {
			let regionMatchFound = false;
			for (const inputRegion of parsedAddress.inputRegions) {
				if (
					ugd.searchableRegion &&
					ugd.searchableRegion.includes(inputRegion)
				) {
					score += 100;
					debug.push(
						`+100 (Region Match: '${inputRegion}' in '${ugd.searchableRegion}')`,
					);
					regionMatchFound = true;
					break;
				}
			}
			if (!regionMatchFound) {
				score -= 200; // Penalty if input specifies region(s) but UGD doesn't match any
				debug.push(
					`-200 (No UGD region match for input regions: ${parsedAddress.inputRegions.join(
						", ",
					)})`,
				);
				// continue; // Option: skip if explicit region specified and not matched
			}
		}

		// 2. District Matching
		if (parsedAddress.inputDistricts.length > 0) {
			if (!ugd.isDistrictUgd) {
				score -= 100; // Penalty: Input wants a district, but this UGD is not district-specific.
				debug.push("-100 (Input district specified, UGD is not district type)");
			} else {
				let districtMatchFound = false;
				for (const inputDistrict of parsedAddress.inputDistricts) {
					if (
						ugd.searchableNameTokens.some(
							(token) =>
								token.includes(inputDistrict) || inputDistrict.includes(token),
						)
					) {
						score += 150;
						debug.push(
							`+150 (District Match: '${inputDistrict}' in UGD name tokens [${ugd.searchableNameTokens.join(
								", ",
							)}])`,
						);
						districtMatchFound = true;
						// break; // Consider if one district match is enough or accumulate
					}
				}
				if (!districtMatchFound) {
					score -= 75; // Penalty if input specifies district(s) but UGD name doesn't match
					debug.push(
						`-75 (No UGD name match for input districts: ${parsedAddress.inputDistricts.join(
							", ",
						)})`,
					);
				}
			}
		} else {
			// No explicit district in input
			if (ugd.isDistrictUgd) {
				score -= 20; // Slight penalty for district UGDs if input is general
				debug.push(
					"-20 (UGD is district type, but no input district specified)",
				);
			}
		}

		// 3. General Term Matching (against UGD name tokens)
		for (const term of parsedAddress.generalTerms) {
			if (
				ugd.searchableNameTokens.some(
					(token) => token.includes(term) || term.includes(token),
				)
			) {
				score += 20 * Math.min(term.length, 5); // Score based on term length, capped
				debug.push(
					`+${
						20 * Math.min(term.length, 5)
					} (General Term Match: '${term}' in UGD name)`,
				);
			}
		}

		// 3.1. General Term Matching against UGD region (if no explicit region match)
		if (parsedAddress.inputRegions.length === 0 && ugd.searchableRegion) {
			for (const term of parsedAddress.generalTerms) {
				if (ugd.searchableRegion.includes(term)) {
					score += 10 * Math.min(term.length, 5);
					debug.push(
						`+${
							10 * Math.min(term.length, 5)
						} (General Term Match: '${term}' in UGD region '${
							ugd.searchableRegion
						}')`,
					);
				}
			}
		}

		// Add to candidates if score is potentially viable
		if (score > -100) {
			// Threshold to avoid clearly bad matches
			candidates.push({ ugd, score, debug });
		}
	}

	if (candidates.length === 0) {
		console.log("No suitable UGD candidates found.");
		return null;
	}

	candidates.sort((a, b) => b.score - a.score);

	// console.log("\nTop 5 Candidates:");
	// candidates.slice(0, 5).forEach(c => {
	// 	console.log(`Score: ${c.score}, Code: ${c.ugd.code}, Name: ${c.ugd.originalName}, Region: ${c.ugd.originalRegion}`);
	// 	console.log("Debug:", c.debug.join(" | "));
	// });

	const bestCandidate = candidates[0];
	console.log(
		`Best Match: ${bestCandidate.ugd.originalName} (Code: ${bestCandidate.ugd.code}, Score: ${bestCandidate.score})`,
	);
	// console.log("Full Debug for Best:", bestCandidate.debug);

	// Additional tie-breaking or confidence check can be added here if needed.
	// For now, return the highest score if it's reasonably positive.
	if (bestCandidate.score < 50 && parsedAddress.allNormalizedTerms.length > 1) {
		// Heuristic: if score is low for multi-term input
		console.log(
			`Best candidate score ${bestCandidate.score} too low for confidence with multiple terms.`,
		);
		// Check if there's a very specific single term match that got overshadowed.
		// For instance, if "Астана" was the input and "ДГД по г.Астана" got a score of 20, but something else got 40 due to partial matches.
		// This part needs careful tuning.
		if (parsedAddress.allNormalizedTerms.length === 1) {
			const singleTerm = parsedAddress.allNormalizedTerms[0];
			for (const cand of candidates) {
				if (
					cand.ugd.searchableNameTokens.includes(singleTerm) ||
					cand.ugd.searchableRegion === singleTerm
				) {
					if (cand.score > 0) {
						// Ensure it's a positive match
						console.log(
							`Re-evaluating for single term '${singleTerm}', found candidate: ${cand.ugd.originalName} with score ${cand.score}`,
						);
						return cand.ugd;
					}
				}
			}
		}
		return null;
	}

	return bestCandidate.ugd;
}

// Initialize data when module loads
(async () => {
	await initializeUgdData();
})();
