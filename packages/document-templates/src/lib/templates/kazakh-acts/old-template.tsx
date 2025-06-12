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

// Define styles matching R-1 form specification
const styles = StyleSheet.create({
  page: {
    padding: 15,
    fontSize: 8,
    fontFamily: "Inter",
    lineHeight: 1.1,
  },

  // Grid-based layout matching R-1 form
  gridContainer: {
    position: "relative",
    width: "100%",
  },

  // Header section with legal references
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    minHeight: 80,
  },

  logoSection: {
    width: 100,
    height: 70,
  },

  logo: {
    width: 80,
    height: 60,
  },

  // Right header with official references
  rightHeaderContainer: {
    width: 260,
    position: "relative",
  },

  legalReference1: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 180,
    fontSize: 6,
    textAlign: "right",
    borderWidth: 1,
    borderColor: "#000000",
    padding: 3,
    marginBottom: 5,
  },

  legalReference2: {
    position: "absolute",
    top: 35,
    right: 0,
    width: 180,
    fontSize: 6,
    textAlign: "right",
    borderWidth: 1,
    borderColor: "#000000",
    padding: 3,
  },

  formDesignation: {
    position: "absolute",
    top: 70,
    right: 80,
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
  },

  // ИНН/БИН section in upper right
  iinBinContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 75,
  },

  iinBinLabel: {
    fontSize: 6,
    textAlign: "center",
    marginBottom: 2,
  },

  iinBinBox: {
    borderWidth: 2,
    borderColor: "#000000",
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  // Customer/Contractor sections with precise layout
  participantsSection: {
    marginBottom: 15,
    marginTop: 20,
  },

  participantRow: {
    flexDirection: "row",
    marginBottom: 5,
    minHeight: 25,
    alignItems: "flex-start",
  },

  participantLabel: {
    width: 70,
    fontSize: 8,
    fontWeight: "bold",
    paddingTop: 2,
  },

  participantInfo: {
    flex: 1,
    fontSize: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    paddingBottom: 2,
    marginRight: 10,
  },

  participantBinContainer: {
    width: 100,
  },

  participantBinBox: {
    borderWidth: 1,
    borderColor: "#000000",
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  participantSubtext: {
    fontSize: 6,
    fontStyle: "italic",
    color: "#666666",
    marginLeft: 70,
    marginTop: 2,
    marginBottom: 8,
  },

  // Contract section
  contractRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    marginTop: 10,
  },

  contractLabel: {
    fontSize: 8,
    marginRight: 15,
  },

  contractInfo: {
    flex: 1,
    fontSize: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    paddingBottom: 2,
  },

  // Document info boxes (right aligned)
  docInfoContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    marginBottom: 20,
  },

  docInfoBox: {
    width: 90,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: "#000000",
  },

  docInfoHeader: {
    fontSize: 6,
    textAlign: "center",
    padding: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    backgroundColor: "#F5F5F5",
  },

  docInfoValue: {
    fontSize: 8,
    textAlign: "center",
    padding: 5,
    minHeight: 20,
    justifyContent: "center",
  },

  // Main title
  mainTitle: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
    textTransform: "uppercase",
  },

  // Table with exact R-1 specifications
  mainTable: {
    borderWidth: 1,
    borderColor: "#000000",
    marginVertical: 15,
  },

  // Complex header structure matching R-1
  tableHeaderComplex: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
  },

  // Cell styles with exact widths from R-1
  cellBase: {
    borderRightWidth: 1,
    borderRightColor: "#000000",
    padding: 2,
    fontSize: 6,
    justifyContent: "center",
    flexWrap: "wrap",
  },

  cellNoBorder: {
    padding: 2,
    fontSize: 6,
    justifyContent: "center",
    flexWrap: "wrap",
  },

  // Exact column widths from R-1 specification
  col1Width: { width: 30 },    // Номер по порядку
  col2Width: { width: 140 },   // Наименование работ (услуг)
  col3Width: { width: 60 },    // Дата выполнения работ
  col4Width: { width: 80 },    // Сведения об отчете
  col5Width: { width: 50 },    // Единица измерения
  col6Width: { width: 40 },    // количество
  col7Width: { width: 50 },    // цена за единицу
  col8Width: { width: 55 },    // стоимость

  // Table text styles
  headerText: {
    fontSize: 6,
    fontWeight: "bold",
    textAlign: "center",
    flexWrap: "wrap",
  },

  cellTextCenter: {
    fontSize: 6,
    textAlign: "center",
    flexWrap: "wrap",
  },

  cellTextLeft: {
    fontSize: 6,
    textAlign: "left",
    flexWrap: "wrap",
  },

  cellTextRight: {
    fontSize: 6,
    textAlign: "right",
    flexWrap: "wrap",
  },

  // Data rows
  dataRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    minHeight: 20,
  },

  // Total row
  totalRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    minHeight: 20,
    backgroundColor: "#F9F9F9",
  },

  // Bottom sections
  suppliesSection: {
    marginTop: 15,
    marginBottom: 10,
  },

  suppliesText: {
    fontSize: 8,
    marginBottom: 5,
  },

  suppliesLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    marginBottom: 3,
    height: 15,
  },

  suppliesSubtext: {
    fontSize: 6,
    fontStyle: "italic",
    color: "#666666",
  },

  appendixSection: {
    marginVertical: 10,
  },

  appendixText: {
    fontSize: 8,
  },

  // Signatures matching R-1 layout
  signaturesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 25,
    marginBottom: 15,
  },

  signatureBlock: {
    width: 200,
  },

  signatureTitle: {
    fontSize: 8,
    marginBottom: 3,
  },

  signaturePosition: {
    fontSize: 8,
    marginBottom: 8,
  },

  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    marginBottom: 5,
    height: 20,
  },

  signatureLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 6,
    marginBottom: 3,
  },

  signatureName: {
    fontSize: 8,
    marginTop: 3,
  },

  // Final date section
  finalDateSection: {
    textAlign: "center",
    marginTop: 15,
    fontSize: 8,
  },

  // М.П. (seal) sections
  sealSection: {
    fontSize: 8,
    textAlign: "center",
    marginTop: 10,
  },
});

// Helper functions
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (dateString: string): string => {
  if (!dateString) return "";
  try {
    const [year, month, day] = dateString.split("-");
    if (!year || !month || !day) return "";
    return `${day}.${month}.${year}`;
  } catch (error) {
    return "";
  }
};

// Interface matching R-1 requirements
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

export const KazakhActTemplate = (props: { data: KazakhActTemplateData }) => {
  const data = props.data;
  const formattedActDate = formatDate(data.actDate);
  const formattedContractDate = formatDate(data.contractDate);
  const formattedCompletionDate = formatDate(data.dateOfCompletion);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Grid Container */}
        <View style={styles.gridContainer}>

          {/* Header with legal references and logo */}
          <View style={styles.headerContainer}>
            {/* Logo section */}
            <View style={styles.logoSection}>
              {data.sellerImage && (
                <Image style={styles.logo} src={data.sellerImage} />
              )}
            </View>

            {/* Right header with legal references and ИНН/БИН */}
            <View style={styles.rightHeaderContainer}>
              {/* First legal reference */}
              <View style={styles.legalReference1}>
                <Text>Приложение</Text>
                <Text>к приказу Министра финансов</Text>
                <Text>Республики Казахстан</Text>
                <Text>от 27 октября 2014 года № 458</Text>
              </View>

              {/* Second legal reference */}
              <View style={styles.legalReference2}>
                <Text>Приложение 50</Text>
                <Text>к приказу Министра финансов</Text>
                <Text>Республики Казахстан</Text>
                <Text>20 декабря 2012 г. № 562</Text>
              </View>

              {/* Form designation */}
              <Text style={styles.formDesignation}>Форма Р - 1</Text>

              {/* ИНН/БИН box */}
              <View style={styles.iinBinContainer}>
                <Text style={styles.iinBinLabel}>ИНН/БИН</Text>
                <View style={styles.iinBinBox}>
                  <Text style={styles.cellTextCenter}>{data.bin}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Participants section */}
          <View style={styles.participantsSection}>
            {/* Customer */}
            <View style={styles.participantRow}>
              <Text style={styles.participantLabel}>Заказчик</Text>
              <View style={styles.participantInfo}>
                <Text>{data.clientName}</Text>
              </View>
              <View style={styles.participantBinContainer}>
                <View style={styles.participantBinBox}>
                  <Text style={styles.cellTextCenter}>{data.clientBin}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.participantSubtext}>
              полное наименование, адрес, данные о средствах связи
            </Text>

            {/* Contractor */}
            <View style={styles.participantRow}>
              <Text style={styles.participantLabel}>Исполнитель</Text>
              <View style={styles.participantInfo}>
                <Text>{data.companyName}, {data.sellerAddress}</Text>
              </View>
              <View style={styles.participantBinContainer}>
                <View style={styles.participantBinBox}>
                  <Text style={styles.cellTextCenter}>{data.bin}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.participantSubtext}>
              полное наименование, адрес, данные о средствах связи
            </Text>

            {/* Contract row */}
            <View style={styles.contractRow}>
              <Text style={styles.contractLabel}>Договор (контракт)</Text>
              <View style={styles.contractInfo}>
                <Text>{data.contractNumber} «{formattedContractDate}» 20__ г.</Text>
              </View>
            </View>
          </View>

          {/* Document info boxes */}
          <View style={styles.docInfoContainer}>
            <View style={styles.docInfoBox}>
              <Text style={styles.docInfoHeader}>Номер документа</Text>
              <View style={styles.docInfoValue}>
                <Text style={styles.cellTextCenter}>{data.actNumber}</Text>
              </View>
            </View>
            <View style={styles.docInfoBox}>
              <Text style={styles.docInfoHeader}>Дата составления</Text>
              <View style={styles.docInfoValue}>
                <Text style={styles.cellTextCenter}>{formattedActDate}</Text>
              </View>
            </View>
          </View>

          {/* Main title */}
          <Text style={styles.mainTitle}>
            АКТ ВЫПОЛНЕННЫХ РАБОТ (ОКАЗАННЫХ УСЛУГ)*
          </Text>

          {/* Main table */}
          <View style={styles.mainTable}>
            {/* Complex table header matching R-1 */}
            <View style={styles.tableHeaderComplex}>
              {/* First row of headers */}
              <View style={[styles.cellBase, styles.col1Width, { height: 60, justifyContent: "center" }]}>
                <Text style={styles.headerText}>Номер по порядку</Text>
              </View>
              <View style={[styles.cellBase, styles.col2Width, { height: 60, justifyContent: "center" }]}>
                <Text style={styles.headerText}>
                  Наименование работ (услуг) (в разрезе их подвидов в соответствии с технической спецификацией, заданием, графиком выполнения работ (услуг) при их наличии)
                </Text>
              </View>
              <View style={[styles.cellBase, styles.col3Width, { height: 60, justifyContent: "center" }]}>
                <Text style={styles.headerText}>
                  Дата выполнения работ (оказания услуг)
                </Text>
              </View>
              <View style={[styles.cellBase, styles.col4Width, { height: 60, justifyContent: "center" }]}>
                <Text style={styles.headerText}>
                  Сведения об отчете о научных исследованиях, маркетинговых, консультационных и прочих услугах (дата, номер, количество страниц) (при их наличии)***
                </Text>
              </View>
              <View style={[styles.cellBase, styles.col5Width, { height: 60, justifyContent: "center" }]}>
                <Text style={styles.headerText}>Единица измерения</Text>
              </View>

              {/* Merged header for "Выполнено работ (оказано услуг)" */}
              <View style={{ width: 145, borderLeftWidth: 1, borderLeftColor: "#000000" }}>
                <View style={{
                  height: 30,
                  borderBottomWidth: 1,
                  borderBottomColor: "#000000",
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "#F5F5F5"
                }}>
                  <Text style={styles.headerText}>Выполнено работ (оказано услуг)</Text>
                </View>

                {/* Sub-headers */}
                <View style={{ flexDirection: "row", height: 30 }}>
                  <View style={[styles.cellBase, styles.col6Width, { borderTopWidth: 0, height: 30 }]}>
                    <Text style={styles.headerText}>количество</Text>
                  </View>
                  <View style={[styles.cellBase, styles.col7Width, { borderTopWidth: 0, height: 30 }]}>
                    <Text style={styles.headerText}>цена за единицу</Text>
                  </View>
                  <View style={[styles.cellNoBorder, styles.col8Width, { borderTopWidth: 0, height: 30 }]}>
                    <Text style={styles.headerText}>стоимость</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Column numbers */}
            <View style={styles.dataRow}>
              <View style={[styles.cellBase, styles.col1Width]}>
                <Text style={styles.cellTextCenter}>1</Text>
              </View>
              <View style={[styles.cellBase, styles.col2Width]}>
                <Text style={styles.cellTextCenter}>2</Text>
              </View>
              <View style={[styles.cellBase, styles.col3Width]}>
                <Text style={styles.cellTextCenter}>3</Text>
              </View>
              <View style={[styles.cellBase, styles.col4Width]}>
                <Text style={styles.cellTextCenter}>4</Text>
              </View>
              <View style={[styles.cellBase, styles.col5Width]}>
                <Text style={styles.cellTextCenter}>5</Text>
              </View>
              <View style={[styles.cellBase, styles.col6Width]}>
                <Text style={styles.cellTextCenter}>6</Text>
              </View>
              <View style={[styles.cellBase, styles.col7Width]}>
                <Text style={styles.cellTextCenter}>7</Text>
              </View>
              <View style={[styles.cellNoBorder, styles.col8Width]}>
                <Text style={styles.cellTextCenter}>8</Text>
              </View>
            </View>

            {/* Data rows */}
            {data.items.map((item, index) => (
              <View key={index} style={styles.dataRow}>
                <View style={[styles.cellBase, styles.col1Width]}>
                  <Text style={styles.cellTextCenter}>{index + 1}</Text>
                </View>
                <View style={[styles.cellBase, styles.col2Width]}>
                  <Text style={styles.cellTextLeft}>{item.description}</Text>
                </View>
                <View style={[styles.cellBase, styles.col3Width]}>
                  <Text style={styles.cellTextCenter}>{formattedCompletionDate}</Text>
                </View>
                <View style={[styles.cellBase, styles.col4Width]}>
                  <Text style={styles.cellTextCenter}></Text>
                </View>
                <View style={[styles.cellBase, styles.col5Width]}>
                  <Text style={styles.cellTextCenter}>{item.unit}</Text>
                </View>
                <View style={[styles.cellBase, styles.col6Width]}>
                  <Text style={styles.cellTextCenter}>{item.quantity}</Text>
                </View>
                <View style={[styles.cellBase, styles.col7Width]}>
                  <Text style={styles.cellTextRight}>{formatCurrency(item.price)}</Text>
                </View>
                <View style={[styles.cellNoBorder, styles.col8Width]}>
                  <Text style={styles.cellTextRight}>{formatCurrency(item.quantity * item.price)}</Text>
                </View>
              </View>
            ))}

            {/* Total row */}
            <View style={styles.totalRow}>
              <View style={[styles.cellBase, styles.col1Width]}></View>
              <View style={[styles.cellBase, styles.col2Width]}></View>
              <View style={[styles.cellBase, styles.col3Width]}></View>
              <View style={[styles.cellBase, styles.col4Width]}></View>
              <View style={[styles.cellBase, styles.col5Width]}>
                <Text style={styles.cellTextCenter}>Итого</Text>
              </View>
              <View style={[styles.cellBase, styles.col6Width]}>
                <Text style={styles.cellTextCenter}>
                  {data.items.reduce((sum, item) => sum + item.quantity, 0)}
                </Text>
              </View>
              <View style={[styles.cellBase, styles.col7Width]}>
                <Text style={styles.cellTextCenter}>x</Text>
              </View>
              <View style={[styles.cellNoBorder, styles.col8Width]}>
                <Text style={styles.cellTextRight}>{formatCurrency(data.totalAmount)}</Text>
              </View>
            </View>
          </View>

          {/* Supplies section */}
          <View style={styles.suppliesSection}>
            <Text style={styles.suppliesText}>
              Сведения об использовании запасов, полученных от заказчика
            </Text>
            <View style={styles.suppliesLine} />
            <Text style={styles.suppliesSubtext}>наименование, количество, стоимость</Text>
          </View>

          {/* Appendix section */}
          <View style={styles.appendixSection}>
            <Text style={styles.appendixText}>
              Приложение: Перечень документации, в том числе отчет(ы) о маркетинговых, научных исследованиях, консультационных и прочих услугах (обязательны при его (их) наличии) на _____________ страниц
            </Text>
          </View>

          {/* Signatures section */}
          <View style={styles.signaturesContainer}>
            <View style={styles.signatureBlock}>
              <Text style={styles.signatureTitle}>Сдал (Исполнитель)</Text>
              <Text style={styles.signaturePosition}>
                {data.executorPosition || "Директор"}
              </Text>
              <View style={styles.signatureLine} />
              <View style={styles.signatureLabels}>
                <Text>должность</Text>
                <Text>подпись</Text>
                <Text>расшифровка подписи</Text>
              </View>
              <Text style={styles.signatureName}>{data.executorName || ""}</Text>
              <Text style={styles.sealSection}>М.П.</Text>
            </View>

            <View style={styles.signatureBlock}>
              <Text style={styles.signatureTitle}>Принял (Заказчик)</Text>
              <Text style={styles.signaturePosition}>
                {data.customerPosition || "Директор"}
              </Text>
              <View style={styles.signatureLine} />
              <View style={styles.signatureLabels}>
                <Text>должность</Text>
                <Text>подпись</Text>
                <Text>расшифровка подписи</Text>
              </View>
              <Text style={styles.signatureName}>{data.customerName || ""}</Text>
              <Text style={styles.sealSection}>М.П.</Text>
            </View>
          </View>

          {/* Final date section */}
          <View style={styles.finalDateSection}>
            <Text>
              Дата подписания (принятия) работ (услуг) ____________
            </Text>
          </View>

          {/* Footer notes */}
          <View style={{ marginTop: 20, fontSize: 6 }}>
            <Text style={{ marginBottom: 3 }}>
              *Применяется для приемки-передачи выполненных работ (оказанных услуг), за исключением строительно-монтажных работ.
            </Text>
            <Text style={{ marginBottom: 3 }}>
              **Заполняется в случае, если при выполнении работ (оказанных услуг) приходится их производить, в том числе если даты выполнения работ (оказанных услуг) и даты подписания (принятия) работ (услуг) различны.
            </Text>
            <Text>
              ***Заполняется в случае наличия отчета о научных исследованиях, маркетинговых, консультационных и прочих услугах.
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
