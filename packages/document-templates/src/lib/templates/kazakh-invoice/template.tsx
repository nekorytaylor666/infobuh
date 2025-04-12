import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import type { InvoiceItem } from "./schema";

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Inter",
    lineHeight: 1.4,
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
    marginVertical: 10,
  },
  invoiceTitle: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
  },
  table: {
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#AAAAAA",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#DDDDDD",
  },
  tableHeader: {
    backgroundColor: "#F5F5F5",
    fontWeight: "bold",
  },
  cell: {
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: "#EAEAEA",
  },
  numberCell: { width: "5%", textAlign: "center" },
  descriptionCell: { width: "42%" },
  quantityCell: { width: "11%", textAlign: "right" },
  unitCell: { width: "8%", textAlign: "center" },
  priceCell: { width: "17%", textAlign: "right" },
  totalCell: { width: "17%", textAlign: "right", borderRightWidth: 0 },
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
  footer: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

// Helper to format currency
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Format date to DD.MM.YYYY
const formatDate = (dateString: string): string => {
  const [year, month, day] = dateString.split("-");
  return `${day}.${month}.${year}`;
};

// Type for the template data
interface KazakhInvoiceTemplateData {
  companyName: string;
  bin: string;
  kbe: string;
  account: string;
  bik: string;
  bank: string;
  invoiceNumber: string;
  invoiceDate: string;
  contractNumber: string;
  contractDate: string;
  clientName: string;
  clientBin: string;
  clientAddress: string;
  items: InvoiceItem[];
  totalAmount: number;
  vatAmount: number;
  totalInWords: string;
  executorName?: string;
  sellerImage?: string;
  contactPhone?: string;
}

// Kazakh Invoice Template Component
export const KazakhInvoiceTemplate = (props: {
  data: KazakhInvoiceTemplateData;
}) => {
  const data = props.data;
  const formattedInvoiceDate = formatDate(data.invoiceDate);
  const formattedContractDate = formatDate(data.contractDate);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyDetails}>
            <Text style={styles.companyName}>{data.companyName}</Text>
            <Text style={styles.detailRow}>БИН/ИИН: {data.bin}</Text>
            <Text style={styles.detailRow}>КБе: {data.kbe}</Text>
            <Text style={styles.detailRow}>Счет: {data.account}</Text>
            <Text style={styles.detailRow}>БИК: {data.bik}</Text>
            <Text style={styles.detailRow}>Банк: {data.bank}</Text>
          </View>
          {data.sellerImage && (
            <Image style={styles.logo} src={data.sellerImage} />
          )}
        </View>

        <View style={styles.divider} />

        {/* Invoice Title and Client Info */}
        <Text style={styles.invoiceTitle}>
          СЧЕТ НА ОПЛАТУ №{data.invoiceNumber} от {formattedInvoiceDate}
        </Text>
        <Text>
          Покупатель: БИН/ИИН {data.clientBin}, {data.clientName},{" "}
          {data.clientAddress}
        </Text>
        <Text>
          Договор: {data.contractNumber} от {formattedContractDate}
        </Text>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.cell, styles.numberCell]}>№</Text>
            <Text style={[styles.cell, styles.descriptionCell]}>
              Наименование
            </Text>
            <Text style={[styles.cell, styles.quantityCell]}>Кол-во</Text>
            <Text style={[styles.cell, styles.unitCell]}>Ед.</Text>
            <Text style={[styles.cell, styles.priceCell]}>Цена</Text>
            <Text style={[styles.cell, styles.totalCell]}>Сумма</Text>
          </View>

          {data.items.map((item, i) => (
            <View key={item.description} style={styles.tableRow}>
              <Text style={[styles.cell, styles.numberCell]}>{i + 1}</Text>
              <Text style={[styles.cell, styles.descriptionCell]}>
                {item.description}
              </Text>
              <Text style={[styles.cell, styles.quantityCell]}>
                {item.quantity.toLocaleString("ru-RU", {
                  minimumFractionDigits: 3,
                  maximumFractionDigits: 3,
                })}
              </Text>
              <Text style={[styles.cell, styles.unitCell]}>{item.unit}</Text>
              <Text style={[styles.cell, styles.priceCell]}>
                {formatCurrency(item.price)}
              </Text>
              <Text style={[styles.cell, styles.totalCell]}>
                {formatCurrency(item.quantity * item.price)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text>Итого:</Text>
            <Text>{formatCurrency(data.totalAmount)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>В том числе НДС:</Text>
            <Text>{formatCurrency(data.vatAmount)}</Text>
          </View>
        </View>

        <Text>
          Всего наименований {data.items.length}, на сумму{" "}
          {formatCurrency(data.totalAmount)} KZT
        </Text>
        <Text>Всего к оплате: {data.totalInWords}</Text>

        <View style={styles.divider} />

        {/* Footer */}
        <View style={styles.footer}>
          <View>
            <Text>Исполнитель: {data.executorName || ""}</Text>
            {data.contactPhone && <Text>Телефон: {data.contactPhone}</Text>}
          </View>
        </View>
      </Page>
    </Document>
  );
};
