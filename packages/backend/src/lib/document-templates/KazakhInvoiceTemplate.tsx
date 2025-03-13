import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// Define types for the Kazakh invoice
type InvoiceItem = {
  code: string;
  description: string;
  quantity: number;
  unit: string;
  price: number;
};

type KazakhInvoiceProps = {
  // Company info
  companyName: string;
  bin: string;
  kbe: string;
  account: string;
  bik: string;
  bank: string;
  knp: string;

  // Invoice details
  invoiceNumber: string;
  invoiceDate: string;

  // Client info
  clientName: string;
  clientBin: string;
  clientAddress: string;

  // Contract details
  contractNumber: string;
  contractDate: string;

  // Items
  items: InvoiceItem[];

  // Totals
  totalAmount: number;
  vatAmount: number;

  // Additional info
  totalInWords: string;
  executorName?: string;
  contactPhone?: string;

  // Logo URL (optional)
  logoUrl?: string;
};

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Inter",
    lineHeight: 1.4,
    position: "relative",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  companyDetails: {
    width: "60%",
  },
  logo: {
    width: 100,
    height: 100,
  },
  companyName: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 5,
  },
  detailRow: {
    marginBottom: 3,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#AAAAAA",
    borderBottomStyle: "solid",
    marginTop: 10,
    marginBottom: 10,
  },
  invoiceTitle: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
  },
  clientInfo: {
    marginBottom: 5,
  },
  contractInfo: {
    marginBottom: 5,
  },
  table: {
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#AAAAAA",
    borderStyle: "solid",
    width: "100%",
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    borderBottomStyle: "solid",
    backgroundColor: "#F5F5F5",
    fontWeight: "bold",
    fontSize: 8,
    width: "100%",
  },
  tableHeaderCell: {
    padding: 5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#DDDDDD",
    borderBottomStyle: "solid",
    fontSize: 8,
    width: "100%",
  },
  numberCell: {
    width: "5%",
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: "#EAEAEA",
    borderRightStyle: "solid",
    textAlign: "center",
  },
  codeCell: {
    width: "15%",
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: "#EAEAEA",
    borderRightStyle: "solid",
  },
  descriptionCell: {
    width: "27%",
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: "#EAEAEA",
    borderRightStyle: "solid",
  },
  quantityCell: {
    width: "11%",
    padding: 5,
    textAlign: "right",
    borderRightWidth: 1,
    borderRightColor: "#EAEAEA",
    borderRightStyle: "solid",
  },
  unitCell: {
    width: "8%",
    padding: 5,
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: "#EAEAEA",
    borderRightStyle: "solid",
  },
  priceCell: {
    width: "17%",
    padding: 5,
    textAlign: "right",
    borderRightWidth: 1,
    borderRightColor: "#EAEAEA",
    borderRightStyle: "solid",
  },
  totalCell: {
    width: "17%",
    padding: 5,
    textAlign: "right",
  },
  totalsSection: {
    marginTop: 10,
    marginLeft: "auto",
    width: "40%",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  totalLabel: {
    width: "65%",
    textAlign: "right",
    paddingRight: 10,
  },
  totalValue: {
    width: "35%",
    textAlign: "right",
    fontWeight: "bold",
  },
  amountInWords: {
    marginTop: 15,
    marginBottom: 10,
  },
  footerContainer: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  footerLeft: {
    width: "65%",
  },
  footerRight: {
    width: "35%",
    alignItems: "flex-end",
  },
  contactInfo: {
    marginTop: 10,
  },
  signatureSection: {
    marginTop: 15,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    borderBottomStyle: "solid",
    width: 150,
    marginTop: 30,
  },
  signatureText: {
    marginTop: 5,
  },
  qrCodePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: "#F0F0F0",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
});

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Kazakh Invoice Template Component
const KazakhInvoiceTemplate: React.FC<KazakhInvoiceProps> = (
  props: KazakhInvoiceProps
) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with company info and logo */}
        <View style={styles.header}>
          <View style={styles.companyDetails}>
            <Text style={styles.companyName}>
              Наименование {props.companyName}
            </Text>
            <Text style={styles.detailRow}>БИН/ИИН: {props.bin}</Text>
            <Text style={styles.detailRow}>КБе: {props.kbe}</Text>
            <Text style={styles.detailRow}>Счет: {props.account}</Text>
            <Text style={styles.detailRow}>БИК: {props.bik}</Text>
            <Text style={styles.detailRow}>Банк: {props.bank}</Text>
            <Text style={styles.detailRow}>КНП: {props.knp}</Text>
          </View>
          {props.logoUrl && <Image style={styles.logo} src={props.logoUrl} />}
        </View>

        <View style={styles.divider} />

        {/* Invoice title and client info */}
        <Text style={styles.invoiceTitle}>
          СЧЕТ НА ОПЛАТУ №{props.invoiceNumber} от {props.invoiceDate}
        </Text>
        <Text style={styles.clientInfo}>
          Покупатель: БИН/ИИН {props.clientBin}, {props.clientName},{" "}
          {props.clientAddress}
        </Text>
        <Text style={styles.contractInfo}>
          Договор: {props.contractNumber} от {props.contractDate}
        </Text>

        {/* Items table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.numberCell]}>№</Text>
            <Text style={[styles.tableHeaderCell, styles.codeCell]}>Код</Text>
            <Text style={[styles.tableHeaderCell, styles.descriptionCell]}>
              Наименование
            </Text>
            <Text style={[styles.tableHeaderCell, styles.quantityCell]}>
              Кол-во
            </Text>
            <Text style={[styles.tableHeaderCell, styles.unitCell]}>Ед.</Text>
            <Text style={[styles.tableHeaderCell, styles.priceCell]}>Цена</Text>
            <Text style={[styles.tableHeaderCell, styles.totalCell]}>
              Сумма
            </Text>
          </View>

          {/* Table Rows */}
          {props.items.map((item: InvoiceItem, index: number) => {
            const itemTotal = item.quantity * item.price;

            return (
              <View key={`item-${item.code}-${index}`} style={styles.tableRow}>
                <Text style={styles.numberCell}>{index + 1}</Text>
                <Text style={styles.codeCell}>{item.code}</Text>
                <Text style={styles.descriptionCell}>{item.description}</Text>
                <Text style={styles.quantityCell}>
                  {item.quantity.toLocaleString("ru-RU", {
                    minimumFractionDigits: 3,
                    maximumFractionDigits: 3,
                  })}
                </Text>
                <Text style={styles.unitCell}>{item.unit}</Text>
                <Text style={styles.priceCell}>
                  {formatCurrency(item.price)}
                </Text>
                <Text style={styles.totalCell}>
                  {formatCurrency(itemTotal)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Totals Section */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Итого:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(props.totalAmount)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>В том числе НДС:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(props.vatAmount)}
            </Text>
          </View>
        </View>

        {/* Total in words */}
        <View style={styles.amountInWords}>
          <Text>
            Всего наименований {props.items.length}, на сумму{" "}
            {formatCurrency(props.totalAmount)} KZT
          </Text>
          <Text>Всего к оплате: {props.totalInWords}</Text>
        </View>

        <View style={styles.divider} />

        {/* Footer with QR code side by side instead of stacked */}
        <View style={styles.footerContainer}>
          <View style={styles.footerLeft}>
            <Text>
              Для согласования условий и уточнения деталей просьба связаться с
              нами по телефону ниже.
            </Text>

            <View style={styles.signatureSection}>
              <Text>Исполнитель: </Text>
              <View style={styles.signatureLine} />
            </View>
            <Text style={styles.signatureText}>
              {props.executorName || "ФИО Должность"}
            </Text>

            <View style={styles.contactInfo}>
              <Text>Контакты:</Text>
              <Text>Телефон: {props.contactPhone || ""}</Text>
            </View>
          </View>

          {/* QR Code aligned to the right side */}
          <View style={styles.footerRight}>
            <View style={styles.qrCodePlaceholder}>
              <Text>QR Code</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default KazakhInvoiceTemplate;
