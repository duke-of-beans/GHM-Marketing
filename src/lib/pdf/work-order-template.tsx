import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { TenantConfig } from "@/lib/tenant/config";

// ============================================================================
// Styles
// ============================================================================

const colors = {
  primary: "#1a1a2e",
  accent: "#16213e",
  blue: "#0f3460",
  highlight: "#e94560",
  lightGray: "#f5f5f5",
  gray: "#666666",
  darkGray: "#333333",
  white: "#ffffff",
  green: "#22c55e",
  red: "#ef4444",
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: colors.darkGray,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  headerLeft: {},
  headerRight: {
    textAlign: "right",
  },
  companyName: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    marginBottom: 4,
  },
  companyTagline: {
    fontSize: 9,
    color: colors.gray,
    letterSpacing: 1,
  },
  woNumber: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: colors.accent,
  },
  woDate: {
    fontSize: 9,
    color: colors.gray,
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    width: 120,
    fontSize: 9,
    color: colors.gray,
  },
  value: {
    flex: 1,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  // Competitive analysis card
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: colors.lightGray,
    marginBottom: 2,
    borderRadius: 3,
  },
  metricLabel: {
    fontSize: 9,
    color: colors.gray,
  },
  metricValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  metricBad: { color: colors.red },
  metricGood: { color: colors.green },
  // Products table
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 3,
  },
  tableHeaderText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: colors.white,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  colProduct: { flex: 3 },
  colType: { flex: 1.5 },
  colQty: { flex: 0.5, textAlign: "right" },
  colPrice: { flex: 1.2, textAlign: "right" },
  colDiscount: { flex: 1, textAlign: "right" },
  colTotal: { flex: 1.2, textAlign: "right" },
  // Totals
  totalsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  totalLabel: {
    fontSize: 10,
    color: colors.gray,
    marginRight: 20,
  },
  totalValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    width: 80,
    textAlign: "right",
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: colors.primary,
    borderRadius: 3,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: colors.white,
    marginRight: 20,
  },
  grandTotalValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: colors.white,
    width: 80,
    textAlign: "right",
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: colors.gray,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  notes: {
    fontSize: 9,
    color: colors.gray,
    lineHeight: 1.5,
    padding: 10,
    backgroundColor: colors.lightGray,
    borderRadius: 3,
  },
});

// ============================================================================
// Types
// ============================================================================

export type WorkOrderData = {
  workOrderNumber: string;
  date: string;
  // Business info
  businessName: string;
  contactName?: string;
  phone: string;
  email?: string;
  website?: string;
  address?: string;
  city: string;
  state: string;
  zipCode: string;
  // Sales rep
  repName: string;
  repEmail: string;
  // Competitive intel
  domainRating?: number;
  ahrefsRank?: number;
  reviewCount?: number;
  reviewAvg?: number;
  performanceScore?: number;
  seoScore?: number;
  organicTraffic?: number;
  // Products
  products: {
    name: string;
    pricingModel: string;
    quantity: number;
    unitPrice: number;
    discountPercent: number;
    finalPrice: number;
  }[];
  // Totals
  oneTimeTotal: number;
  monthlyTotal: number;
  annualTotal: number;
  grandTotal: number;
  // Notes
  notes?: string;
};

// ============================================================================
// PDF Component
// ============================================================================

export function WorkOrderPDF({ data, tenant }: { data: WorkOrderData; tenant: TenantConfig }) {
  const formatCurrency = (val: number) =>
    `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatPricingModel = (model: string) => {
    const labels: Record<string, string> = {
      monthly: "Monthly",
      annual: "Annual",
      one_time: "One-Time",
    };
    return labels[model] || model;
  };

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>{tenant.fromName}</Text>
            <Text style={styles.companyTagline}>{(tenant.companyTagline ?? "").toUpperCase()}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.woNumber}>WO #{data.workOrderNumber}</Text>
            <Text style={styles.woDate}>{data.date}</Text>
            <Text style={[styles.woDate, { marginTop: 2 }]}>
              Rep: {data.repName}
            </Text>
          </View>
        </View>

        {/* Client Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Business</Text>
            <Text style={styles.value}>{data.businessName}</Text>
          </View>
          {data.contactName && (
            <View style={styles.row}>
              <Text style={styles.label}>Contact</Text>
              <Text style={styles.value}>{data.contactName}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{data.phone}</Text>
          </View>
          {data.email && (
            <View style={styles.row}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{data.email}</Text>
            </View>
          )}
          {data.website && (
            <View style={styles.row}>
              <Text style={styles.label}>Website</Text>
              <Text style={styles.value}>{data.website}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Location</Text>
            <Text style={styles.value}>
              {data.city}, {data.state} {data.zipCode}
            </Text>
          </View>
        </View>

        {/* Competitive Analysis */}
        {(data.domainRating !== undefined || data.reviewCount !== undefined || data.performanceScore !== undefined) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Digital Presence</Text>
            {data.domainRating !== undefined && (
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Domain Rating (Ahrefs)</Text>
                <Text style={[styles.metricValue, data.domainRating < 20 ? styles.metricBad : styles.metricGood]}>
                  {data.domainRating}/100
                </Text>
              </View>
            )}
            {data.organicTraffic !== undefined && (
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Organic Traffic (est.)</Text>
                <Text style={styles.metricValue}>{data.organicTraffic.toLocaleString()}/mo</Text>
              </View>
            )}
            {data.reviewCount !== undefined && (
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Google Reviews</Text>
                <Text style={[styles.metricValue, data.reviewCount < 20 ? styles.metricBad : styles.metricGood]}>
                  {data.reviewCount} ({data.reviewAvg?.toFixed(1) ?? "—"} avg)
                </Text>
              </View>
            )}
            {data.performanceScore !== undefined && (
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Mobile Performance</Text>
                <Text style={[styles.metricValue, data.performanceScore < 50 ? styles.metricBad : styles.metricGood]}>
                  {data.performanceScore}/100
                </Text>
              </View>
            )}
            {data.seoScore !== undefined && (
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>SEO Score</Text>
                <Text style={[styles.metricValue, data.seoScore < 70 ? styles.metricBad : styles.metricGood]}>
                  {data.seoScore}/100
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Products Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services & Pricing</Text>

          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colProduct]}>Service</Text>
            <Text style={[styles.tableHeaderText, styles.colType]}>Billing</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.colPrice]}>Price</Text>
            <Text style={[styles.tableHeaderText, styles.colDiscount]}>Disc.</Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
          </View>

          {data.products.map((product, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colProduct}>{product.name}</Text>
              <Text style={[styles.colType, { fontSize: 9 }]}>
                {formatPricingModel(product.pricingModel)}
              </Text>
              <Text style={styles.colQty}>{product.quantity}</Text>
              <Text style={styles.colPrice}>{formatCurrency(product.unitPrice)}</Text>
              <Text style={styles.colDiscount}>
                {product.discountPercent > 0 ? `${product.discountPercent}%` : "—"}
              </Text>
              <Text style={[styles.colTotal, { fontFamily: "Helvetica-Bold" }]}>
                {formatCurrency(product.finalPrice)}
              </Text>
            </View>
          ))}

          {/* Totals */}
          {data.oneTimeTotal > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalLabel}>One-Time Setup</Text>
              <Text style={styles.totalValue}>{formatCurrency(data.oneTimeTotal)}</Text>
            </View>
          )}
          {data.monthlyTotal > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalLabel}>Monthly Recurring</Text>
              <Text style={styles.totalValue}>{formatCurrency(data.monthlyTotal)}</Text>
            </View>
          )}
          {data.annualTotal > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalLabel}>Annual</Text>
              <Text style={styles.totalValue}>{formatCurrency(data.annualTotal)}</Text>
            </View>
          )}

          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>TOTAL</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(data.grandTotal)}</Text>
          </View>
        </View>

        {/* Notes */}
        {data.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notes}>{data.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          {tenant.fromName} · {tenant.companyTagline ?? ""}{"\n"}
          This work order is valid for 30 days from the date of issue.
        </Text>
      </Page>
    </Document>
  );
}
