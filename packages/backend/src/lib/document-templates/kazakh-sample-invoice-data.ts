/**
 * Sample data for Kazakh invoice matching the provided image
 */
export const kazakhSampleInvoiceData = {
	// Company info
	companyName: "Индивидуальный предприниматель INFOBUH",
	bin: "870716400841",
	kbe: "19",
	account: "KZ45998CTB00016944492",
	bik: "TSESKZKA",
	bank: "AO «Jusan Bank»",
	knp: "859",

	// Invoice details
	invoiceNumber: "23",
	invoiceDate: "08 декабря 2024 года",

	// Client info
	clientName: 'TOO "ФинБух"',
	clientBin: "221140002403",
	clientAddress: "РК, г. Астана, ул. 319, офис 1",

	// Contract details
	contractNumber: "345",
	contractDate: "01 ноября 2024 года",

	// Items
	items: [
		{
			code: "5000000697",
			description: "Проведение исследований",
			quantity: 1.0,
			unit: "усл.",
			price: 935000.0,
		},
		{
			code: "5000000697",
			description: "Проведение исследований",
			quantity: 1.0,
			unit: "усл.",
			price: 1000000.0,
		},
	],

	// Totals
	totalAmount: 1935000.0,
	vatAmount: 207321.43,

	// Additional info
	totalInWords: "Один миллион девятьсот тридцать пять тысяч тенге 00 тыын",
	contactPhone: "+7 701 4000595",

	// Logo URL (optional)
	logoUrl: "https://infobuh.kz/logo.png", // this would be replaced with your actual logo URL
};
