import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { sampleInvoiceData } from "./sample-invoice-data";

// Define types based on the sample invoice data
type InvoiceItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discount: number;
};

type InvoiceProps = {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  company: {
    name: string;
    address: string;
    city?: string;
    postalCode?: string;
    phone?: string;
    email?: string;
    website?: string;
    taxId?: string;
  };
  client: {
    name: string;
    address: string;
    city?: string;
    postalCode?: string;
    phone?: string;
    email?: string;
    taxId?: string;
  };
  items: InvoiceItem[];
  payment: {
    method: "bank_transfer" | "card" | "cash" | "other";
    bankAccount?: string;
    bankName?: string;
    swift?: string;
    notes?: string;
  };
  currency: string;
  notes?: string;
  terms?: string;
};

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#333",
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
  invoiceTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "right",
    marginBottom: 10,
    color: "#2D5990",
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
  companyDetail: {
    marginBottom: 4,
  },
  invoiceDetail: {
    marginBottom: 4,
    textAlign: "right",
  },
  invoiceNumber: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  clientInfo: {
    marginBottom: 4,
  },
  clientName: {
    fontWeight: "bold",
  },
  table: {
    marginTop: 10,
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    borderBottomStyle: "solid",
    paddingBottom: 5,
    paddingTop: 5,
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
  },
  descriptionCell: {
    width: "40%",
  },
  quantityCell: {
    width: "15%",
    textAlign: "right",
  },
  priceCell: {
    width: "15%",
    textAlign: "right",
  },
  taxCell: {
    width: "15%",
    textAlign: "right",
  },
  totalCell: {
    width: "15%",
    textAlign: "right",
  },
  totalSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  totalRow: {
    flexDirection: "row",
    paddingVertical: 3,
  },
  totalLabel: {
    width: 100,
    textAlign: "right",
    paddingRight: 10,
  },
  totalValue: {
    width: 80,
    textAlign: "right",
  },
  totalAmount: {
    fontWeight: "bold",
  },
  paymentSection: {
    marginTop: 20,
  },
  notesSection: {
    marginTop: 20,
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
    fontSize: 11,
    color: "#666",
  },
});

// Helper function to format currency
const formatCurrency = (value: number, currency = "KZT") => {
  return `${value.toFixed(2)} ${currency}`;
};

// Invoice Template Component
const InvoiceTemplate: React.FC<InvoiceProps> = (props) => {
  // Calculate totals
  const subtotal = props.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const tax = props.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice * (item.taxRate / 100),
    0
  );
  const total = props.items.reduce(
    (sum, item) =>
      sum + item.quantity * item.unitPrice * (1 + item.taxRate / 100),
    0
  );

  return (
    <Document title={`Invoice ${props.invoiceNumber}`}>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.invoiceTitle}>INVOICE</Text>

          <View style={styles.grid}>
            {/* Company Information */}
            <View style={styles.column}>
              <Text style={styles.companyName}>{props.company.name}</Text>
              <Text style={styles.companyDetail}>{props.company.address}</Text>
              {(props.company.city || props.company.postalCode) && (
                <Text style={styles.companyDetail}>
                  {props.company.city}
                  {props.company.city && props.company.postalCode && ", "}
                  {props.company.postalCode}
                </Text>
              )}
              {props.company.phone && (
                <Text style={styles.companyDetail}>{props.company.phone}</Text>
              )}
              {props.company.email && (
                <Text style={styles.companyDetail}>{props.company.email}</Text>
              )}
              {props.company.taxId && (
                <Text style={styles.companyDetail}>
                  Tax ID: {props.company.taxId}
                </Text>
              )}
            </View>

            {/* Invoice Details */}
            <View style={styles.column}>
              <Text style={[styles.invoiceDetail, styles.invoiceNumber]}>
                Invoice #: {props.invoiceNumber}
              </Text>
              <Text style={styles.invoiceDetail}>Date: {props.date}</Text>
              <Text style={styles.invoiceDetail}>
                Due Date: {props.dueDate}
              </Text>
            </View>
          </View>
        </View>

        {/* Client Section */}
        <View style={styles.section}>
          <Text style={styles.title}>Bill To</Text>
          <Text style={styles.clientName}>{props.client.name}</Text>
          <Text style={styles.clientInfo}>{props.client.address}</Text>
          {(props.client.city || props.client.postalCode) && (
            <Text style={styles.clientInfo}>
              {props.client.city}
              {props.client.city && props.client.postalCode && ", "}
              {props.client.postalCode}
            </Text>
          )}
          {props.client.phone && (
            <Text style={styles.clientInfo}>{props.client.phone}</Text>
          )}
          {props.client.email && (
            <Text style={styles.clientInfo}>{props.client.email}</Text>
          )}
          {props.client.taxId && (
            <Text style={styles.clientInfo}>Tax ID: {props.client.taxId}</Text>
          )}
        </View>

        {/* Items Section */}
        <View style={styles.section}>
          <Text style={styles.title}>Items</Text>

          {/* Table Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text
              style={[
                styles.tableCell,
                styles.tableHeaderCell,
                styles.descriptionCell,
              ]}
            >
              Description
            </Text>
            <Text
              style={[
                styles.tableCell,
                styles.tableHeaderCell,
                styles.quantityCell,
              ]}
            >
              Quantity
            </Text>
            <Text
              style={[
                styles.tableCell,
                styles.tableHeaderCell,
                styles.priceCell,
              ]}
            >
              Unit Price
            </Text>
            <Text
              style={[styles.tableCell, styles.tableHeaderCell, styles.taxCell]}
            >
              Tax Rate
            </Text>
            <Text
              style={[
                styles.tableCell,
                styles.tableHeaderCell,
                styles.totalCell,
              ]}
            >
              Total
            </Text>
          </View>

          {/* Table Rows */}
          {props.items.map((item, index) => {
            const itemTotal =
              item.quantity * item.unitPrice * (1 + item.taxRate / 100);

            return (
              <View key={`item-${index}`} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.descriptionCell]}>
                  {item.description}
                </Text>
                <Text style={[styles.tableCell, styles.quantityCell]}>
                  {item.quantity}
                </Text>
                <Text style={[styles.tableCell, styles.priceCell]}>
                  {formatCurrency(item.unitPrice, props.currency)}
                </Text>
                <Text style={[styles.tableCell, styles.taxCell]}>
                  {item.taxRate}%
                </Text>
                <Text style={[styles.tableCell, styles.totalCell]}>
                  {formatCurrency(itemTotal, props.currency)}
                </Text>
              </View>
            );
          })}

          {/* Table Summary */}
          <View style={styles.totalSection}>
            <View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal:</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(subtotal, props.currency)}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax:</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(tax, props.currency)}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, styles.totalAmount]}>
                  Total:
                </Text>
                <Text style={[styles.totalValue, styles.totalAmount]}>
                  {formatCurrency(total, props.currency)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Payment Information */}
        <View style={styles.section}>
          <Text style={styles.title}>Payment Information</Text>
          <Text>Payment Method: {props.payment.method.replace("_", " ")}</Text>
          {props.payment.bankName && (
            <Text>Bank Name: {props.payment.bankName}</Text>
          )}
          {props.payment.bankAccount && (
            <Text>Bank Account: {props.payment.bankAccount}</Text>
          )}
          {props.payment.swift && <Text>SWIFT: {props.payment.swift}</Text>}
          {props.payment.notes && <Text>Notes: {props.payment.notes}</Text>}
        </View>

        {/* Notes & Terms */}
        {(props.notes || props.terms) && (
          <View style={styles.notesSection}>
            {props.notes && <Text>Notes: {props.notes}</Text>}
            {props.terms && <Text>Terms & Conditions: {props.terms}</Text>}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Thank you for your business!</Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoiceTemplate;
