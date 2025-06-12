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

// Define styles with fixed widths
const styles = StyleSheet.create({
    page: {
        padding: 20,
        fontSize: 8,
        fontFamily: "Inter",
        lineHeight: 1.2,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 15,
    },
    logoSection: {
        width: 100,
        height: 60,
    },
    logo: {
        width: 80,
        height: 60,
    },
    rightHeader: {
        width: 200,
        fontSize: 7,
        textAlign: "right",
    },
    formReference: {
        fontSize: 7,
        textAlign: "right",
        marginBottom: 2,
    },

    // Customer/Contractor section
    customerSection: {
        marginBottom: 15,
    },
    customerRow: {
        flexDirection: "row",
        marginBottom: 8,
        alignItems: "flex-start",
    },
    customerLabel: {
        width: 80,
        fontSize: 8,
        fontWeight: "bold",
    },
    customerInfo: {
        flex: 1,
        fontSize: 8,
    },
    binSection: {
        width: 120,
        marginLeft: 10,
    },
    binBox: {
        borderWidth: 1,
        borderColor: "#000000",
        padding: 4,
        textAlign: "center",
        marginBottom: 4,
        height: 20,
        justifyContent: "center",
    },
    binLabel: {
        fontSize: 7,
        textAlign: "center",
        marginBottom: 2,
    },

    // Contract section
    contractSection: {
        marginBottom: 15,
        flexDirection: "row",
        alignItems: "center",
    },
    contractLabel: {
        fontSize: 8,
        marginRight: 10,
    },
    contractInfo: {
        fontSize: 8,
        flex: 1,
    },

    // Document info section
    docInfoSection: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginBottom: 15,
    },
    docInfoBox: {
        width: 80,
        marginLeft: 5,
    },
    docInfoLabel: {
        fontSize: 7,
        textAlign: "center",
        marginBottom: 2,
    },
    docInfoValue: {
        borderWidth: 1,
        borderColor: "#000000",
        padding: 4,
        textAlign: "center",
        height: 20,
        justifyContent: "center",
    },

    // Title
    title: {
        fontSize: 12,
        fontWeight: "bold",
        textAlign: "center",
        marginVertical: 15,
    },

    // Table styles with fixed widths
    table: {
        marginVertical: 15,
        borderWidth: 1,
        borderColor: "#000000",
    },
    tableHeader: {
        backgroundColor: "#F5F5F5",
        fontWeight: "bold",
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#000000",
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#000000",
        minHeight: 25,
    },

    // Fixed width cells
    cell: {
        padding: 2,
        borderRightWidth: 1,
        borderRightColor: "#000000",
        justifyContent: "center",
        fontSize: 6,
        flexWrap: "wrap",
    },
    cellNoBorder: {
        padding: 2,
        justifyContent: "center",
        fontSize: 6,
        flexWrap: "wrap",
    },

    // Text wrapping styles
    wrappedText: {
        flexWrap: "wrap",
        textAlign: "center",
    },
    wrappedTextLeft: {
        flexWrap: "wrap",
        textAlign: "left",
    },
    wrappedTextRight: {
        flexWrap: "wrap",
        textAlign: "right",
    },

    // Specific column widths (total should be ~555px for A4 with padding)
    col1: { width: 30 }, // №
    col2: { width: 160 }, // Наименование работ (услуг)
    col3: { width: 55 }, // Дата выполнения работ
    col4: { width: 90 }, // Сведения об отчете
    col5: { width: 45 }, // Единица измерения
    col6: { width: 175 }, // Parent: Выполнено работ (оказано услуг)
    col6a: { width: 40 }, // Количество
    col6b: { width: 45 }, // цена за единицу
    col6c: { width: 45 }, // стоимость
    col6d: { width: 45 }, // в том числе НДС

    // Text alignment
    centerText: { textAlign: "center" },
    rightText: { textAlign: "right" },
    leftText: { textAlign: "left" },

    // Totals section
    totalsRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 10,
        marginBottom: 10,
    },

    // Information sections
    infoSection: {
        marginVertical: 10,
        fontSize: 8,
    },
    infoLabel: {
        fontSize: 7,
        fontStyle: "italic",
        color: "#666666",
    },

    // Signatures section
    signaturesSection: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 30,
        marginBottom: 20,
    },
    signatureBox: {
        width: 200,
    },
    signatureRole: {
        fontSize: 8,
        marginBottom: 5,
    },
    signatureLine: {
        borderBottomWidth: 1,
        borderBottomColor: "#000000",
        marginVertical: 8,
        height: 15,
    },
    signatureLabels: {
        flexDirection: "row",
        justifyContent: "space-between",
        fontSize: 6,
        marginBottom: 5,
    },
    signatureName: {
        fontSize: 8,
        marginTop: 5,
    },

    // Date section
    dateSection: {
        textAlign: "center",
        marginTop: 20,
        fontSize: 8,
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
        return `${day}.${month}.${year.slice(-2)}`;
    } catch (error) {
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

export const KazakhActTemplate = (props: { data: KazakhActTemplateData }) => {
    const data = props.data;
    const formattedActDate = formatDate(data.actDate);
    const formattedContractDate = formatDate(data.contractDate);
    const formattedCompletionDate = formatDate(data.dateOfCompletion);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header section */}
                <View style={styles.header}>
                    <View style={styles.logoSection}>
                        {data.sellerImage && (
                            <Image style={styles.logo} src={data.sellerImage} />
                        )}
                    </View>
                    <View style={styles.rightHeader}>
                        <Text style={styles.formReference}>
                            Приложение 50 к приказу
                        </Text>
                        <Text style={styles.formReference}>
                            Министра финансов
                        </Text>
                        <Text style={styles.formReference}>
                            Республики Казахстан от 20
                        </Text>
                        <Text style={styles.formReference}>
                            декабря 2012 года №562
                        </Text>
                    </View>
                </View>

                {/* Customer and Contractor section */}
                <View style={styles.customerSection}>
                    {/* Customer row */}
                    <View style={styles.customerRow}>
                        <Text style={styles.customerLabel}>Заказчик</Text>
                        <Text style={styles.customerInfo}>
                            {data.clientName}
                        </Text>
                        <View style={styles.binSection}>
                            <Text style={styles.binLabel}>ИИН/БИН</Text>
                            <View style={styles.binBox}>
                                <Text>{data.clientBin}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={{ marginLeft: 80, marginBottom: 8 }}>
                        <Text style={styles.infoLabel}>
                            полное наименование, адрес, данные о средствах связи
                        </Text>
                    </View>

                    {/* Contractor row */}
                    <View style={styles.customerRow}>
                        <Text style={styles.customerLabel}>Исполнитель</Text>
                        <Text style={styles.customerInfo}>
                            {data.companyName}, {data.sellerAddress}
                        </Text>
                        <View style={styles.binSection}>
                            <Text style={styles.binLabel}></Text>
                            <View style={styles.binBox}>
                                <Text>{data.bin}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={{ marginLeft: 80, marginBottom: 8 }}>
                        <Text style={styles.infoLabel}>
                            полное наименование, адрес, данные о средствах связи
                        </Text>
                    </View>

                    {/* Contract row */}
                    <View style={styles.contractSection}>
                        <Text style={styles.contractLabel}>Договор (контракт)</Text>
                        <Text style={styles.contractInfo}>
                            {data.contractNumber}, от {formattedContractDate}
                        </Text>
                        <View style={styles.docInfoSection}>
                            <View style={styles.docInfoBox}>
                                <Text style={styles.docInfoLabel}>Номер документа</Text>
                                <View style={styles.docInfoValue}>
                                    <Text>{data.actNumber}</Text>
                                </View>
                            </View>
                            <View style={styles.docInfoBox}>
                                <Text style={styles.docInfoLabel}>Дата составления</Text>
                                <View style={styles.docInfoValue}>
                                    <Text>{formattedActDate}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Title */}
                <Text style={styles.title}>
                    АКТ ВЫПОЛНЕННЫХ РАБОТ (ОКАЗАННЫХ УСЛУГ)
                </Text>

                {/* Main table */}
                <View style={styles.table}>
                    {/* Table header - Combined structure */}
                    <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#000000" }}>
                        {/* Columns 1-5: Single row spanning full height */}
                        <View style={[styles.cell, styles.col1, { height: 50, justifyContent: "center", borderBottomWidth: 0 }]}>
                            <Text style={styles.centerText}>Номер по порядку</Text>
                        </View>
                        <View style={[styles.cell, styles.col2, { height: 50, justifyContent: "center", borderBottomWidth: 0 }]}>
                            <Text style={styles.centerText}>
                                Наименование работ (услуг) (в разрезе их подвидов в соответствии с технической спецификацией, заданием, графиком выполнения работ (услуг) при их наличии)
                            </Text>
                        </View>
                        <View style={[styles.cell, styles.col3, { height: 50, justifyContent: "center", borderBottomWidth: 0 }]}>
                            <Text style={styles.centerText}>
                                Дата выполнения работ (оказания услуг)
                            </Text>
                        </View>
                        <View style={[styles.cell, styles.col4, { height: 50, justifyContent: "center", borderBottomWidth: 0 }]}>
                            <Text style={styles.centerText}>
                                Сведения об отчете о научных исследованиях, маркетинговых, консультационных и прочих услугах (дата, номер, количество страниц) (при их наличии)
                            </Text>
                        </View>
                        <View style={[styles.cell, styles.col5, { height: 50, justifyContent: "center", borderBottomWidth: 0 }]}>
                            <Text style={styles.centerText}>Единица измерения</Text>
                        </View>

                        {/* Columns 6-9: Two-row structure */}
                        <View style={{ width: 175, borderLeftWidth: 1, borderLeftColor: "#000000" }}>
                            {/* Parent header */}
                            <View style={{
                                height: 25,
                                borderBottomWidth: 1,
                                borderBottomColor: "#000000",
                                justifyContent: "center",
                                alignItems: "center",
                                backgroundColor: "#F5F5F5"
                            }}>
                                <Text style={[styles.wrappedText, { fontWeight: "bold", fontSize: 6 }]}>Выполнено работ (оказано услуг)</Text>
                            </View>

                            {/* Sub-headers */}
                            <View style={{ flexDirection: "row", height: 25 }}>
                                <View style={[styles.cell, {
                                    width: 40,
                                    height: 25,
                                    borderTopWidth: 0,
                                    borderBottomWidth: 0,
                                    justifyContent: "center"
                                }]}>
                                    <Text style={styles.wrappedText}>количество</Text>
                                </View>
                                <View style={[styles.cell, {
                                    width: 45,
                                    height: 25,
                                    borderTopWidth: 0,
                                    borderBottomWidth: 0,
                                    justifyContent: "center"
                                }]}>
                                    <Text style={styles.wrappedText}>цена за единицу</Text>
                                </View>
                                <View style={[styles.cell, {
                                    width: 45,
                                    height: 25,
                                    borderTopWidth: 0,
                                    borderBottomWidth: 0,
                                    justifyContent: "center"
                                }]}>
                                    <Text style={styles.wrappedText}>стоимость</Text>
                                </View>
                                <View style={[styles.cellNoBorder, {
                                    width: 45,
                                    height: 25,
                                    borderTopWidth: 0,
                                    borderBottomWidth: 0,
                                    justifyContent: "center"
                                }]}>
                                    <Text style={styles.wrappedText}>в том числе НДС, в КЗТ</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Column numbers row */}
                    <View style={styles.tableRow}>
                        <View style={[styles.cell, styles.col1]}>
                            <Text style={styles.centerText}>1</Text>
                        </View>
                        <View style={[styles.cell, styles.col2]}>
                            <Text style={styles.centerText}>2</Text>
                        </View>
                        <View style={[styles.cell, styles.col3]}>
                            <Text style={styles.centerText}>3</Text>
                        </View>
                        <View style={[styles.cell, styles.col4]}>
                            <Text style={styles.centerText}>4</Text>
                        </View>
                        <View style={[styles.cell, styles.col5]}>
                            <Text style={styles.centerText}>5</Text>
                        </View>
                        <View style={[styles.cell, styles.col6a]}>
                            <Text style={styles.centerText}>6</Text>
                        </View>
                        <View style={[styles.cell, styles.col6b]}>
                            <Text style={styles.centerText}>7</Text>
                        </View>
                        <View style={[styles.cell, styles.col6c]}>
                            <Text style={styles.centerText}>8</Text>
                        </View>
                        <View style={[styles.cellNoBorder, styles.col6d]}>
                            <Text style={styles.centerText}>9</Text>
                        </View>
                    </View>

                    {/* Data rows */}
                    {data.items.map((item, index) => (
                        <View key={index} style={styles.tableRow}>
                            <View style={[styles.cell, styles.col1]}>
                                <Text style={styles.wrappedText}>{index + 1}</Text>
                            </View>
                            <View style={[styles.cell, styles.col2]}>
                                <Text style={styles.wrappedTextLeft}>{item.description}</Text>
                            </View>
                            <View style={[styles.cell, styles.col3]}>
                                <Text style={styles.wrappedText}>{formattedCompletionDate}</Text>
                            </View>
                            <View style={[styles.cell, styles.col4]}>
                                <Text style={styles.wrappedText}></Text>
                            </View>
                            <View style={[styles.cell, styles.col5]}>
                                <Text style={styles.wrappedText}>{item.unit}</Text>
                            </View>
                            <View style={[styles.cell, styles.col6a]}>
                                <Text style={styles.wrappedText}>{item.quantity}</Text>
                            </View>
                            <View style={[styles.cell, styles.col6b]}>
                                <Text style={styles.wrappedTextRight}>{formatCurrency(item.price)}</Text>
                            </View>
                            <View style={[styles.cell, styles.col6c]}>
                                <Text style={styles.wrappedTextRight}>{formatCurrency(item.quantity * item.price)}</Text>
                            </View>
                            <View style={[styles.cellNoBorder, styles.col6d]}>
                                <Text style={styles.wrappedTextRight}>{formatCurrency((item.quantity * item.price) * 0.12)}</Text>
                            </View>
                        </View>
                    ))}

                    {/* Totals row */}
                    <View style={styles.tableRow}>
                        <View style={[styles.cell, styles.col1]}></View>
                        <View style={[styles.cell, styles.col2]}></View>
                        <View style={[styles.cell, styles.col3]}></View>
                        <View style={[styles.cell, styles.col4]}></View>
                        <View style={[styles.cell, styles.col5]}>
                            <Text style={styles.wrappedText}>Итого</Text>
                        </View>
                        <View style={[styles.cell, styles.col6a]}>
                            <Text style={styles.wrappedText}>
                                {data.items.reduce((sum, item) => sum + item.quantity, 0).toFixed(1)}
                            </Text>
                        </View>
                        <View style={[styles.cell, styles.col6b]}>
                            <Text style={styles.wrappedText}>x</Text>
                        </View>
                        <View style={[styles.cell, styles.col6c]}>
                            <Text style={styles.wrappedTextRight}>{formatCurrency(data.totalAmount)}</Text>
                        </View>
                        <View style={[styles.cellNoBorder, styles.col6d]}>
                            <Text style={styles.wrappedTextRight}>{formatCurrency(data.vatAmount)}</Text>
                        </View>
                    </View>
                </View>

                {/* Information about supplies */}
                <View style={styles.infoSection}>
                    <Text>Сведения об использовании запасов, полученных от заказчика</Text>
                    <View style={{ borderBottomWidth: 1, borderBottomColor: "#000000", marginVertical: 5 }} />
                    <Text style={styles.infoLabel}>наименование, количество, стоимость</Text>
                </View>

                <View style={styles.infoSection}>
                    <Text>
                        Приложение: Перечень документации, в том числе отчет(ы) о маркетинговых, научных исследованиях, консультационных и прочих услугах (обязательны при его (их) наличии) на __________ страниц
                    </Text>
                </View>

                {/* Signatures section */}
                <View style={styles.signaturesSection}>
                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureRole}>Сдал (Исполнитель)</Text>
                        <Text style={styles.signatureRole}>{data.executorPosition || "Директор"}</Text>
                        <View style={styles.signatureLine} />
                        <View style={styles.signatureLabels}>
                            <Text>должность</Text>
                            <Text>подпись</Text>
                            <Text>расшифровка подписи</Text>
                        </View>
                        <Text style={styles.signatureName}>{data.executorName || ""}</Text>
                    </View>

                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureRole}>Принял (Заказчик)</Text>
                        <Text style={styles.signatureRole}>{data.customerPosition || "Директор"}</Text>
                        <View style={styles.signatureLine} />
                        <View style={styles.signatureLabels}>
                            <Text>должность</Text>
                            <Text>подпись</Text>
                            <Text>расшифровка подписи</Text>
                        </View>
                        <Text style={styles.signatureName}>{data.customerName || ""}</Text>
                    </View>
                </View>

                {/* Final date */}
                <View style={styles.dateSection}>
                    <Text>Дата подписания (принятия) работ (услуг) ____________{formattedCompletionDate}____________</Text>
                </View>
            </Page>
        </Document>
    );
};
