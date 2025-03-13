import React from "react";
import ReactPDF, { renderToFile, renderToBuffer } from "@react-pdf/renderer";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { Buffer } from "buffer";
import path from "path";
import fs from "fs";
import InvoiceTemplate from "./InvoiceTemplate";
import KazakhInvoiceTemplate from "./KazakhInvoiceTemplate";

/**
 * Register local fonts for PDF generation
 */
export function registerFonts() {
  try {
    const fontPath = path.join(__dirname, "fonts");

    // Check if fonts directory exists
    if (!fs.existsSync(fontPath)) {
      console.warn(`Fonts directory not found at ${fontPath}`);
      return;
    }

    // Font weight mapping
    const fontWeightMap: Record<string, number> = {
      Thin: 100,
      ExtraLight: 200,
      Light: 300,
      Regular: 400,
      Medium: 500,
      SemiBold: 600,
      Bold: 700,
      ExtraBold: 800,
      Black: 900,
    };

    // Register only the 24pt Inter fonts as the main "Inter" font family
    const interFonts: Array<{
      src: string;
      fontWeight: number;
      fontStyle: "normal" | "italic";
    }> = [];

    // Find all 24pt font files
    const fontFiles = fs
      .readdirSync(fontPath)
      .filter((file) => file.startsWith("Inter_24pt"));

    // Process each font file
    for (const file of fontFiles) {
      // Parse weight and style from filename
      // Format: Inter_XXpt-WeightStyle.ttf
      const nameParts = file.replace(".ttf", "").split("-");
      if (nameParts.length !== 2) continue;

      let weight = "Regular";
      let isItalic = false;

      // Check if it's an italic variant
      if (nameParts[1].includes("Italic")) {
        isItalic = true;
        weight = nameParts[1].replace("Italic", "");
        if (weight === "") weight = "Regular";
      } else {
        weight = nameParts[1];
      }

      // Add to fonts array
      interFonts.push({
        src: path.join(fontPath, file),
        fontWeight: fontWeightMap[weight] || 400,
        fontStyle: isItalic ? "italic" : "normal",
      });
    }

    // Register as a single font family
    if (interFonts.length > 0) {
      Font.register({ family: "Inter", fonts: interFonts });
      console.log(`Registered ${interFonts.length} Inter fonts successfully`);
    }
  } catch (error) {
    console.error("Error registering fonts:", error);
  }
}

// Register fonts when this module is imported
registerFonts();

// Remove external font loading that's causing issues
// Font.register({
//   family: "Roboto",
//   fonts: [
//     {
//       src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular.ttf",
//       fontWeight: "normal",
//     },
//     {
//       src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold.ttf",
//       fontWeight: "bold",
//     },
//   ],
// });

// Define default styles
const styles = StyleSheet.create({
  page: {
    padding: 50,
    // Use default fonts instead of Roboto
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  section: {
    marginBottom: 20,
  },
  title: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
  },
  header: {
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "right",
    marginBottom: 10,
  },
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  column: {
    flex: 1,
  },
  rightAlign: {
    textAlign: "right",
  },
  companyName: {
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 4,
  },
  companyDetails: {
    marginBottom: 4,
  },
  invoiceDetails: {
    textAlign: "right",
  },
  invoiceNumber: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  table: {
    marginTop: 10,
    marginBottom: 10,
    width: "100%",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    borderBottomStyle: "solid",
    paddingBottom: 5,
    paddingTop: 5,
    width: "100%",
  },
  tableHeader: {
    backgroundColor: "#F8F8F8",
    fontWeight: "bold",
  },
  tableHeaderCell: {
    fontWeight: "bold",
  },
  tableCell: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  tableCellDescription: {
    width: "40%",
  },
  tableCellQuantity: {
    width: "15%",
    textAlign: "right",
  },
  tableCellUnitPrice: {
    width: "15%",
    textAlign: "right",
  },
  tableCellTaxRate: {
    width: "15%",
    textAlign: "right",
  },
  tableCellTotal: {
    width: "15%",
    textAlign: "right",
  },
  tableSummary: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  tableSummaryRow: {
    flexDirection: "row",
    paddingVertical: 3,
  },
  tableSummaryLabel: {
    width: 100,
    textAlign: "right",
    paddingRight: 10,
  },
  tableSummaryValue: {
    width: 80,
    textAlign: "right",
  },
  tableSummaryTotal: {
    fontWeight: "bold",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: "center",
  },
  footerText: {
    textAlign: "center",
  },
});

// Helper function to format currency
const formatCurrency = (value: number, currency = "KZT") => {
  return `${value.toFixed(2)} ${currency}`;
};

// Helper to get value from nested path
const getValueByPath = (obj: any, path: string) => {
  return path.split(".").reduce((prev, curr) => {
    return prev ? prev[curr] : undefined;
  }, obj);
};

/**
 * Generate a Document component based on the template and data
 */
const generateDocumentComponent = (documentData: any, pdfTemplate: any) => {
  // Extract document title from template
  const documentTitle = pdfTemplate?.documentTitle || "Document";

  return (
    <Document title={documentTitle}>
      <Page size="A4" style={styles.page}>
        {pdfTemplate?.layout?.sections?.map(
          (section: any, sectionIndex: number) => {
            switch (section.type) {
              case "header":
                return (
                  <View key={`section-${sectionIndex}`} style={styles.header}>
                    {section.components?.map(
                      (component: any, componentIndex: number) => {
                        if (component.type === "text" && component.content) {
                          return (
                            <Text
                              key={`component-${componentIndex}`}
                              style={[
                                styles.headerTitle,
                                component.style?.textAlign === "right"
                                  ? styles.rightAlign
                                  : {},
                              ]}
                            >
                              {component.content}
                            </Text>
                          );
                        } else if (
                          component.type === "grid" &&
                          component.components
                        ) {
                          return (
                            <View
                              key={`component-${componentIndex}`}
                              style={styles.grid}
                            >
                              {component.components.map(
                                (gridItem: any, gridIndex: number) => {
                                  if (gridItem.type === "stack") {
                                    return (
                                      <View
                                        key={`grid-item-${gridIndex}`}
                                        style={[
                                          styles.column,
                                          gridItem.style?.textAlign === "right"
                                            ? styles.rightAlign
                                            : {},
                                        ]}
                                      >
                                        {gridItem.components?.map(
                                          (
                                            stackItem: any,
                                            stackIndex: number
                                          ) => {
                                            if (stackItem.type === "text") {
                                              let text = "";
                                              if (stackItem.fieldPath) {
                                                text =
                                                  getValueByPath(
                                                    documentData,
                                                    stackItem.fieldPath
                                                  ) || "";
                                                if (stackItem.label && text) {
                                                  text = `${stackItem.label} ${text}`;
                                                }
                                              } else if (stackItem.template) {
                                                // Simple template parsing
                                                text =
                                                  stackItem.template.replace(
                                                    /\{\{([^}]+)\}\}/g,
                                                    (
                                                      match: string,
                                                      path: string
                                                    ) => {
                                                      return (
                                                        getValueByPath(
                                                          documentData,
                                                          path
                                                        ) || ""
                                                      );
                                                    }
                                                  );
                                              } else if (stackItem.content) {
                                                text = stackItem.content;
                                              }

                                              return (
                                                <Text
                                                  key={`stack-item-${stackIndex}`}
                                                  style={[
                                                    gridIndex === 0 &&
                                                    stackIndex === 0
                                                      ? styles.companyName
                                                      : styles.companyDetails,
                                                    gridIndex === 1 &&
                                                    stackIndex === 0
                                                      ? styles.invoiceNumber
                                                      : {},
                                                    stackItem.style
                                                      ?.fontWeight === "bold"
                                                      ? { fontWeight: "bold" }
                                                      : {},
                                                  ]}
                                                >
                                                  {text}
                                                </Text>
                                              );
                                            }
                                            return null;
                                          }
                                        )}
                                      </View>
                                    );
                                  }
                                  return null;
                                }
                              )}
                            </View>
                          );
                        }
                        return null;
                      }
                    )}
                  </View>
                );

              case "section":
                return (
                  <View key={`section-${sectionIndex}`} style={styles.section}>
                    {section.title && (
                      <Text style={styles.title}>{section.title}</Text>
                    )}

                    {section.components?.map(
                      (component: any, componentIndex: number) => {
                        if (component.type === "stack") {
                          return (
                            <View key={`component-${componentIndex}`}>
                              {component.components?.map(
                                (stackItem: any, stackIndex: number) => {
                                  if (stackItem.type === "text") {
                                    let text = "";
                                    if (stackItem.fieldPath) {
                                      text =
                                        getValueByPath(
                                          documentData,
                                          stackItem.fieldPath
                                        ) || "";
                                      if (stackItem.label && text) {
                                        text = `${stackItem.label} ${text}`;
                                      }
                                    } else if (stackItem.template) {
                                      // Simple template parsing
                                      text = stackItem.template.replace(
                                        /\{\{([^}]+)\}\}/g,
                                        (match: string, path: string) => {
                                          return (
                                            getValueByPath(
                                              documentData,
                                              path
                                            ) || ""
                                          );
                                        }
                                      );
                                    } else if (stackItem.content) {
                                      text = stackItem.content;
                                    }

                                    return (
                                      <Text
                                        key={`stack-item-${stackIndex}`}
                                        style={
                                          stackItem.style?.fontWeight === "bold"
                                            ? { fontWeight: "bold" }
                                            : {}
                                        }
                                      >
                                        {text}
                                      </Text>
                                    );
                                  }
                                  return null;
                                }
                              )}
                            </View>
                          );
                        } else if (
                          component.type === "table" &&
                          component.fieldPath
                        ) {
                          const tableData =
                            getValueByPath(documentData, component.fieldPath) ||
                            [];

                          if (
                            Array.isArray(tableData) &&
                            tableData.length > 0 &&
                            component.columns
                          ) {
                            return (
                              <View
                                key={`component-${componentIndex}`}
                                style={styles.table}
                              >
                                {/* Table Header */}
                                <View
                                  style={[styles.tableRow, styles.tableHeader]}
                                >
                                  {component.columns.map(
                                    (column: any, columnIndex: number) => {
                                      // Determine the column width style based on column.width or default
                                      let columnWidthStyle = {};
                                      if (column.width) {
                                        columnWidthStyle = {
                                          width: column.width,
                                        };
                                      } else {
                                        // Default width if not specified
                                        columnWidthStyle = {
                                          width: `${
                                            100 / component.columns.length
                                          }%`,
                                        };
                                      }

                                      return (
                                        <Text
                                          key={`column-${columnIndex}`}
                                          style={[
                                            styles.tableCell,
                                            styles.tableHeaderCell,
                                            columnWidthStyle,
                                            column.align === "right"
                                              ? { textAlign: "right" }
                                              : {},
                                          ]}
                                        >
                                          {column.header}
                                        </Text>
                                      );
                                    }
                                  )}
                                </View>

                                {/* Table Rows */}
                                {tableData.map((row: any, rowIndex: number) => (
                                  <View
                                    key={`row-${rowIndex}`}
                                    style={styles.tableRow}
                                  >
                                    {component.columns.map(
                                      (column: any, columnIndex: number) => {
                                        let cellValue = "";

                                        if (column.fieldPath) {
                                          cellValue =
                                            getValueByPath(
                                              row,
                                              column.fieldPath
                                            ) || "";
                                        } else if (column.calculate) {
                                          // Simple expression for calculation
                                          // In a real implementation, you'd need a more sophisticated approach
                                          const calculatedValue =
                                            column.calculate.replace(
                                              /\{\{([^}]+)\}\}/g,
                                              (match: string, path: string) => {
                                                // Handle basic calculations with item context
                                                if (path.startsWith("item.")) {
                                                  const itemPath =
                                                    path.substring(5);
                                                  const value = getValueByPath(
                                                    row,
                                                    itemPath
                                                  );
                                                  return value !== undefined
                                                    ? value
                                                    : 0;
                                                }
                                                return 0;
                                              }
                                            );

                                          try {
                                            // Use a safer approach in production
                                            cellValue = eval(calculatedValue);
                                          } catch (e) {
                                            console.error(
                                              "Error calculating cell value:",
                                              e
                                            );
                                            cellValue = "";
                                          }
                                        }

                                        // Format the value if needed
                                        if (
                                          column.format === "currency" &&
                                          !isNaN(Number(cellValue))
                                        ) {
                                          cellValue = formatCurrency(
                                            Number(cellValue),
                                            documentData.currency || "KZT"
                                          );
                                        } else if (
                                          column.format === "percent" &&
                                          !isNaN(Number(cellValue))
                                        ) {
                                          cellValue = `${cellValue}%`;
                                        }

                                        // Determine the column width style based on column.width or default
                                        let columnWidthStyle = {};
                                        if (column.width) {
                                          columnWidthStyle = {
                                            width: column.width,
                                          };
                                        } else {
                                          // Default width if not specified
                                          columnWidthStyle = {
                                            width: `${
                                              100 / component.columns.length
                                            }%`,
                                          };
                                        }

                                        return (
                                          <Text
                                            key={`cell-${columnIndex}`}
                                            style={[
                                              styles.tableCell,
                                              columnWidthStyle,
                                              column.align === "right"
                                                ? { textAlign: "right" }
                                                : {},
                                            ]}
                                          >
                                            {cellValue}
                                          </Text>
                                        );
                                      }
                                    )}
                                  </View>
                                ))}

                                {/* Table Summary */}
                                {component.summaries && (
                                  <View style={styles.tableSummary}>
                                    <View>
                                      {component.summaries.map(
                                        (
                                          summary: any,
                                          summaryIndex: number
                                        ) => {
                                          // Calculate summary values
                                          let summaryValue = 0;

                                          if (summary.calculate) {
                                            // This is a simplified approach. In a real app, use a proper expression parser
                                            if (
                                              summary.calculate.includes(
                                                "sum(items.map"
                                              )
                                            ) {
                                              // Handle sum calculations
                                              if (
                                                summary.calculate.includes(
                                                  "quantity * unitPrice"
                                                )
                                              ) {
                                                // Subtotal
                                                summaryValue = tableData.reduce(
                                                  (total: number, item: any) =>
                                                    total +
                                                    item.quantity *
                                                      item.unitPrice,
                                                  0
                                                );
                                              } else if (
                                                summary.calculate.includes(
                                                  "quantity * unitPrice * (item.taxRate/100)"
                                                )
                                              ) {
                                                // Tax
                                                summaryValue = tableData.reduce(
                                                  (total: number, item: any) =>
                                                    total +
                                                    item.quantity *
                                                      item.unitPrice *
                                                      (item.taxRate / 100),
                                                  0
                                                );
                                              } else if (
                                                summary.calculate.includes(
                                                  "quantity * unitPrice * (1 + item.taxRate/100)"
                                                )
                                              ) {
                                                // Total
                                                summaryValue = tableData.reduce(
                                                  (total: number, item: any) =>
                                                    total +
                                                    item.quantity *
                                                      item.unitPrice *
                                                      (1 + item.taxRate / 100),
                                                  0
                                                );
                                              }
                                            }
                                          }

                                          // Format value
                                          let formattedValue = summaryValue;
                                          if (summary.format === "currency") {
                                            formattedValue = formatCurrency(
                                              summaryValue,
                                              documentData.currency || "KZT"
                                            );
                                          }

                                          return (
                                            <View
                                              key={`summary-${summaryIndex}`}
                                              style={styles.tableSummaryRow}
                                            >
                                              <Text
                                                style={styles.tableSummaryLabel}
                                              >
                                                {summary.label}:
                                              </Text>
                                              <Text
                                                style={[
                                                  styles.tableSummaryValue,
                                                  summary.style?.fontWeight ===
                                                  "bold"
                                                    ? styles.tableSummaryTotal
                                                    : {},
                                                ]}
                                              >
                                                {formattedValue}
                                              </Text>
                                            </View>
                                          );
                                        }
                                      )}
                                    </View>
                                  </View>
                                )}
                              </View>
                            );
                          }
                        }
                        return null;
                      }
                    )}
                  </View>
                );

              case "footer":
                return (
                  <View key={`section-${sectionIndex}`} style={styles.footer}>
                    {section.components?.map(
                      (component: any, componentIndex: number) => {
                        if (component.type === "text" && component.content) {
                          return (
                            <Text
                              key={`component-${componentIndex}`}
                              style={styles.footerText}
                            >
                              {component.content}
                            </Text>
                          );
                        }
                        return null;
                      }
                    )}
                  </View>
                );

              default:
                return null;
            }
          }
        )}
      </Page>
    </Document>
  );
};

/**
 * Generate a PDF from document data using React PDF
 * @param documentData The data to populate the PDF with
 * @param pdfTemplate The template defining how to render the PDF
 * @returns Buffer containing the generated PDF
 */
export async function generatePdf(
  documentData: any,
  pdfTemplate: any
): Promise<Buffer> {
  // Generate React component
  const MyDocument = generateDocumentComponent(documentData, pdfTemplate);

  // Render to PDF buffer
  try {
    const buffer = await renderToBuffer(MyDocument);
    return buffer;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}

/**
 * Generate an invoice PDF from document data using React PDF
 * @param invoiceData The invoice data
 * @returns Buffer containing the generated PDF
 */
export async function generateInvoicePdf(invoiceData: any): Promise<Buffer> {
  // Create the invoice document component with the provided data
  const InvoiceDocument = <InvoiceTemplate {...invoiceData} />;

  // Render to PDF buffer
  try {
    const buffer = await renderToBuffer(InvoiceDocument);
    return buffer;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}

/**
 * Generate a Kazakh-style invoice PDF
 * @param invoiceData The Kazakh invoice data
 * @returns Buffer containing the generated PDF
 */
export async function generateKazakhInvoicePdf(
  invoiceData: any
): Promise<Buffer> {
  // Ensure fonts are registered
  registerFonts();

  // Create the Kazakh invoice document component with the provided data
  const KazakhInvoiceDocument = <KazakhInvoiceTemplate {...invoiceData} />;

  // Render to PDF buffer
  try {
    const buffer = await renderToBuffer(KazakhInvoiceDocument);
    return buffer;
  } catch (error) {
    console.error("Error generating Kazakh invoice PDF:", error);
    throw error;
  }
}
