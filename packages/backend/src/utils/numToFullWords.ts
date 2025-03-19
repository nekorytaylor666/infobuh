/**
 * Converts a number to its Russian word representation
 * @param number The number to convert (1-999)
 * @returns The Russian word representation of the number
 */
function numToPr(number: number): string {
	const hundreds = [
		"сто",
		"двести",
		"триста",
		"четыреста",
		"пятьсот",
		"шестьсот",
		"семьсот",
		"восемьсот",
		"девятьсот",
	];

	const tens = [
		"",
		"двадцать",
		"тридцать",
		"сорок",
		"пятьдесят",
		"шестьдесят",
		"семьдесят",
		"восемьдесят",
		"девяносто",
	];

	const ones = [
		"один",
		"два",
		"три",
		"четыре",
		"пять",
		"шесть",
		"семь",
		"восемь",
		"девять",
	];

	const teens = [
		"одиннадцать",
		"двенадцать",
		"тринадцать",
		"четырнадцать",
		"пятнадцать",
		"шестнадцать",
		"семнадцать",
		"восемнадцать",
		"девятнадцать",
	];

	const str = number.toString();
	let out = "";

	if (str.length === 1) return ones[number - 1];

	if (str.length === 2) {
		if (str[0] === "1") {
			out = teens[Number.parseInt(str[1]) - 1];
		} else {
			out =
				tens[Number.parseInt(str[0]) - 1] +
				(str[1] !== "0" ? ` ${ones[Number.parseInt(str[1]) - 1]}` : "");
		}
	} else if (str.length === 3) {
		out =
			hundreds[Number.parseInt(str[0]) - 1] +
			(str[1] !== "0"
				? ` ${
						str[1] === "1" && str[2] !== "0"
							? teens[Number.parseInt(str[2]) - 1]
							: tens[Number.parseInt(str[1]) - 1] +
								(str[2] !== "0" ? ` ${ones[Number.parseInt(str[2]) - 1]}` : "")
					}`
				: str[2] !== "0"
					? ` ${ones[Number.parseInt(str[2]) - 1]}`
					: "");
	}

	return out;
}

/**
 * Converts a number to its full Russian word representation with currency
 * @param amount The amount to convert (can include decimals)
 * @param currency The currency code (default: "KZT")
 * @returns The Russian word representation of the amount with currency
 */
export function numToFullWords(
	amount: number | string,
	currency = "KZT",
): string {
	// Handle string input
	const numAmount =
		typeof amount === "string"
			? Number.parseFloat(amount.replace(/[^\d.,]/g, "").replace(",", "."))
			: amount;

	// Split into integer and decimal parts
	const parts = numAmount.toFixed(2).split(".");
	const integerPart = Number.parseInt(parts[0], 10);
	const decimalPart = Number.parseInt(parts[1], 10);

	// Define units for different number scales
	const units = [
		["", "", ""], // ones (special case handled separately)
		["тысяча", "тысячи", "тысяч"],
		["миллион", "миллиона", "миллионов"],
		["миллиард", "миллиарда", "миллиардов"],
		["триллион", "триллиона", "триллионов"],
	];

	// Function to get the correct form of the unit based on the number
	const getUnitForm = (num: number, forms: string[]): string => {
		const lastDigit = num % 10;
		const lastTwoDigits = num % 100;

		if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
			return forms[2];
		}

		if (lastDigit === 1) {
			return forms[0];
		}

		if (lastDigit >= 2 && lastDigit <= 4) {
			return forms[1];
		}

		return forms[2];
	};

	// Function to handle gender-specific words for thousands
	const getGenderedNumber = (num: number, unitIndex: number): string => {
		if (unitIndex === 1) {
			// thousands
			const lastTwoDigits = num % 100;
			const lastDigit = num % 10;

			// Special case for thousands
			if (lastDigit === 1 && lastTwoDigits !== 11) {
				return "одна";
			}

			if (lastDigit === 2 && lastTwoDigits !== 12) {
				return "две";
			}
		}

		return numToPr(num);
	};

	// Process the integer part
	let result = "";
	let groupIndex = 0;
	let tempInteger = integerPart;

	if (integerPart === 0) {
		result = "ноль";
	} else {
		// Process each 3-digit group
		while (tempInteger > 0) {
			const group = tempInteger % 1000;

			if (group > 0) {
				const unitForm = getUnitForm(group, units[groupIndex]);
				const numberWord =
					groupIndex === 1
						? getGenderedNumber(group, groupIndex)
						: numToPr(group);

				result = `${numberWord}${unitForm ? ` ${unitForm}` : ""}${
					result ? ` ${result}` : ""
				}`;
			}

			tempInteger = Math.floor(tempInteger / 1000);
			groupIndex++;
		}
	}

	// Capitalize only the first letter of the result
	if (result.length > 0) {
		result = result.charAt(0).toUpperCase() + result.slice(1);
	}

	// Add currency and decimal part
	let currencyWord = "";
	let decimalWord = "";

	if (currency === "KZT") {
		currencyWord = getUnitForm(integerPart, ["тенге", "тенге", "тенге"]);
		decimalWord = `${decimalPart.toString().padStart(2, "0")} тиын`;
	} else if (currency === "USD") {
		currencyWord = getUnitForm(integerPart, ["доллар", "доллара", "долларов"]);
		decimalWord = `${decimalPart.toString().padStart(2, "0")} ${getUnitForm(
			decimalPart,
			["цент", "цента", "центов"],
		)}`;
	} else if (currency === "EUR") {
		currencyWord = getUnitForm(integerPart, ["евро", "евро", "евро"]);
		decimalWord = `${decimalPart.toString().padStart(2, "0")} ${getUnitForm(
			decimalPart,
			["цент", "цента", "центов"],
		)}`;
	} else if (currency === "RUB") {
		currencyWord = getUnitForm(integerPart, ["рубль", "рубля", "рублей"]);
		decimalWord = `${decimalPart.toString().padStart(2, "0")} ${getUnitForm(
			decimalPart,
			["копейка", "копейки", "копеек"],
		)}`;
	}

	return `${result} ${currencyWord} ${decimalWord}`;
}

// Example usage
// console.log(numToFullWords(1935000.00)); // "Один миллион девятьсот тридцать пять тысяч тенге 00 тиын"
// console.log(numToFullWords("1 935 000,00 KZT")); // "Один миллион девятьсот тридцать пять тысяч тенге 00 тиын"
