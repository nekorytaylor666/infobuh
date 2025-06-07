import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import type { ActItem } from "./schema";

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
  headingRight: {
    width: "40%",
    fontSize: 10,
    textAlign: "right",
  },
  formTitle: {
    textAlign: "right",
    marginBottom: 5,
  },
  bin: {
    textAlign: "center",
    marginVertical: 10,
    fontSize: 12,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#AAAAAA",
    borderBottomStyle: "solid",
    marginVertical: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
  },
  infoRow: {
    marginBottom: 10,
  },
  greyText: {
    color: "#777777",
    fontSize: 8,
    marginTop: 2,
  },
  table: {
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#000000",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
  },
  tableHeader: {
    backgroundColor: "#F5F5F5",
    fontWeight: "bold",
  },
  cell: {
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: "#000000",
  },
  numberCell: { width: "5%", textAlign: "center" },
  nameCell: { width: "28%" },
  dateCell: { width: "11%", textAlign: "center" },
  unitCell: { width: "11%", textAlign: "center" },
  quantityCell: { width: "10%", textAlign: "center" },
  priceCell: { width: "16%", textAlign: "right" },
  totalCell: { width: "17%", textAlign: "right", borderRightWidth: 0 },
  totalsSection: {
    marginLeft: "auto",
    width: "30%",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  footer: {
    marginTop: 20,
  },
  signaturesSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
  },
  signatureColumn: {
    width: "45%",
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    marginVertical: 5,
  },
  totalWords: {
    marginTop: 10,
    marginBottom: 10,
  },
  stampPlace: {
    marginTop: 10,
  },
  docInfoTable: {
    width: "100%",
    marginVertical: 15,
  },
  docInfoRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  docInfoCell: {
    width: "15%",
    marginHorizontal: 5,
  },
  docInfoHeader: {
    fontSize: 9,
    textAlign: "center",
    marginBottom: 3,
  },
  docInfoValue: {
    borderWidth: 1,
    borderColor: "#000000",
    textAlign: "center",
    padding: 5,
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
  if (!dateString) return "";
  try {
    const [year, month, day] = dateString.split("-");
    if (!year || !month || !day) return "";
    return `${day}.${month}.${year}`;
  } catch (error) {
    console.warn("Invalid date format:", dateString);
    return "";
  }
};

// Type for the template data
interface KazakhActTemplateData {
  companyName: string;
  bin: string;
  kbe: string;
  account: string;
  bik: string;
  bank: string;
  actNumber: string;
  actDate: string;
  contractNumber: string;
  contractDate: string;
  dateOfCompletion: string;
  clientName: string;
  clientBin: string;
  clientAddress: string;
  sellerAddress: string;
  items: ActItem[];
  totalAmount: number;
  vatAmount: number;
  totalInWords: string;
  executorName?: string;
  executorPosition?: string;
  customerName?: string;
  customerPosition?: string;
  sellerImage?: string;
}

// Kazakh Act Template Component
export const KazakhActTemplate = (props: { data: KazakhActTemplateData }) => {
  const data = props.data;
  const formattedActDate = formatDate(data.actDate);
  const formattedContractDate = formatDate(data.contractDate);
  const formattedCompletionDate = formatDate(data.dateOfCompletion);
  const totalQuantity = data.items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with logo */}
        <View style={styles.header}>
          <View style={styles.companyDetails}>
            {data.sellerImage && (
              <Image style={styles.logo} src={data.sellerImage} />
            )}
          </View>
          <View style={styles.headingRight}>
            <Text style={styles.formTitle}>Приложение 50</Text>
            <Text>к приказу Министра финансов</Text>
            <Text>Республики Казахстан</Text>
            <Text>от 20 декабря 2012 года № 562</Text>
            <Text style={styles.formTitle}>Форма Р-1</Text>
          </View>
        </View>

        {/* BIN numbers */}
        <View style={styles.bin}>
          <Text>ИИН/БИН {data.bin}</Text>
        </View>

        {/* Customer and Contractor info */}
        <View style={styles.infoRow}>
          <Text>Заказчик: {data.clientName}</Text>
          <Text style={styles.greyText}>
            полное наименование, адрес, данные о средствах связи
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text>
            Исполнитель: {data.companyName}, {data.sellerAddress}
          </Text>
          <Text style={styles.greyText}>
            полное наименование, адрес, данные о средствах связи
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text>
            Договор (контракт): Договор {data.contractNumber} от{" "}
            {formattedContractDate} года
          </Text>
        </View>

        {/* Act Title */}
        <Text style={styles.title}>
          АКТ ВЫПОЛНЕННЫХ РАБОТ (ОКАЗАННЫХ УСЛУГ)
        </Text>

        {/* Document info */}
        <View style={styles.docInfoTable}>
          <View style={styles.docInfoRow}>
            <View style={styles.docInfoCell}>
              <Text style={styles.docInfoHeader}>Номер документа</Text>
              <View style={styles.docInfoValue}>
                <Text>{data.actNumber}</Text>
              </View>
            </View>
            <View style={styles.docInfoCell}>
              <Text style={styles.docInfoHeader}>Дата составления</Text>
              <View style={styles.docInfoValue}>
                <Text>{formattedCompletionDate}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.cell, styles.numberCell]}>№</Text>
            <Text style={[styles.cell, styles.nameCell]}>наименование</Text>
            <Text style={[styles.cell, styles.dateCell]}>дата</Text>
            <Text style={[styles.cell, styles.unitCell]}>ед. изм.</Text>
            <Text style={[styles.cell, styles.quantityCell]}>кол-во</Text>
            <Text style={[styles.cell, styles.priceCell]}>цена</Text>
            <Text style={[styles.cell, styles.totalCell]}>сумма</Text>
          </View>
          {data.items.map((item, i) => (
            <View key={`item-${item.description}-${i}`} style={styles.tableRow}>
              <Text style={[styles.cell, styles.numberCell]}>{i + 1}</Text>
              <Text style={[styles.cell, styles.nameCell]}>
                {item.description}
              </Text>
              <Text style={[styles.cell, styles.dateCell]}>
                {formattedCompletionDate}
              </Text>
              <Text style={[styles.cell, styles.unitCell]}>{item.unit}</Text>
              <Text style={[styles.cell, styles.quantityCell]}>
                {item.quantity}
              </Text>
              <Text style={[styles.cell, styles.priceCell]}>
                {formatCurrency(item.price)}
              </Text>
              <Text style={[styles.cell, styles.totalCell]}>
                {formatCurrency(item.quantity * item.price)}
              </Text>
            </View>
          ))}

          <View style={styles.tableRow}>
            <Text style={[styles.cell, { width: "50%", borderRightWidth: 0 }]}>
              Итого
            </Text>
            <Text
              style={[styles.cell, { width: "11%", borderRightWidth: 0 }]}
            />
            <Text
              style={[styles.cell, { width: "11%", borderRightWidth: 0 }]}
            />
            <Text
              style={[
                styles.cell,
                { width: "6%", borderRightWidth: 0, textAlign: "center" },
              ]}
            >
              {totalQuantity}
            </Text>
            <Text
              style={[
                styles.cell,
                { width: "16%", borderRightWidth: 0, textAlign: "center" },
              ]}
            >
              x
            </Text>
            <Text style={[styles.cell, styles.totalCell, { width: "17%" }]}>
              {formatCurrency(data.totalAmount)}
            </Text>
          </View>
        </View>

        {/* VAT section */}
        <View style={styles.totalWords}>
          <Text>
            Всего выполнено работ (оказано услуг) на сумму:{" "}
            {formatCurrency(data.totalAmount)} KZT
          </Text>
          <Text>В том числе НДС: {formatCurrency(data.vatAmount)} KZT</Text>
        </View>

        {/* Signatures section */}
        <View style={styles.signaturesSection}>
          <View style={styles.signatureColumn}>
            <Text>Сдал (Исполнитель)</Text>
            <Text>{data.executorPosition || "Предприниматель"}</Text>
            <View style={styles.signatureLine} />
            <Text>{data.executorName || data.companyName}</Text>
            <Text>М.П.</Text>
          </View>
          <View style={styles.signatureColumn}>
            <Text>Принял (Заказчик)</Text>
            <Text>{data.customerPosition || ""}</Text>
            <View style={styles.signatureLine} />
            <Text>{data.customerName || data.clientName}</Text>
            <Text>М.П.</Text>
          </View>
        </View>

        {/* Date of acceptance */}
        <View style={{ marginTop: 20 }}>
          <Text>
            Дата подписания (принятия) работ (услуг): {formattedCompletionDate}
          </Text>
        </View>
      </Page>
    </Document>
  );
};
