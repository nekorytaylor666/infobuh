import type { NewAccount, NewCurrency } from "@accounting-kz/db";

// Base currency setup for Kazakhstan
export const baseCurrency: NewCurrency = {
	code: "KZT",
	name: "Kazakhstani Tenge",
	symbol: "₸",
	decimals: 2,
	isBaseCurrency: true,
	isActive: true,
};

export const additionalCurrencies: NewCurrency[] = [
	{
		code: "USD",
		name: "US Dollar",
		symbol: "$",
		decimals: 2,
		isBaseCurrency: false,
		isActive: true,
	},
	{
		code: "EUR",
		name: "Euro",
		symbol: "€",
		decimals: 2,
		isBaseCurrency: false,
		isActive: true,
	},
	{
		code: "RUB",
		name: "Russian Ruble",
		symbol: "₽",
		decimals: 2,
		isBaseCurrency: false,
		isActive: true,
	},
];

// Kazakhstan Chart of Accounts based on official local standards
export const kazakhstanChartOfAccounts: (Omit<NewAccount, "parentId" | "legalEntityId"> & {
	parentCode?: string;
})[] = [
		// CASH AND CASH EQUIVALENTS (1010-1090)
		{
			code: "1010",
			name: "Денежные средства в кассе",
			accountType: "asset",
			description: "Cash on hand",
			isActive: true,
		},
		{
			code: "1030",
			name: "Денежные средства на текущих банковских счетах",
			accountType: "asset",
			description: "Money in current bank accounts",
			isActive: true,
		},
		{
			code: "1050",
			name: "Денежные средства на сберегательных счетах",
			accountType: "asset",
			description: "Money in savings accounts",
			isActive: true,
		},

		// SHORT-TERM RECEIVABLES (1210-1280)
		{
			code: "1210",
			name: "Краткосрочная дебиторская задолженность покупателей и заказчиков",
			accountType: "asset",
			description: "Short-term receivables from buyers and customers",
			isActive: true,
		},
		{
			code: "1251",
			name: "Краткосрочная задолженность подотчетных лиц",
			accountType: "asset",
			description: "Short-term advances to accountable persons",
			isActive: true,
		},
		{
			code: "1280",
			name: "Оценочный резерв под убытки от обесценения краткосрочной дебиторской задолженности",
			accountType: "asset",
			description: "Provision for impairment of short-term receivables",
			isActive: true,
		},

		// INVENTORY (1310-1370)
		{
			code: "1310",
			name: "Сырье и материалы",
			accountType: "asset",
			description: "Raw materials and supplies",
			isActive: true,
		},
		{
			code: "1320",
			name: "Готовая продукция",
			accountType: "asset",
			description: "Finished goods",
			isActive: true,
		},
		{
			code: "1330",
			name: "Товары",
			accountType: "asset",
			description: "Merchandise inventory",
			isActive: true,
		},

		// TAX ASSETS (1410-1430)
		{
			code: "1421",
			name: "Налог на добавленную стоимость к возмещению",
			accountType: "asset",
			description: "VAT recoverable",
			isActive: true,
		},

		// LONG-TERM RECEIVABLES (2110-2180)
		{
			code: "2110",
			name: "Долгосрочная задолженность покупателей и заказчиков",
			accountType: "asset",
			description: "Long-term receivables from buyers and customers",
			isActive: true,
		},

		// FIXED ASSETS (2410-2460)
		{
			code: "2410",
			name: "Основные средства",
			accountType: "asset",
			description: "Property, plant and equipment",
			isActive: true,
		},
		{
			code: "2420",
			name: "Амортизация основных средств",
			accountType: "asset",
			description: "Accumulated depreciation of PPE",
			isActive: true,
		},

		// INTANGIBLE ASSETS (2710-2780)
		{
			code: "2730",
			name: "Прочие нематериальные активы",
			accountType: "asset",
			description: "Other intangible assets",
			isActive: true,
		},
		{
			code: "2740",
			name: "Амортизация прочих нематериальных активов",
			accountType: "asset",
			description: "Accumulated amortization of intangible assets",
			isActive: true,
		},

		// SHORT-TERM FINANCIAL LIABILITIES (3010-3080)
		{
			code: "3010",
			name: "Краткосрочные финансовые обязательства, оцениваемые по амортизированной стоимости",
			accountType: "liability",
			description: "Short-term financial liabilities at amortized cost",
			isActive: true,
		},

		// TAX LIABILITIES (3110-3190)
		{
			code: "3110",
			name: "Корпоративный подоходный налог подлежащий уплате",
			accountType: "liability",
			description: "Corporate income tax payable",
			isActive: true,
		},
		{
			code: "3120",
			name: "Индивидуальный подоходный налог",
			accountType: "liability",
			description: "Individual income tax payable",
			isActive: true,
		},
		{
			code: "3130",
			name: "Налог на добавленную стоимость",
			accountType: "liability",
			description: "VAT payable",
			isActive: true,
		},
		{
			code: "3190",
			name: "Прочие налоги",
			accountType: "liability",
			description: "Other taxes payable",
			isActive: true,
		},

		// SOCIAL CONTRIBUTIONS (3211-3240)
		{
			code: "3211",
			name: "Обязательства по социальным отчислениям",
			accountType: "liability",
			description: "Social contribution obligations",
			isActive: true,
		},
		{
			code: "3220",
			name: "Обязательства по пенсионным отчислениям",
			accountType: "liability",
			description: "Pension contribution obligations",
			isActive: true,
		},

		// TRADE PAYABLES (3310-3387)
		{
			code: "3310",
			name: "Краткосрочная задолженность поставщикам и подрядчикам",
			accountType: "liability",
			description: "Short-term payables to suppliers and contractors",
			isActive: true,
		},
		{
			code: "3350",
			name: "Краткосрочная задолженность по оплате труда",
			accountType: "liability",
			description: "Short-term payroll liabilities",
			isActive: true,
		},

		// LONG-TERM FINANCIAL LIABILITIES (4010-4060)
		{
			code: "4010",
			name: "Долгосрочные финансовые обязательства, оцениваемые по амортизированной стоимости",
			accountType: "liability",
			description: "Long-term financial liabilities at amortized cost",
			isActive: true,
		},

		// EQUITY (5010-5710)
		{
			code: "5010",
			name: "Простые акции",
			accountType: "equity",
			description: "Common shares",
			isActive: true,
		},
		{
			code: "5610",
			name: "Нераспределенная прибыль непокрытый убыток отчетного года",
			accountType: "equity",
			description: "Retained earnings/accumulated loss for current year",
			isActive: true,
		},
		{
			code: "5620",
			name: "Нераспределенная прибыль непокрытый убыток предыдущих лет",
			accountType: "equity",
			description: "Retained earnings/accumulated loss from previous years",
			isActive: true,
		},

		// REVENUE (6010-6420)
		{
			code: "6010",
			name: "Доход от реализации продукции и оказания услуг",
			accountType: "revenue",
			description: "Revenue from sale of products and services",
			isActive: true,
		},
		{
			code: "6110",
			name: "Доходы по вознаграждениям",
			accountType: "revenue",
			description: "Interest income",
			isActive: true,
		},
		{
			code: "6210",
			name: "Доходы от выбытия активов",
			accountType: "revenue",
			description: "Gains on disposal of assets",
			isActive: true,
		},
		{
			code: "6290",
			name: "Прочие доходы",
			accountType: "revenue",
			description: "Other income",
			isActive: true,
		},

		// EXPENSES (7010-7710)
		{
			code: "7010",
			name: "Себестоимость реализованной продукции и оказанных услуг",
			accountType: "expense",
			description: "Cost of goods sold and services rendered",
			isActive: true,
		},
		{
			code: "7110",
			name: "Расходы по реализации продукции и оказанию услуг",
			accountType: "expense",
			description: "Selling expenses",
			isActive: true,
		},
		{
			code: "7210",
			name: "Административные расходы",
			accountType: "expense",
			description: "Administrative expenses",
			isActive: true,
		},
		{
			code: "7310",
			name: "Расходы по вознаграждениям",
			accountType: "expense",
			description: "Interest expenses",
			isActive: true,
		},
		{
			code: "7410",
			name: "Расходы по выбытию активов",
			accountType: "expense",
			description: "Losses on disposal of assets",
			isActive: true,
		},
		{
			code: "7480",
			name: "Прочие расходы",
			accountType: "expense",
			description: "Other expenses",
			isActive: true,
		},
		{
			code: "7710",
			name: "Расходы по корпоративному подоходному налогу",
			accountType: "expense",
			description: "Corporate income tax expense",
			isActive: true,
		},

		// PRODUCTION ACCOUNTS (8110-8410)
		{
			code: "8110",
			name: "Основное производство",
			accountType: "expense",
			description: "Main production",
			isActive: true,
		},
	];
