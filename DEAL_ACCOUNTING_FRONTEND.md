# Deal Accounting Frontend Interface

## Overview

The Deal Accounting Frontend is a comprehensive React interface that provides a complete testing environment for the deal accounting system. It integrates with the backend API to demonstrate all features including deal creation, payment recording, balance tracking, and reconciliation reporting.

## Features

### 🔧 **Core Functionality**

- **Deal Creation**: Create service (АВР) and product (накладная) deals with automatic accounting integration
- **Payment Recording**: Record payments with automatic journal entry generation
- **Balance Tracking**: Real-time balance monitoring with detailed breakdown
- **Reconciliation Reports**: Detect and report payment discrepancies
- **Document Generation**: Generate appropriate documents based on deal type

### 📊 **User Interface**

- **Tabbed Interface**: 5 main sections for organized workflow
- **Real-time Updates**: Live balance and status updates
- **Responsive Design**: Modern, clean interface with proper spacing
- **Kazakhstan Localization**: Kazakh Tenge (KZT) currency formatting and Russian labels

## Interface Sections

### 1. **Создать Сделку** (Create Deal)

Create new deals with automatic accounting integration:

**Form Fields:**

- **Тип Сделки** (Deal Type): Service (АВР) or Product (накладная)
- **Контрагент** (Counterparty): Customer/client name
- **Сумма** (Amount): Deal amount in KZT
- **Описание** (Description): Optional deal description

**Automatic Processing:**

- Creates journal entry: Дт 1121 (Trade Receivables) - Кт 4110 (Sales Revenue)
- Generates appropriate document (АВР for services, накладная for products)
- Sets deal status to 'active'

### 2. **Список Сделок** (Deal List)

View and manage all created deals:

**Display Information:**

- Counterparty name with status badges
- Deal type indicator (Service/Product)
- Creation timestamp
- Total amount and paid amount
- Deal status (Draft/Active/Completed/Cancelled)

**Interaction:**

- Click to select deal for further operations
- Visual selection feedback
- Real-time balance updates

### 3. **Платежи** (Payments)

Record payments against selected deals:

**Payment Form:**

- **Сумма Платежа** (Payment Amount): Amount received
- **Описание** (Description): Payment description

**Selected Deal Display:**

- Deal details with remaining balance
- Visual confirmation of selected deal

**Automatic Processing:**

- Creates journal entry: Дт 1112 (Bank Account KZT) - Кт 1121 (Trade Receivables)
- Updates deal paid amount
- Validates payment doesn't exceed deal amount

### 4. **Баланс** (Balance)

Detailed balance information for selected deals:

**Balance Metrics:**

- **Общая Сумма** (Total Amount): Original deal amount
- **Оплачено** (Paid): Total payments received
- **Остаток** (Remaining): Outstanding balance

**Payment Status:**

- ✅ Полностью Оплачено (Fully Paid)
- ⏳ Ожидает Оплаты (Awaiting Payment)

**Journal Entries:**

- Complete list of all journal entries for the deal
- Entry details: Debit/Credit accounts, amounts, descriptions, timestamps

### 5. **Сверка** (Reconciliation)

Comprehensive reconciliation reporting:

**Reconciliation Metrics:**

- Deal amount vs. payments received
- Discrepancy calculation
- Status determination (Balanced/Overpaid/Underpaid)

**Status Indicators:**

- 🟢 Сбалансировано (Balanced): Payments match deal amount
- 🔴 Переплата (Overpaid): Payments exceed deal amount
- 🟡 Недоплата (Underpaid): Payments less than deal amount

**Unmatched Entries:**

- Highlights journal entries that don't match expected patterns
- Visual warning for accounting discrepancies

**Document Generation:**

- Generate documents for existing deals
- Support for both АВР and накладная document types

## Technical Implementation

### **State Management**

```typescript
// Core state
const [deals, setDeals] = useState<Deal[]>([])
const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
const [balanceInfo, setBalanceInfo] = useState<BalanceResponse | null>(null)
const [reconciliationReport, setReconciliationReport] = useState<ReconciliationReport | null>(null)

// Form state
const [dealForm, setDealForm] = useState({...})
const [paymentForm, setPaymentForm] = useState({...})
```

### **API Integration**

```typescript
// Deal creation
const response = await api.post<DealResponse>('/deals/with-accounting', {...})

// Payment recording
const response = await api.post<PaymentResponse>(`/deals/${dealId}/payments`, {...})

// Balance retrieval
const response = await api.get<BalanceResponse>(`/deals/${dealId}/balance`)

// Reconciliation report
const response = await api.get<ReconciliationReport>(`/deals/${dealId}/reconciliation`)
```

### **Error Handling**

- Comprehensive try-catch blocks for all API calls
- User-friendly error messages via toast notifications
- Validation for required fields and business rules
- Loading states during API operations

### **UI Components**

- **shadcn/ui** components for consistent design
- **Tabs** for section organization
- **Cards** for content grouping
- **Badges** for status indicators
- **Buttons** with loading states
- **Toast** notifications for user feedback

## Testing Scenarios

### **Basic Deal Flow**

1. Create a service deal for 100,000 KZT
2. Record partial payment of 50,000 KZT
3. Check balance shows 50,000 KZT remaining
4. Record final payment of 50,000 KZT
5. Verify deal is fully paid

### **Product Deal with Document**

1. Create product deal for 200,000 KZT
2. Verify накладная document is generated
3. Record payments and track inventory implications
4. Generate reconciliation report

### **Overpayment Scenario**

1. Create deal for 75,000 KZT
2. Record payment of 100,000 KZT
3. Verify reconciliation shows overpayment status
4. Check unmatched entries detection

### **Multiple Deals Management**

1. Create multiple deals of different types
2. Switch between deals to record payments
3. Compare balances across different deals
4. Generate reconciliation reports for each

## Accounting Integration

### **Automatic Journal Entries**

Every operation creates proper double-entry bookkeeping entries:

**Deal Creation:**

- Дт 1121 (Торговая дебиторская задолженность)
- Кт 4110 (Доходы от реализации товаров, работ, услуг)

**Payment Recording:**

- Дт 1112 (Банковские счета в тенге)
- Кт 1121 (Торговая дебиторская задолженность)

### **Document Generation**

- **Service Deals**: Generate АВР (Акт выполненных работ)
- **Product Deals**: Generate накладная (товарная накладная)
- Automatic file naming and storage
- Integration with document templates system

## Usage Instructions

### **Prerequisites**

1. Backend API server running
2. Database with proper schema and seed data
3. All account codes (1121, 4110, 1112) exist in database
4. KZT currency configured

### **Testing Steps**

1. Navigate to `/deal-accounting` route
2. Start with "Создать Сделку" tab
3. Create test deals with different types and amounts
4. Use "Список Сделок" to select deals
5. Record payments in "Платежи" tab
6. Monitor balances in "Баланс" tab
7. Generate reconciliation reports in "Сверка" tab

### **Validation Features**

- Required field validation
- Amount validation (positive numbers)
- Payment validation (cannot exceed deal amount)
- Account existence validation
- Currency consistency checks

## Error Scenarios

### **Common Errors**

- Missing required fields → Form validation error
- Invalid payment amount → Business logic error
- Missing account codes → Database error
- Network issues → API error with retry suggestion

### **Error Recovery**

- Clear error messages in Russian
- Suggested actions for each error type
- Form state preservation during errors
- Graceful degradation for partial failures

## Performance Considerations

### **Optimization Features**

- Lazy loading of balance and reconciliation data
- Efficient state updates with proper dependencies
- Minimal re-renders through proper state structure
- Debounced API calls where appropriate

### **User Experience**

- Loading states for all async operations
- Optimistic updates where safe
- Real-time balance updates
- Responsive design for different screen sizes

## Future Enhancements

### **Potential Additions**

- Deal filtering and search functionality
- Export reconciliation reports to PDF/Excel
- Bulk payment processing
- Payment schedule management
- Advanced reconciliation rules
- Multi-currency support
- Deal templates for common scenarios

### **Integration Opportunities**

- Connect with external payment systems
- Integration with accounting software
- Bank transaction import
- Document management system integration
- Audit trail and approval workflows

## Conclusion

The Deal Accounting Frontend provides a comprehensive testing environment for the deal accounting system, demonstrating all core features through an intuitive, localized interface. It serves as both a testing tool and a reference implementation for production frontend development.
