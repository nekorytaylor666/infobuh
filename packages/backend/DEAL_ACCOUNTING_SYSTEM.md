# Система учета баланса сделок

## Описание

Система интегрирует управление сделками с системой бухгалтерского учета, обеспечивая автоматическое создание проводок, отслеживание платежей и генерацию актов сверки.

## Основные функции

### 1. Типы сделок и автоматическая генерация документов

- **Услуги (service)**: При создании автоматически генерируется АВР (Акт выполненных работ)
- **Товары (product)**: При создании автоматически генерируется накладная

### 2. Автоматическое создание проводок

При создании сделки автоматически создается журнальная проводка:

- **Дебет**: Счет дебиторской задолженности
- **Кредит**: Счет доходов (услуги/товары)

При записи платежа создается проводка:

- **Дебет**: Счет денежных средств
- **Кредит**: Счет дебиторской задолженности

### 3. Интегрированная генерация документов

При создании сделки автоматически происходит:

- Создание сделки в базе данных
- Создание журнальных проводок
- Генерация соответствующего документа (АВР/накладная)
- Связывание документа со сделкой
- Автоматическое заполнение всех полей документа из базы данных

Система автоматически извлекает из базы данных:

- Данные юридического лица (название, адрес, БИН)
- Банковские реквизиты
- Информацию о сотрудниках (директор/ответственное лицо)
- Данные покупателя по БИНу
- Сведения о товарах/услугах

### 4. Отслеживание балансов

Система отслеживает:

- Общую сумму сделки
- Оплаченную сумму
- Остаток к доплате
- Статус сделки (черновик, активная, завершенная, отмененная)

### 5. Акты сверки

Генерируются автоматические отчеты с выявлением дисбалансов:

- Переплаты
- Недоплаты
- Несвязанные проводки

## API Endpoints

### Создание сделки с учетом и автоматической генерацией документов

```http
POST /deals/with-accounting?legalEntityId={id}
Content-Type: application/json

{
  "receiverBin": "123456789012",
  "title": "Консультационные услуги",
  "description": "Оказание консультационных услуг по налогообложению",
  "dealType": "service",
  "totalAmount": 500000,
  "currencyId": "currency-uuid",
  "accountsReceivableId": "accounts-receivable-uuid",
  "revenueAccountId": "revenue-account-uuid"
}
```

**Ответ:**

```json
{
  "deal": {
    "id": "deal-uuid",
    "title": "Консультационные услуги",
    "dealType": "service",
    "totalAmount": 500000,
    "status": "active"
  },
  "journalEntry": {
    "id": "journal-entry-uuid",
    "entryNumber": "JE-12345678",
    "description": "Услуги: Консультационные услуги",
    "status": "draft"
  },
  "document": {
    "success": true,
    "documentId": "document-uuid",
    "filePath": "/uploads/act-2024-001.pdf",
    "fileName": "act-2024-001.pdf",
    "documentType": "kazakh-acts"
  }
}
```

### Запись платежа

```http
POST /deals/{dealId}/payments?legalEntityId={id}
Content-Type: application/json

{
  "amount": 250000,
  "description": "Частичная оплата",
  "reference": "PAY-001",
  "currencyId": "currency-uuid",
  "cashAccountId": "cash-account-uuid",
  "accountsReceivableId": "accounts-receivable-uuid"
}
```

### Получение баланса сделки

```http
GET /deals/{dealId}/balance
```

Возвращает:

```json
{
  "dealId": "uuid",
  "totalAmount": 500000,
  "paidAmount": 250000,
  "remainingBalance": 250000,
  "journalEntries": [...]
}
```

### Генерация акта сверки

```http
GET /deals/{dealId}/reconciliation
```

Возвращает:

```json
{
  "dealId": "uuid",
  "dealTitle": "Консультационные услуги",
  "totalAmount": 500000,
  "paidAmount": 250000,
  "remainingBalance": 250000,
  "isBalanced": true,
  "discrepancies": [],
  "journalEntries": [...]
}
```

### Генерация документов

```http
POST /deals/{dealId}/generate-document
```

Генерирует соответствующий документ:

- **Услуги**: АВР (Акт выполненных работ)
- **Товары**: Накладная

## Схема базы данных

### Обновленная таблица deals

```sql
CREATE TABLE deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receiver_bin VARCHAR NOT NULL,
    title VARCHAR,
    description TEXT,
    deal_type VARCHAR(20) NOT NULL, -- 'service' или 'product'
    total_amount BIGINT NOT NULL,
    paid_amount BIGINT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'draft', -- 'draft', 'active', 'completed', 'cancelled'
    legal_entity_id UUID NOT NULL REFERENCES legal_entities(id),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### Таблица связи с проводками

```sql
CREATE TABLE deal_journal_entries (
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    journal_entry_id UUID NOT NULL,
    entry_type VARCHAR(20) NOT NULL, -- 'invoice', 'payment', 'adjustment'
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    PRIMARY KEY (deal_id, journal_entry_id)
);
```

## Бизнес-логика

### Статусы сделок

1. **draft**: Черновик сделки
2. **active**: Активная сделка (создана проводка)
3. **completed**: Завершенная сделка (полностью оплачена)
4. **cancelled**: Отмененная сделка

### Автоматические переходы статусов

- При создании сделки с учетом: draft → active
- При полной оплате: active → completed
- При отмене: любой статус → cancelled

### Валидация платежей

- Сумма платежа не может превышать остаток к доплате
- Платеж не может быть отрицательным
- Валюта платежа должна совпадать с валютой сделки

### Выявление дисбалансов

1. **Переплата**: paid_amount > total_amount
2. **Недоплата при завершении**: status = 'completed' и remaining_balance > 0
3. **Несвязанные проводки**: проводки без соответствующих записей в deal_journal_entries

## Интеграция с документооборотом

Система интегрируется с существующими шаблонами документов:

- `packages/document-templates/src/lib/templates/kazakh-acts/` - для АВР
- `packages/document-templates/src/lib/templates/kazakh-waybill/` - для накладных

## Примеры использования

### 1. Создание сделки на оказание услуг

```javascript
// 1. Создать сделку с автоматическими проводками
const dealResponse = await fetch(
  "/deals/with-accounting?legalEntityId=legal-entity-id",
  {
    method: "POST",
    body: JSON.stringify({
      receiverBin: "123456789012",
      title: "Консультационные услуги",
      dealType: "service",
      totalAmount: 500000,
      currencyId: "tenge-uuid",
      accountsReceivableId: "receivables-account-uuid",
      revenueAccountId: "service-revenue-account-uuid",
    }),
  }
);

// 2. Записать частичный платеж
const paymentResponse = await fetch(
  `/deals/${dealId}/payments?legalEntityId=legal-entity-id`,
  {
    method: "POST",
    body: JSON.stringify({
      amount: 250000,
      currencyId: "tenge-uuid",
      cashAccountId: "cash-account-uuid",
      accountsReceivableId: "receivables-account-uuid",
    }),
  }
);

// 3. Сгенерировать АВР
const documentResponse = await fetch(`/deals/${dealId}/generate-document`, {
  method: "POST",
});

// 4. Получить акт сверки
const reconciliationResponse = await fetch(`/deals/${dealId}/reconciliation`);
```

### 2. Создание сделки на продажу товаров

```javascript
// Аналогично, но с dealType: 'product' и соответствующими счетами товаров
```

## Мониторинг и отчетность

Система предоставляет возможности для:

- Отслеживания просроченной дебиторской задолженности
- Анализа оборачиваемости средств
- Контроля выполнения договорных обязательств
- Автоматического выявления ошибок в учете

## Безопасность

- Все операции требуют аутентификации пользователя
- Доступ ограничен рамками legal entity пользователя
- Все изменения логируются через систему аудита
- Транзакционная целостность обеспечивается на уровне базы данных
