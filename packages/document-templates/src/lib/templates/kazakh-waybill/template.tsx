import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import type { WaybillItem } from "./schema";

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: "Inter",
    lineHeight: 1.4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  companyDetails: {
    width: "60%",
  },
  logo: {
    width: 80,
    height: 80,
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
    marginVertical: 8,
    fontSize: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 8,
  },
  infoRow: {
    marginBottom: 8,
  },
  infoBox: {
    flexDirection: "row",
    marginBottom: 8,
  },
  infoColumn: {
    flex: 1,
    paddingRight: 5,
  },
  greyText: {
    color: "#777777",
    fontSize: 8,
    marginTop: 2,
  },
  table: {
    marginVertical: 8,
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
  numberCell: { width: "4%", textAlign: "center" },
  nameCell: { width: "25%" },
  codeCell: { width: "13%", textAlign: "center" },
  unitCell: { width: "8%", textAlign: "center" },
  quantityCell: { width: "8%", textAlign: "center" },
  priceCell: { width: "12%", textAlign: "right" },
  totalCell: { width: "14%", textAlign: "right", borderRightWidth: 0 },
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
    marginTop: 15,
  },
  signatureColumn: {
    width: "30%",
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    marginVertical: 5,
  },
  totalWords: {
    marginTop: 8,
    marginBottom: 8,
  },
  docInfoTable: {
    width: "100%",
    marginVertical: 10,
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
  columnHeaders: {
    flexDirection: "row",
    textAlign: "center",
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
  const [year, month, day] = dateString.split("-");
  return `${day}.${month}.${year}`;
};

// Type for the template data
interface KazakhWaybillTemplateData {
  companyName: string;
  bin: string;
  kbe: string;
  account: string;
  bik: string;
  bank: string;
  waybillNumber: string;
  waybillDate: string;
  contractNumber: string;
  contractDate: string;
  clientName: string;
  clientBin: string;
  clientAddress: string;
  sellerAddress: string;
  items: WaybillItem[];
  totalAmount: number;
  vatAmount: number;
  totalInWords: string;
  senderName?: string;
  senderPosition?: string;
  receiverName?: string;
  receiverPosition?: string;
  releaserName?: string;
  releaserPosition?: string;
  transportOrgName?: string;
  transportResponsiblePerson?: string;
  sellerImage?: string;
}

// Kazakh Waybill Template Component
export const KazakhWaybillTemplate = (props: {
  data: KazakhWaybillTemplateData;
}) => {
  const data = props.data;
  const formattedWaybillDate = formatDate(data.waybillDate);
  const formattedContractDate = formatDate(data.contractDate);
  const totalQuantity = data.items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  return (
    <Document>
      <Page size="A4" style={styles.page} orientation="landscape">
        {/* Header with logo */}
        <View style={styles.header}>
          <View style={styles.companyDetails}>
            {data.sellerImage && (
              <Image style={styles.logo} src={data.sellerImage} />
            )}
          </View>
          <View style={styles.headingRight}>
            <Text style={styles.formTitle}>Приложение 26</Text>
            <Text>к приказу Министра финансов</Text>
            <Text>Республики Казахстан</Text>
            <Text>от 20 декабря 2012 года № 562</Text>
            <Text style={styles.formTitle}>Форма З-2</Text>
          </View>
        </View>

        {/* Organization info */}
        <View style={styles.infoRow}>
          <Text>
            Организация (индивидуальный предприниматель): {data.companyName}
          </Text>
        </View>

        {/* BIN numbers */}
        <View style={styles.bin}>
          <Text>ИИН/БИН {data.bin}</Text>
        </View>

        {/* Document info */}
        <View style={styles.docInfoTable}>
          <View style={styles.docInfoRow}>
            <View style={styles.docInfoCell}>
              <Text style={styles.docInfoHeader}>Номер документа</Text>
              <View style={styles.docInfoValue}>
                <Text>{data.waybillNumber}</Text>
              </View>
            </View>
            <View style={styles.docInfoCell}>
              <Text style={styles.docInfoHeader}>Дата составления</Text>
              <View style={styles.docInfoValue}>
                <Text>{formattedWaybillDate}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Waybill Title */}
        <Text style={styles.title}>НАКЛАДНАЯ НА ОТПУСК ЗАПАСОВ НА СТОРОНУ</Text>

        {/* Organization info - now in a better row layout for landscape */}
        <View style={styles.infoBox}>
          <View style={styles.infoColumn}>
            <Text>
              Организация (индивидуальный предприниматель) - отправитель
            </Text>
            <Text>Индивидуальный предприниматель {data.companyName}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text>
              Организация (индивидуальный предприниматель) - получатель
            </Text>
            <Text>{data.clientName}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text>Ответственный за поставку (Ф.И.О.)</Text>
            <Text>{data.senderName}</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text>Транспортная организация</Text>
            <Text>{data.transportOrgName}</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.cell, styles.numberCell]}>№ по порядку</Text>
            <Text style={[styles.cell, styles.nameCell]}>
              Наименование, характеристика
            </Text>
            <Text style={[styles.cell, styles.codeCell]}>
              Номенклатурный номер
            </Text>
            <Text style={[styles.cell, styles.unitCell]}>
              Единица измерения
            </Text>
            <Text style={[styles.cell, styles.quantityCell]}>
              подлежит отпуску
            </Text>
            <Text style={[styles.cell, styles.quantityCell]}>отпущено</Text>
            <Text style={[styles.cell, styles.priceCell]}>
              Цена за единицу, в KZT
            </Text>
            <Text style={[styles.cell, styles.totalCell]}>
              Сумма с НДС, в KZT
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.cell, styles.numberCell]}>1</Text>
            <Text style={[styles.cell, styles.nameCell]}>2</Text>
            <Text style={[styles.cell, styles.codeCell]}>3</Text>
            <Text style={[styles.cell, styles.unitCell]}>4</Text>
            <Text style={[styles.cell, styles.quantityCell]}>5</Text>
            <Text style={[styles.cell, styles.quantityCell]}>6</Text>
            <Text style={[styles.cell, styles.priceCell]}>7</Text>
            <Text style={[styles.cell, styles.totalCell]}>8</Text>
          </View>
          {data.items.map((item, i) => (
            <View key={`item-${item.description}-${i}`} style={styles.tableRow}>
              <Text style={[styles.cell, styles.numberCell]}>{i + 1}</Text>
              <Text style={[styles.cell, styles.nameCell]}>
                {item.description}
              </Text>
              <Text style={[styles.cell, styles.codeCell]}>
                {item.nomenclatureCode || ""}
              </Text>
              <Text style={[styles.cell, styles.unitCell]}>{item.unit}</Text>
              <Text style={[styles.cell, styles.quantityCell]}>
                {item.quantity}
              </Text>
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
            <Text
              style={[
                styles.cell,
                {
                  width: "66%",
                  borderRightWidth: 0,
                  textAlign: "right",
                  fontWeight: "bold",
                },
              ]}
            >
              Итого
            </Text>
            <Text style={[styles.cell, { width: "8%", textAlign: "center" }]}>
              {totalQuantity}
            </Text>
            <Text style={[styles.cell, { width: "8%", textAlign: "center" }]}>
              {totalQuantity}
            </Text>
            <Text style={[styles.cell, { width: "12%", textAlign: "center" }]}>
              x
            </Text>
            <Text
              style={[
                styles.cell,
                styles.totalCell,
                { width: "14%", fontWeight: "bold" },
              ]}
            >
              {formatCurrency(data.totalAmount)}
            </Text>
          </View>
        </View>

        {/* Total in words */}
        <View style={styles.totalWords}>
          <Text>
            Всего отпущено количество запасов (прописью): {data.totalInWords}
          </Text>
          <Text>на сумму (прописью), в KZT: {data.totalInWords}</Text>
        </View>

        {/* Signatures section - better layout for landscape */}
        <View style={styles.signaturesSection}>
          <View style={styles.signatureColumn}>
            <Text>Отпуск разрешил</Text>
            <Text>{data.senderPosition || "Директор"}</Text>
            <View style={styles.signatureLine} />
            <Text style={{ fontSize: 8, textAlign: "center" }}>должность</Text>
            <View style={styles.signatureLine} />
            <Text style={{ fontSize: 8, textAlign: "center" }}>подпись</Text>
            <View style={styles.signatureLine} />
            <Text
              style={{ fontSize: 8, textAlign: "center", marginBottom: 10 }}
            >
              расшифровка подписи
            </Text>
            <Text>{data.senderName}</Text>
          </View>
          <View style={styles.signatureColumn}>
            <Text>Главный бухгалтер</Text>
            <View style={styles.signatureLine} />
            <Text style={{ fontSize: 8, textAlign: "center" }}>подпись</Text>
            <View style={styles.signatureLine} />
            <Text style={{ fontSize: 8, textAlign: "center" }}>
              расшифровка подписи
            </Text>
            <Text>{data.releaserName}</Text>
          </View>
          <View style={styles.signatureColumn}>
            <Text>Отпустил</Text>
            <View style={styles.signatureLine} />
            <Text style={{ fontSize: 8, textAlign: "center" }}>подпись</Text>
            <View style={styles.signatureLine} />
            <Text style={{ fontSize: 8, textAlign: "center" }}>
              расшифровка подписи
            </Text>
            <Text>{data.releaserName}</Text>
          </View>
        </View>

        {/* Stamps and Receiver - fixed JSX linter issue with self-closing tag */}
        <View style={{ marginTop: 20 }}>
          <Text>М.П.</Text>
        </View>

        <View style={styles.signaturesSection}>
          <View style={{ flex: 1 }} />
          <View style={styles.signatureColumn}>
            <Text>Запасы получил</Text>
            <View style={styles.signatureLine} />
            <Text style={{ fontSize: 8, textAlign: "center" }}>подпись</Text>
            <View style={styles.signatureLine} />
            <Text style={{ fontSize: 8, textAlign: "center" }}>
              расшифровка подписи
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
