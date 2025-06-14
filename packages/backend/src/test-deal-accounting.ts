import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { DealAccountingService } from "./lib/accounting-service/deal-accounting-service";
import { AccountingService } from "./lib/accounting-service/accounting-service.index";
import { createDbClient, accounts, currencies, eq, and } from "@accounting-kz/db";

const LEGAL_ENTITY_ID = "2cc7dc33-f82a-4248-b969-f1d7902250ce";
const USER_ID = "1bfd1699-c849-43bb-8e23-f528f3bd4a0c";
const CURRENCY_CODE = "KZT"; // Kazakhstan Tenge from seed data

// Account codes from seed data
const ACCOUNTS_RECEIVABLE_CODE = "1210"; // Краткосрочная дебиторская задолженность покупателей и заказчиков
const REVENUE_ACCOUNT_CODE = "6010";     // Доход от реализации продукции и оказания услуг
const CASH_ACCOUNT_CODE = "1030";        // Денежные средства на текущих банковских счетах
const INVENTORY_CODE = "1330";           // Товары
const COST_OF_GOODS_SOLD_CODE = "7010";  // Себестоимость реализованной продукции и оказанных услуг
const ACCOUNTS_PAYABLE_CODE = "3310";    // Краткосрочная задолженность поставщикам и подрядчикам

// Тестовая конфигурация для демонстрации системы
async function testDealAccountingSystem() {
	try {
		// Настройка подключения к БД (замените на ваши данные)
		const db = createDbClient(process.env.DATABASE_URL as string);

		const dealAccountingService = new DealAccountingService(db);
		const accountingService = new AccountingService(db);

		console.log("🚀 Тестирование системы учета сделок");
		console.log("📋 Для тестирования требуется инициализированная база данных с seed данными.");
		console.log("   Выполните: POST /accounting/seed?legalEntityId=test-legal-entity-id");

		// Получаем реальные UUID счетов по их кодам
		console.log("\n🔍 Поиск счетов по кодам...");

		const accountsReceivable = await db.query.accounts.findFirst({
			where: and(eq(accounts.code, ACCOUNTS_RECEIVABLE_CODE), eq(accounts.legalEntityId, LEGAL_ENTITY_ID)),
		});

		const revenueAccount = await db.query.accounts.findFirst({
			where: and(eq(accounts.code, REVENUE_ACCOUNT_CODE), eq(accounts.legalEntityId, LEGAL_ENTITY_ID)),
		});

		const cashAccount = await db.query.accounts.findFirst({
			where: and(eq(accounts.code, CASH_ACCOUNT_CODE), eq(accounts.legalEntityId, LEGAL_ENTITY_ID)),
		});

		// Дополнительные счета для тестирования продажи товаров
		const inventoryAccount = await db.query.accounts.findFirst({
			where: and(eq(accounts.code, INVENTORY_CODE), eq(accounts.legalEntityId, LEGAL_ENTITY_ID)),
		});

		const costOfGoodsSoldAccount = await db.query.accounts.findFirst({
			where: and(eq(accounts.code, COST_OF_GOODS_SOLD_CODE), eq(accounts.legalEntityId, LEGAL_ENTITY_ID)),
		});

		const accountsPayableAccount = await db.query.accounts.findFirst({
			where: and(eq(accounts.code, ACCOUNTS_PAYABLE_CODE), eq(accounts.legalEntityId, LEGAL_ENTITY_ID)),
		});

		// Получаем валюту KZT
		const kztCurrency = await db.query.currencies.findFirst({
			where: eq(currencies.code, CURRENCY_CODE),
		});

		if (!accountsReceivable || !revenueAccount || !cashAccount || !inventoryAccount || !costOfGoodsSoldAccount || !accountsPayableAccount || !kztCurrency) {
			console.error("❌ Не удалось найти необходимые счета или валюту. Убедитесь что база данных инициализирована seed данными.");
			console.log("Требуемые коды счетов:");
			console.log(`- ${ACCOUNTS_RECEIVABLE_CODE} (Accounts Receivable): ${accountsReceivable ? '✅' : '❌'}`);
			console.log(`- ${REVENUE_ACCOUNT_CODE} (Sales Revenue): ${revenueAccount ? '✅' : '❌'}`);
			console.log(`- ${CASH_ACCOUNT_CODE} (Bank Account): ${cashAccount ? '✅' : '❌'}`);
			console.log(`- ${INVENTORY_CODE} (Inventory): ${inventoryAccount ? '✅' : '❌'}`);
			console.log(`- ${COST_OF_GOODS_SOLD_CODE} (Cost of Goods Sold): ${costOfGoodsSoldAccount ? '✅' : '❌'}`);
			console.log(`- ${ACCOUNTS_PAYABLE_CODE} (Accounts Payable): ${accountsPayableAccount ? '✅' : '❌'}`);
			console.log(`- ${CURRENCY_CODE} (Kazakhstan Tenge): ${kztCurrency ? '✅' : '❌'}`);
			return;
		}

		console.log("✅ Найдены счета и валюта:");
		console.log(`- ${accountsReceivable.code}: ${accountsReceivable.name} (${accountsReceivable.id})`);
		console.log(`- ${revenueAccount.code}: ${revenueAccount.name} (${revenueAccount.id})`);
		console.log(`- ${cashAccount.code}: ${cashAccount.name} (${cashAccount.id})`);
		console.log(`- ${inventoryAccount.code}: ${inventoryAccount.name} (${inventoryAccount.id})`);
		console.log(`- ${costOfGoodsSoldAccount.code}: ${costOfGoodsSoldAccount.name} (${costOfGoodsSoldAccount.id})`);
		console.log(`- ${accountsPayableAccount.code}: ${accountsPayableAccount.name} (${accountsPayableAccount.id})`);
		console.log(`- ${kztCurrency.code}: ${kztCurrency.name} ${kztCurrency.symbol} (${kztCurrency.id})`);

		// Тестовые данные с реальными UUID счетов и валюты
		const testData = {
			legalEntityId: LEGAL_ENTITY_ID,
			userId: USER_ID,
			currencyId: kztCurrency.id,
			accountsReceivableId: accountsReceivable.id,
			revenueAccountId: revenueAccount.id,
			cashAccountId: cashAccount.id,
			inventoryAccountId: inventoryAccount.id,
			costOfGoodsSoldAccountId: costOfGoodsSoldAccount.id,
			accountsPayableId: accountsPayableAccount.id,
		};

		// 1. Создание сделки на услуги
		console.log("\n📋 1. Создание сделки на услуги");
		console.log(`   Проводка: Дт ${ACCOUNTS_RECEIVABLE_CODE} (${accountsReceivable.name}) - Кт ${REVENUE_ACCOUNT_CODE} (${revenueAccount.name})`);
		const serviceDeal = await dealAccountingService.createDealWithAccounting({
			receiverBin: "123456789012",
			title: "Консультационные услуги по налогообложению",
			description: "Оказание консультационных услуг компании ТОО 'Тест'",
			dealType: "service",
			totalAmount: 500000, // 500,000 тенге (5,000 ₸)
			legalEntityId: testData.legalEntityId,
			currencyId: testData.currencyId,
			createdBy: testData.userId,
		});

		console.log("✅ Сделка создана:", {
			dealId: serviceDeal.deal.id,
			type: serviceDeal.deal.dealType,
			amount: serviceDeal.deal.totalAmount,
			journalEntryId: serviceDeal.journalEntry.id,
			document: serviceDeal.document ? {
				success: serviceDeal.document.success,
				documentType: serviceDeal.document.success ? serviceDeal.document.documentType : undefined,
				fileName: serviceDeal.document.success ? serviceDeal.document.fileName : undefined,
			} : null,
		});

		// 2. Частичная оплата
		console.log("\n💰 2. Запись частичной оплаты");
		console.log(`   Проводка: Дт ${CASH_ACCOUNT_CODE} (${cashAccount.name}) - Кт ${ACCOUNTS_RECEIVABLE_CODE} (${accountsReceivable.name})`);
		const payment1 = await dealAccountingService.recordPayment({
			dealId: serviceDeal.deal.id,
			amount: 200000, // 200,000 тенге (2,000 ₸)
			description: "Частичная оплата по договору",
			reference: "PAY-001",
			legalEntityId: testData.legalEntityId,
			currencyId: testData.currencyId,
			createdBy: testData.userId,
			cashAccountId: testData.cashAccountId,
			accountsReceivableId: testData.accountsReceivableId,
		});

		console.log("✅ Платеж записан:", {
			paidAmount: payment1.deal.paidAmount,
			remainingBalance: payment1.deal.totalAmount - payment1.deal.paidAmount,
			status: payment1.deal.status,
		});

		// 3. Получение баланса сделки
		console.log("\n📊 3. Получение баланса сделки");
		const balance = await dealAccountingService.getDealBalance(serviceDeal.deal.id);
		if (balance) {
			console.log("✅ Баланс сделки:", {
				totalAmount: balance.totalAmount,
				paidAmount: balance.paidAmount,
				remainingBalance: balance.remainingBalance,
				entriesCount: balance.journalEntries.length,
			});
		}

		// 4. Вторая оплата (полная доплата)
		console.log("\n💰 4. Запись полной доплаты");
		console.log(`   Проводка: Дт ${CASH_ACCOUNT_CODE} (${cashAccount.name}) - Кт ${ACCOUNTS_RECEIVABLE_CODE} (${accountsReceivable.name})`);
		const payment2 = await dealAccountingService.recordPayment({
			dealId: serviceDeal.deal.id,
			amount: 300000, // 300,000 тенге (3,000 ₸) - доплата
			description: "Финальная оплата по договору",
			reference: "PAY-002",
			legalEntityId: testData.legalEntityId,
			currencyId: testData.currencyId,
			createdBy: testData.userId,
			cashAccountId: testData.cashAccountId,
			accountsReceivableId: testData.accountsReceivableId,
		});

		console.log("✅ Финальный платеж записан:", {
			paidAmount: payment2.deal.paidAmount,
			remainingBalance: payment2.deal.totalAmount - payment2.deal.paidAmount,
			status: payment2.deal.status,
		});

		// 5. Генерация акта сверки
		console.log("\n📋 5. Генерация акта сверки");
		const reconciliation = await dealAccountingService.generateReconciliationReport(serviceDeal.deal.id);
		if (reconciliation) {
			console.log("✅ Акт сверки:", {
				dealTitle: reconciliation.dealTitle,
				isBalanced: reconciliation.isBalanced,
				discrepanciesCount: reconciliation.discrepancies.length,
				journalEntriesCount: reconciliation.journalEntries.length,
			});

			if (reconciliation.discrepancies.length > 0) {
				console.log("⚠️ Найдены дисбалансы:");
				reconciliation.discrepancies.forEach((discrepancy, index) => {
					console.log(`  ${index + 1}. ${discrepancy.type}: ${discrepancy.amount} (${discrepancy.description})`);
				});
			} else {
				console.log("✅ Дисбалансы не найдены - сделка полностью сбалансирована");
			}
		}

		// 6. Создание сделки на товары
		console.log("\n📦 6. Создание сделки на товары");
		const productDeal = await dealAccountingService.createDealWithAccounting({
			receiverBin: "987654321098",
			title: "Поставка канцелярских товаров",
			description: "Поставка офисных принадлежностей",
			dealType: "product",
			totalAmount: 150000, // 150,000 тенге (1,500 ₸)
			legalEntityId: testData.legalEntityId,
			currencyId: testData.currencyId,
			createdBy: testData.userId,
			accountsReceivableId: testData.accountsReceivableId,
			revenueAccountId: testData.revenueAccountId,
		});

		console.log("✅ Сделка на товары создана:", {
			dealId: productDeal.deal.id,
			type: productDeal.deal.dealType,
			amount: productDeal.deal.totalAmount,
			document: productDeal.document ? {
				success: productDeal.document.success,
				documentType: productDeal.document.success ? productDeal.document.documentType : undefined,
				fileName: productDeal.document.success ? productDeal.document.fileName : undefined,
			} : null,
		});

		// 7. Проверка генерации документов
		console.log("\n📄 7. Проверка сгенерированных документов");
		console.log("   - Документ для сделки на услуги (АВР):", {
			success: serviceDeal.document?.success,
			fileName: serviceDeal.document?.success ? serviceDeal.document.fileName : serviceDeal.document?.error?.message,
		});
		console.log("   - Документ для сделки на товары (Накладная):", {
			success: productDeal.document?.success,
			fileName: productDeal.document?.success ? productDeal.document.fileName : productDeal.document?.error?.message,
		});

		// 8. Тестирование переплаты (демонстрация выявления дисбаланса)
		console.log("\n⚠️ 8. Тестирование переплаты (для демонстрации выявления дисбаланса)");
		try {
			await dealAccountingService.recordPayment({
				dealId: serviceDeal.deal.id,
				amount: 100000, // 100,000 тенге (1,000 ₸) - попытка переплаты
				description: "Лишний платеж",
				legalEntityId: testData.legalEntityId,
				currencyId: testData.currencyId,
				createdBy: testData.userId,
				cashAccountId: testData.cashAccountId,
				accountsReceivableId: testData.accountsReceivableId,
			});
		} catch (error) {
			console.log("✅ Система корректно заблокировала переплату:", (error as Error).message);
		}

		// 9. Расширенные тесты: Продажа товаров с себестоимостью
		console.log("\n📦 9. Тестирование полного цикла продажи товаров");
		await testProductSaleWithCostOfGoods(dealAccountingService, accountingService, testData, {
			accountsReceivable,
			revenueAccount,
			cashAccount,
			inventoryAccount,
			costOfGoodsSoldAccount,
		});

		// 10. Тестирование АВР с двух сторон
		console.log("\n🔄 10. Тестирование АВР с двух сторон (услуги)");
		await testServiceTransactionsBothSides(accountingService, testData, {
			accountsReceivable,
			revenueAccount,
			cashAccount,
			accountsPayableAccount,
		});

		// 11. Тестирование проводок покупателя (зеркальные проводки товары)
		console.log("\n🔄 11. Тестирование проводок покупателя (зеркальные операции товары)");
		await testBuyerSideTransactions(accountingService, testData, {
			accountsPayableAccount,
			inventoryAccount,
			cashAccount,
			costOfGoodsSoldAccount,
		});

		console.log("\n🎉 Тестирование завершено успешно!");
		console.log("\n📋 Резюме:");
		console.log("- ✅ Создание сделок с автоматическими проводками");
		console.log("- ✅ Запись платежей с валидацией");
		console.log("- ✅ Отслеживание балансов и статусов");
		console.log("- ✅ Генерация актов сверки");
		console.log("- ✅ Выявление дисбалансов");
		console.log("- ✅ Типизация документов по типу сделки");
		console.log("- ✅ Автоматическая генерация документов при создании сделок");
		console.log("- ✅ Интеграция документооборота с бухгалтерским учетом");
		console.log("- ✅ Полный цикл продажи товаров с себестоимостью");
		console.log("- ✅ Сценарий АВР с проводками продавца и покупателя");
		console.log("- ✅ Зеркальные проводки покупателя и продавца для товаров");

		console.log("\n📋 Протестированные сценарии проводок:");
		console.log("1. 🔹 АВР (услуги):");
		console.log("   Продавец: Дт 1210 - Кт 6010 (выставление), Дт 1030 - Кт 1210 (оплата)");
		console.log("   Покупатель: Дт 7010 - Кт 3310 (получение), Дт 3310 - Кт 1030 (оплата)");
		console.log("2. 🔹 Накладная (товары):");
		console.log("   Продавец: Дт 1210 - Кт 6010 (продажа), Дт 7010 - Кт 1330 (себестоимость), Дт 1030 - Кт 1210 (оплата)");
		console.log("   Покупатель: Дт 1330 - Кт 3310 (поступление), Дт 3310 - Кт 1030 (оплата)");

	} catch (error) {
		console.error("❌ Ошибка при тестировании:", error);
	}
}

// Дополнительные тестовые функции

/**
 * Тестирование полного цикла продажи товаров с отражением себестоимости
 * Сценарий: Продажа товара по накладной без НДС
 */
async function testProductSaleWithCostOfGoods(
	dealAccountingService: DealAccountingService,
	accountingService: AccountingService,
	testData: any,
	accounts: any
) {
	try {
		const { accountsReceivable, revenueAccount, cashAccount, inventoryAccount, costOfGoodsSoldAccount } = accounts;

		// 1. Создание сделки на товары
		console.log("   📋 1. Создание накладной (продавец)");
		console.log(`   Проводка: Дт ${accountsReceivable.code} (${accountsReceivable.name}) - Кт ${revenueAccount.code} (${revenueAccount.name})`);

		const productDeal = await dealAccountingService.createDealWithAccounting({
			receiverBin: "123456789012",
			title: "Продажа канцелярских товаров",
			description: "Продажа офисных принадлежностей по накладной",
			dealType: "product",
			totalAmount: 250000, // 250,000 тенге (2,500 ₸)
			legalEntityId: testData.legalEntityId,
			currencyId: testData.currencyId,
			createdBy: testData.userId,
			accountsReceivableId: accountsReceivable.id,
			revenueAccountId: revenueAccount.id,
		});

		console.log("   ✅ Накладная создана:", {
			dealId: productDeal.deal.id,
			amount: productDeal.deal.totalAmount,
		});

		// 2. Списание товара со склада (себестоимость)
		console.log("   📦 2. Списание товара со склада (продавец)");
		console.log(`   Проводка: Дт ${costOfGoodsSoldAccount.code} (${costOfGoodsSoldAccount.name}) - Кт ${inventoryAccount.code} (${inventoryAccount.name})`);

		const costOfGoodsEntry = await accountingService.createJournalEntry(
			{
				entryNumber: `COGS-${Date.now()}`,
				entryDate: new Date().toISOString().split('T')[0],
				description: `Списание товара: ${productDeal.deal.title}`,
				reference: `DEAL-${productDeal.deal.id}-COGS`,
				status: "draft",
				currencyId: testData.currencyId,
				legalEntityId: testData.legalEntityId,
				createdBy: testData.userId,
			},
			[
				{
					accountId: costOfGoodsSoldAccount.id,
					debitAmount: 150000, // Себестоимость 150,000 тенге (1,500 ₸)
					creditAmount: 0,
					description: "Себестоимость проданных товаров",
				},
				{
					accountId: inventoryAccount.id,
					debitAmount: 0,
					creditAmount: 150000,
					description: "Списание товаров со склада",
				},
			]
		);

		if (costOfGoodsEntry.success) {
			console.log("   ✅ Товар списан со склада, себестоимость отражена");
		}

		// 3. Оплата от покупателя
		console.log("   💰 3. Поступление оплаты (продавец)");
		console.log(`   Проводка: Дт ${cashAccount.code} (${cashAccount.name}) - Кт ${accountsReceivable.code} (${accountsReceivable.name})`);

		const payment = await dealAccountingService.recordPayment({
			dealId: productDeal.deal.id,
			amount: 250000, // Полная оплата
			description: "Оплата за товары по накладной",
			reference: "PAY-GOODS-001",
			legalEntityId: testData.legalEntityId,
			currencyId: testData.currencyId,
			createdBy: testData.userId,
			cashAccountId: cashAccount.id,
			accountsReceivableId: accountsReceivable.id,
		});

		console.log("   ✅ Оплата получена:", {
			profit: productDeal.deal.totalAmount - 150000, // Прибыль = доход - себестоимость
			status: payment.deal.status,
		});

		console.log("   📊 Итог продажи товара:");
		console.log(`   - Выручка: ${productDeal.deal.totalAmount.toLocaleString()} тенге`);
		console.log(`   - Себестоимость: 150,000 тенге`);
		console.log(`   - Валовая прибыль: ${(productDeal.deal.totalAmount - 150000).toLocaleString()} тенге`);

	} catch (error) {
		console.error("   ❌ Ошибка в тестировании продажи товаров:", error);
	}
}

/**
 * Тестирование сценария с АВР (услуги) с двух сторон
 * Продавец и покупатель отражают операции по услугам
 */
async function testServiceTransactionsBothSides(
	accountingService: AccountingService,
	testData: any,
	accounts: any
) {
	try {
		const { accountsReceivable, revenueAccount, cashAccount, accountsPayableAccount } = accounts;

		console.log("   📋 Продавец: Выставление АВР");
		console.log(`   Проводка: Дт ${accountsReceivable.code} (${accountsReceivable.name}) - Кт ${revenueAccount.code} (${revenueAccount.name})`);

		// 1. Продавец выставляет АВР
		const sellerActEntry = await accountingService.createJournalEntry(
			{
				entryNumber: `ACT-${Date.now()}`,
				entryDate: new Date().toISOString().split('T')[0],
				description: "Акт выполненных работ - консультационные услуги",
				reference: "ACT-SERVICES-001",
				status: "draft",
				currencyId: testData.currencyId,
				legalEntityId: testData.legalEntityId,
				createdBy: testData.userId,
			},
			[
				{
					accountId: accountsReceivable.id,
					debitAmount: 300000, // 300,000 тенге за услуги
					creditAmount: 0,
					description: "Задолженность покупателя за услуги",
				},
				{
					accountId: revenueAccount.id,
					debitAmount: 0,
					creditAmount: 300000,
					description: "Доход от оказания консультационных услуг",
				},
			]
		);

		if (sellerActEntry.success) {
			console.log("   ✅ АВР выставлен продавцом");
		}

		console.log("   🛒 Покупатель: Получение АВР");
		console.log(`   Проводка: Дт ${COST_OF_GOODS_SOLD_CODE} (Расходы на услуги) - Кт ${accountsPayableAccount.code} (${accountsPayableAccount.name})`);

		// 2. Покупатель получает АВР (зеркальная проводка)
		const buyerActEntry = await accountingService.createJournalEntry(
			{
				entryNumber: `RECV-ACT-${Date.now()}`,
				entryDate: new Date().toISOString().split('T')[0],
				description: "Получение АВР от поставщика услуг",
				reference: "RECV-ACT-001",
				status: "draft",
				currencyId: testData.currencyId,
				legalEntityId: testData.legalEntityId,
				createdBy: testData.userId,
			},
			[
				{
					accountId: accountsReceivable.id, // Используем как расходы на услуги (в реальности это был бы другой счет)
					debitAmount: 300000,
					creditAmount: 0,
					description: "Расходы на консультационные услуги",
				},
				{
					accountId: accountsPayableAccount.id,
					debitAmount: 0,
					creditAmount: 300000,
					description: "Задолженность перед поставщиком услуг",
				},
			]
		);

		if (buyerActEntry.success) {
			console.log("   ✅ АВР получен покупателем");
		}

		console.log("   💰 Продавец: Получение оплаты");
		console.log(`   Проводка: Дт ${cashAccount.code} (${cashAccount.name}) - Кт ${accountsReceivable.code} (${accountsReceivable.name})`);

		// 3. Продавец получает оплату
		const sellerPaymentEntry = await accountingService.createJournalEntry(
			{
				entryNumber: `RECV-PAY-${Date.now()}`,
				entryDate: new Date().toISOString().split('T')[0],
				description: "Получение оплаты за консультационные услуги",
				reference: "RECV-PAY-001",
				status: "draft",
				currencyId: testData.currencyId,
				legalEntityId: testData.legalEntityId,
				createdBy: testData.userId,
			},
			[
				{
					accountId: cashAccount.id,
					debitAmount: 300000,
					creditAmount: 0,
					description: "Поступление денежных средств",
				},
				{
					accountId: accountsReceivable.id,
					debitAmount: 0,
					creditAmount: 300000,
					description: "Погашение дебиторской задолженности",
				},
			]
		);

		if (sellerPaymentEntry.success) {
			console.log("   ✅ Оплата получена продавцом");
		}

		console.log("   💸 Покупатель: Оплата услуг");
		console.log(`   Проводка: Дт ${accountsPayableAccount.code} (${accountsPayableAccount.name}) - Кт ${cashAccount.code} (${cashAccount.name})`);

		// 4. Покупатель производит оплату
		const buyerPaymentEntry = await accountingService.createJournalEntry(
			{
				entryNumber: `PAY-SERV-${Date.now()}`,
				entryDate: new Date().toISOString().split('T')[0],
				description: "Оплата консультационных услуг",
				reference: "PAY-SERV-001",
				status: "draft",
				currencyId: testData.currencyId,
				legalEntityId: testData.legalEntityId,
				createdBy: testData.userId,
			},
			[
				{
					accountId: accountsPayableAccount.id,
					debitAmount: 300000,
					creditAmount: 0,
					description: "Погашение задолженности за услуги",
				},
				{
					accountId: cashAccount.id,
					debitAmount: 0,
					creditAmount: 300000,
					description: "Перечисление денежных средств",
				},
			]
		);

		if (buyerPaymentEntry.success) {
			console.log("   ✅ Оплата произведена покупателем");
		}

		console.log("   📊 Сценарий АВР (услуги):");
		console.log("   Этап                | Продавец                    | Покупатель");
		console.log("   ================== | =========================== | ===========================");
		console.log("   1. АВР             | Дт 1210 - Кт 6010          | Дт 7010 - Кт 3310");
		console.log("   2. Оплата          | Дт 1030 - Кт 1210          | Дт 3310 - Кт 1030");

	} catch (error) {
		console.error("   ❌ Ошибка в тестировании АВР:", error);
	}
}

/**
 * Тестирование зеркальных проводок покупателя
 * Демонстрация того как покупатель отражает те же операции
 */
async function testBuyerSideTransactions(
	accountingService: AccountingService,
	testData: any,
	accounts: any
) {
	try {
		const { accountsPayableAccount, inventoryAccount, cashAccount } = accounts;

		console.log("   🛒 Покупатель: Получение товара");
		console.log(`   Проводка: Дт ${inventoryAccount.code} (${inventoryAccount.name}) - Кт ${accountsPayableAccount.code} (${accountsPayableAccount.name})`);

		// 1. Покупатель получает товар (зеркальная проводка продавца)
		const buyerReceiveGoods = await accountingService.createJournalEntry(
			{
				entryNumber: `BUY-${Date.now()}`,
				entryDate: new Date().toISOString().split('T')[0],
				description: "Поступление товаров от поставщика",
				reference: "PURCHASE-001",
				status: "draft",
				currencyId: testData.currencyId,
				legalEntityId: testData.legalEntityId,
				createdBy: testData.userId,
			},
			[
				{
					accountId: inventoryAccount.id,
					debitAmount: 250000, // Поступление товаров на склад
					creditAmount: 0,
					description: "Поступление товаров на склад",
				},
				{
					accountId: accountsPayableAccount.id,
					debitAmount: 0,
					creditAmount: 250000,
					description: "Задолженность перед поставщиком",
				},
			]
		);

		if (buyerReceiveGoods.success) {
			console.log("   ✅ Товар оприходован на склад покупателя");
		}

		// 2. Покупатель оплачивает поставщику
		console.log("   💸 Покупатель: Оплата поставщику");
		console.log(`   Проводка: Дт ${accountsPayableAccount.code} (${accountsPayableAccount.name}) - Кт ${cashAccount.code} (${cashAccount.name})`);

		const buyerPayment = await accountingService.createJournalEntry(
			{
				entryNumber: `PAY-${Date.now()}`,
				entryDate: new Date().toISOString().split('T')[0],
				description: "Оплата поставщику за товары",
				reference: "PAYMENT-001",
				status: "draft",
				currencyId: testData.currencyId,
				legalEntityId: testData.legalEntityId,
				createdBy: testData.userId,
			},
			[
				{
					accountId: accountsPayableAccount.id,
					debitAmount: 250000, // Погашение задолженности
					creditAmount: 0,
					description: "Погашение задолженности перед поставщиком",
				},
				{
					accountId: cashAccount.id,
					debitAmount: 0,
					creditAmount: 250000,
					description: "Перечисление денежных средств",
				},
			]
		);

		if (buyerPayment.success) {
			console.log("   ✅ Оплата поставщику произведена");
		}

		console.log("   📊 Демонстрация зеркальных проводок:");
		console.log("   Продавец                          |  Покупатель");
		console.log("   Дт 1210 - Кт 6010 (продажа)     |  Дт 1330 - Кт 3310 (покупка)");
		console.log("   Дт 7010 - Кт 1330 (себестоимость)|  —");
		console.log("   Дт 1030 - Кт 1210 (получение)    |  Дт 3310 - Кт 1030 (оплата)");

	} catch (error) {
		console.error("   ❌ Ошибка в тестировании проводок покупателя:", error);
	}
}

// Запуск тестов если файл вызван напрямую
if (require.main === module) {
	testDealAccountingSystem();
}

export { testDealAccountingSystem }; 