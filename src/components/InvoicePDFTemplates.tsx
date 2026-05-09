import React, { Fragment } from "react";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

const ensureAbsoluteUrl = (url: string | undefined | null) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:") || url.startsWith("data:")) return url;
  return `${window.location.origin}${url}`;
};

function formatDate(d: string | undefined) {
  if (!d) return new Date().toLocaleDateString("en-GB").split("/").join("-");
  const parts = d.split("-");
  if (parts.length === 3 && parts[0].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return d;
}

/* =================== A4 STYLES =================== */
const A4 = StyleSheet.create({
  page: { flexDirection: "column" as const, padding: "15pt 25pt", fontSize: 10, fontFamily: "Helvetica", color: "#000" },
  header: { flexDirection: "row" as const, borderBottomWidth: 2, borderBottomColor: "#000", paddingBottom: 6 },
  headerLeft: { flexDirection: "row" as const, alignItems: "center" as const, flex: 1.5 },
  logo: { width: 48, height: 48, marginRight: 6, objectsFit: "contain" as const },
  logoFallback: { width: 48, height: 48, marginRight: 6, backgroundColor: "#000", justifyContent: "center" as const, alignItems: "center" as const },
  brandName: { fontSize: 18, fontWeight: 700 },
  slogan: { fontSize: 8.5, marginTop: 1 },
  subBrand: { fontSize: 8.5, marginTop: 1 },
  headerRight: { flexDirection: "row" as const, paddingTop: 4, flex: 3.5 },
  hCol: { flexDirection: "column" as const, flex: 1.2, fontSize: 8.5, fontWeight: 700, textAlign: "center" as const, alignItems: "center" as const },
  hCenterCol: { flexDirection: "column" as const, flex: 1, fontSize: 8.5, fontWeight: 700, borderLeftWidth: 0.5, borderLeftColor: "#999", paddingLeft: 4, marginLeft: 4, textAlign: "center" as const },
  hRightCol: { flexDirection: "column" as const, flex: 1.3, fontSize: 8.5, fontWeight: 700, borderLeftWidth: 0.5, borderLeftColor: "#999", paddingLeft: 4, marginLeft: 4, textAlign: "right" as const },
  titleRow: { flexDirection: "row" as const, marginTop: 8, marginBottom: 6, alignItems: "center" as const },
  titleText: { flex: 6, textAlign: "center" as const, fontSize: 14, fontWeight: 700 },
  gstinText: { flex: 3, textAlign: "right" as const, fontSize: 10, fontWeight: 700 },
  emptyCol: { flex: 3 },
  billingRow: { flexDirection: "row" as const, marginBottom: 8 },
  billingLeft: { flex: 7 },
  billingRight: { flex: 5 },
  toLabel: { fontSize: 8, color: "#999", fontWeight: 700 },
  customerName: { fontSize: 12, fontWeight: 700 },
  cityLine: { fontSize: 9, fontWeight: 700, color: "#666" },
  gstLabel: { fontSize: 9, fontWeight: 700 },
   metaRow: { flexDirection: "row" as const, fontSize: 9, fontWeight: 700 },
  tableHeader: { flexDirection: "row" as const, fontWeight: 700, fontSize: 8, borderTopWidth: 2, borderBottomWidth: 2, borderColor: "#000", paddingTop: 2, paddingBottom: 2, alignItems: "center" as const },
  tableRow: { flexDirection: "row" as const, fontSize: 7.5, paddingTop: 2, paddingBottom: 2, alignItems: "center" as const },
  footer: { flexDirection: "row" as const, borderTopWidth: 1, borderColor: "#ccc", marginTop: "auto" as const, paddingTop: 6 },
  footerLeft: { flex: 4 },
  footerCenter: { flex: 3, alignItems: "center" as const },
  footerRight: { flex: 5, alignItems: "flex-end" as const },
  bankTitle: { fontSize: 11, fontWeight: 700, marginBottom: 4 },
  bankRow: { fontSize: 10, flexDirection: "row" as const, marginBottom: 2 },
  bankLabel: { fontSize: 9, color: "#666", fontWeight: 700 },
  taxRow: { flexDirection: "row" as const, width: "100%", fontSize: 9 },
  grandRow: { flexDirection: "row" as const, width: "100%", fontSize: 12, fontWeight: 700, backgroundColor: "#f0f0f0", borderTopWidth: 1, borderColor: "#999", paddingTop: 3, paddingBottom: 3 },
  smallText: { fontSize: 8, color: "#999", textAlign: "right" as const, marginTop: 4 },
  emptyRow: { height: 12 },
  qrImage: { width: 110, height: 110 },
  thankYou: { fontSize: 10, marginTop: 8, fontWeight: 700 },
  totalsBorder: { width: "100%", borderWidth: 0.5, borderColor: "#ccc" },
  cell5: { width: "5%", textAlign: "center" as const },
  cell25: { width: "25%", textAlign: "left" as const },
  cell8: { width: "8%", textAlign: "center" as const },
  cell12: { width: "12%", textAlign: "center" as const },
  cell12r: { width: "12%", textAlign: "right" as const },
  cell7: { width: "7%", textAlign: "center" as const },
  cell10: { width: "10%", textAlign: "center" as const },
  cell65: { flex: 6.5 },
  cell35: { flex: 3.5, textAlign: "right" as const },
});

/* =================== A5 STYLES =================== */
const A5 = StyleSheet.create({
  page: { flexDirection: "column" as const, padding: "8pt 12pt", fontSize: 7, fontFamily: "Helvetica", color: "#000" },
  header: { flexDirection: "row" as const, borderBottomWidth: 1.5, borderBottomColor: "#000", paddingBottom: 3 },
  headerLeft: { flexDirection: "row" as const, alignItems: "center" as const, flex: 1.5 },
  logo: { width: 36, height: 36, marginRight: 4, objectsFit: "contain" as const },
  logoFallback: { width: 36, height: 36, marginRight: 4, backgroundColor: "#000", justifyContent: "center" as const, alignItems: "center" as const },
  brandName: { fontSize: 13, fontWeight: 700 },
  slogan: { fontSize: 6, marginTop: 1 },
  subBrand: { fontSize: 6, marginTop: 1 },
  headerRight: { flexDirection: "row" as const, paddingTop: 2, flex: 3.5 },
  hCol: { flexDirection: "column" as const, flex: 1.2, fontSize: 6, fontWeight: 700, textAlign: "center" as const, alignItems: "center" as const },
  hCenterCol: { flexDirection: "column" as const, flex: 1, fontSize: 6, fontWeight: 700, borderLeftWidth: 0.5, borderLeftColor: "#999", paddingLeft: 3, marginLeft: 3, textAlign: "center" as const },
  hRightCol: { flexDirection: "column" as const, flex: 1.3, fontSize: 6, fontWeight: 700, borderLeftWidth: 0.5, borderLeftColor: "#999", paddingLeft: 3, marginLeft: 3, textAlign: "right" as const },
  titleRow: { flexDirection: "row" as const, marginTop: 4, marginBottom: 3, alignItems: "center" as const },
  titleText: { flex: 6, textAlign: "center" as const, fontSize: 10, fontWeight: 700 },
  gstinText: { flex: 3, textAlign: "right" as const, fontSize: 7.5, fontWeight: 700 },
  emptyCol: { flex: 3 },
  billingRow: { flexDirection: "row" as const, marginBottom: 4 },
  billingLeft: { flex: 7 },
  billingRight: { flex: 5 },
  toLabel: { fontSize: 6, color: "#999", fontWeight: 700 },
  customerName: { fontSize: 10, fontWeight: 700 },
  cityLine: { fontSize: 7, fontWeight: 700, color: "#666" },
  gstLabel: { fontSize: 7, fontWeight: 700 },
   metaRow: { flexDirection: "row" as const, fontSize: 7, fontWeight: 700 },
  tableHeader: { flexDirection: "row" as const, fontWeight: 700, fontSize: 6.5, borderTopWidth: 1.5, borderBottomWidth: 1.5, borderColor: "#000", paddingTop: 1, paddingBottom: 1, alignItems: "center" as const },
  tableRow: { flexDirection: "row" as const, fontSize: 6.5, paddingTop: 1, paddingBottom: 1, alignItems: "center" as const },
  footer: { flexDirection: "row" as const, borderTopWidth: 0.75, borderColor: "#ccc", marginTop: "auto" as const, paddingTop: 4 },
  footerLeft: { flex: 4 },
  footerCenter: { flex: 3, alignItems: "center" as const },
  footerRight: { flex: 5, alignItems: "flex-end" as const },
  bankTitle: { fontSize: 8, fontWeight: 700, marginBottom: 2 },
  bankRow: { fontSize: 7.5, flexDirection: "row" as const, marginBottom: 1 },
  bankLabel: { fontSize: 6.5, color: "#666", fontWeight: 700 },
  taxRow: { flexDirection: "row" as const, width: "100%", fontSize: 6.5 },
  grandRow: { flexDirection: "row" as const, width: "100%", fontSize: 9.5, fontWeight: 700, backgroundColor: "#f0f0f0", borderTopWidth: 0.75, borderColor: "#999", paddingTop: 2, paddingBottom: 2 },
  smallText: { fontSize: 6, color: "#999", textAlign: "right" as const, marginTop: 2 },
  emptyRow: { height: 8 },
  qrImage: { width: 75, height: 75 },
  thankYou: { fontSize: 7, marginTop: 4, fontWeight: 700 },
  totalsBorder: { width: "100%", borderWidth: 0.5, borderColor: "#ccc" },
  cell5: { width: "5%", textAlign: "center" as const },
  cell25: { width: "25%", textAlign: "left" as const },
  cell8: { width: "8%", textAlign: "center" as const },
  cell12: { width: "12%", textAlign: "center" as const },
  cell12r: { width: "12%", textAlign: "right" as const },
  cell7: { width: "7%", textAlign: "center" as const },
  cell10: { width: "10%", textAlign: "center" as const },
  cell65: { flex: 6.5 },
  cell35: { flex: 3.5, textAlign: "right" as const },
  totalRow: { flexDirection: "row" as const, width: "100%", fontSize: 6.5 },
});

/* =================== THERMAL STYLES =================== */
const TR = StyleSheet.create({
  page: { flexDirection: "column" as const, padding: 0, fontSize: 11, fontFamily: "Helvetica", color: "#000" },
  header: { alignItems: "center" as const, paddingBottom: 8 },
  logo: { width: 48, height: 48, marginBottom: 4, objectsFit: "contain" as const },
  brandName: { fontSize: 22, fontWeight: 700, textAlign: "center" as const },
  slogan: { fontSize: 11, textAlign: "center" as const, marginBottom: 2 },
  address: { fontSize: 9.5, textAlign: "center" as const, marginBottom: 2 },
  phone: { fontSize: 11, textAlign: "center" as const, marginBottom: 2 },
  email: { fontSize: 11, fontWeight: 700, textAlign: "center" as const, marginBottom: 2 },
  gstin: { fontSize: 11, fontWeight: 700, textAlign: "center" as const, marginBottom: 2 },
  title: { fontSize: 14, fontWeight: 700, textAlign: "center" as const, marginTop: 6 },
  dashedLine: { borderTopWidth: 0.5, borderStyle: "dashed" as const, borderColor: "#999", width: "100%", marginTop: 8, marginBottom: 8 },
  metaRow: { flexDirection: "row" as const, justifyContent: "space-between" as const, fontSize: 11, marginBottom: 4 },
  customerId: { fontSize: 11, marginTop: 4 },
  customerGst: { fontSize: 11, marginTop: 2 },
  tableHeader: { flexDirection: "row" as const, fontWeight: 700, fontSize: 11, borderBottomWidth: 0.5, borderColor: "#000", paddingBottom: 4, marginTop: 4 },
  tableRow: { flexDirection: "row" as const, fontSize: 10, paddingBottom: 4, paddingTop: 4 },
  summaryLeft: { fontWeight: 700, fontSize: 11, marginBottom: 2 },
  summaryRight: { marginLeft: "auto", textAlign: "right" as const, fontSize: 12, fontWeight: 700 },
  grandTotal: { fontSize: 12, fontWeight: 700, textAlign: "right" as const, marginTop: 6 },
  taxText: { textAlign: "right" as const, marginBottom: 4 },
  footerText: { fontSize: 11, fontWeight: 700, marginTop: 5 },
  qrImage: { width: 120, height: 120 },
  scanLabel: { fontSize: 11, fontWeight: 700, marginTop: 6, textAlign: "center" as const },
  qrWrap: { alignItems: "center" as const, marginTop: 12 },
});

/* =================== SHARED HELPERS =================== */
const LogoView = ({ logoUrl, style }: { logoUrl: string | undefined | null, style: any }) => {
  const absoluteUrl = ensureAbsoluteUrl(logoUrl);
  return absoluteUrl ? (
    <Image src={absoluteUrl} style={style} />
  ) : (
    <View style={{ ...style, backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
      <Text style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>PW</Text>
    </View>
  );
};

const HeaderContactBlock = ({ email, phone, s }: { email: string, phone: string, s: any }) => (
  <View style={s.headerRight}>
    <View style={s.hCol}>
      <Text>{email}</Text>
    </View>
    <View style={s.hCenterCol}>
      <Text>{phone.startsWith("+91") ? phone : `+91 ${phone}`}</Text>
      <Text>0422 2244066</Text>
    </View>
    <View style={s.hRightCol}>
      <Text>No.68, Sarojini Road,</Text>
      <Text>Sidhapudur, Coimbatore-44</Text>
    </View>
  </View>
);

const TaxRowsComponent = ({ taxGroups, isIgst, isEstimate, rowStyle, labelStyle, valueStyle }: {
  taxGroups: any, isIgst: boolean, isEstimate: boolean,
  rowStyle: any, labelStyle: any, valueStyle: any
}) => {
  if (isEstimate) return null;
  return Object.values(taxGroups).map((group: any) =>
    isIgst ? (
      <View key={`igst-${group.rate}`} style={rowStyle}>
        <View style={{ flex: 6.5 }}><Text style={labelStyle}>IGST {group.rate}%</Text></View>
        <View style={{ flex: 3.5, textAlign: "right" }}><Text style={valueStyle}>{group.tax.toFixed(2)}</Text></View>
      </View>
    ) : (
      <Fragment key={`gst-${group.rate}`}>
        <View style={rowStyle}>
          <View style={{ flex: 6.5 }}><Text style={labelStyle}>CGST {group.rate / 2}%</Text></View>
          <View style={{ flex: 3.5, textAlign: "right" }}><Text style={valueStyle}>{(group.tax / 2).toFixed(2)}</Text></View>
        </View>
        <View style={rowStyle}>
          <View style={{ flex: 6.5 }}><Text style={labelStyle}>SGST {group.rate / 2}%</Text></View>
          <View style={{ flex: 3.5, textAlign: "right" }}><Text style={valueStyle}>{(group.tax / 2).toFixed(2)}</Text></View>
        </View>
      </Fragment>
    )
  );
};

/* =================== TABLE HEADER ROWS =================== */
const TableHeaderA4 = ({ isIgst, isEstimate }: { isIgst: boolean, isEstimate: boolean }) => (
  <View style={A4.tableHeader}>
    <View style={A4.cell5}><Text>S.No</Text></View>
    <View style={A4.cell25}><Text>Description</Text></View>
    <View style={A4.cell8}><Text>HSN</Text></View>
    <View style={A4.cell8}><Text>QTY</Text></View>
    <View style={A4.cell8}><Text>Rate (Rs.)</Text></View>
    {isEstimate ? null : isIgst ? (
      <>
        <View style={A4.cell8}><Text>IGST %</Text></View>
        <View style={A4.cell12}><Text>IGST Amt(Rs.)</Text></View>
      </>
    ) : (
      <>
        <View style={A4.cell7}><Text>CGST %</Text></View>
        <View style={A4.cell10}><Text>CGST(Rs.)</Text></View>
        <View style={A4.cell7}><Text>SGST %</Text></View>
        <View style={A4.cell10}><Text>SGST(Rs.)</Text></View>
      </>
    )}
    <View style={A4.cell12r}><Text>Amount</Text></View>
  </View>
);

const TableHeaderA5 = ({ isIgst, isEstimate }: { isIgst: boolean, isEstimate: boolean }) => (
  <View style={A5.tableHeader}>
    <View style={A5.cell5}><Text>S.No</Text></View>
    <View style={A5.cell25}><Text>Description</Text></View>
    <View style={A5.cell8}><Text>HSN</Text></View>
    <View style={A5.cell8}><Text>QTY</Text></View>
    <View style={A5.cell8}><Text>Rate (Rs.)</Text></View>
    {isEstimate ? null : isIgst ? (
      <>
        <View style={A5.cell8}><Text>IGST %</Text></View>
        <View style={A5.cell12}><Text>IGST Amt(Rs.)</Text></View>
      </>
    ) : (
      <>
        <View style={A5.cell7}><Text>CGST %</Text></View>
        <View style={A5.cell10}><Text>CGST(Rs.)</Text></View>
        <View style={A5.cell7}><Text>SGST %</Text></View>
        <View style={A5.cell10}><Text>SGST(Rs.)</Text></View>
      </>
    )}
    <View style={A5.cell12r}><Text>Amount</Text></View>
  </View>
);

/* =================== ITEM ROW HELPERS =================== */
const ItemRowA4 = ({ item, index, isIgst, isEstimate }: { item: any, index: number, isIgst: boolean, isEstimate: boolean }) => {
  const itemRate = parseFloat(item.gstRate || 0);
  const itemAmount = parseFloat(item.amount || 0);
  const itemTax = itemAmount * (itemRate / 100);

  if (item.name === null || item.name === undefined) {
    return <View style={A4.emptyRow} key={`e-${index}`} />;
  }

  return (
    <View style={A4.tableRow} key={index}>
      <View style={A4.cell5}><Text>{index + 1}</Text></View>
      <View style={A4.cell25}><Text style={{ fontWeight: 700 }}>{(item.category || item.name).toUpperCase()}</Text></View>
      <View style={A4.cell8}><Text>{item.hsnCode || "4909"}</Text></View>
      <View style={A4.cell8}><Text>{parseFloat(item.qty || 0).toFixed(2)}</Text></View>
      <View style={A4.cell8}><Text>{(parseFloat(item.rate || 0)).toFixed(2)}</Text></View>
      {isEstimate ? null : isIgst ? (
        <>
          <View style={A4.cell8}><Text>{itemRate.toFixed(2)}</Text></View>
          <View style={A4.cell12}><Text>{itemTax.toFixed(2)}</Text></View>
        </>
      ) : (
        <>
          <View style={A4.cell7}><Text>{(itemRate / 2).toFixed(2)}</Text></View>
          <View style={A4.cell10}><Text>{(itemTax / 2).toFixed(2)}</Text></View>
          <View style={A4.cell7}><Text>{(itemRate / 2).toFixed(2)}</Text></View>
          <View style={A4.cell10}><Text>{(itemTax / 2).toFixed(2)}</Text></View>
        </>
      )}
      <View style={A4.cell12r}><Text style={{ fontWeight: 700 }}>{itemAmount.toFixed(2)}</Text></View>
    </View>
  );
};

const ItemRowA5 = ({ item, index, isIgst, isEstimate }: { item: any, index: number, isIgst: boolean, isEstimate: boolean }) => {
  const itemRate = parseFloat(item.gstRate || 0);
  const itemAmount = parseFloat(item.amount || 0);
  const itemTax = itemAmount * (itemRate / 100);

  if (item.name === null || item.name === undefined) {
    return <View style={A5.emptyRow} key={`e-${index}`} />;
  }

  return (
    <View style={A5.tableRow} key={index}>
      <View style={A5.cell5}><Text>{index + 1}</Text></View>
      <View style={A5.cell25}><Text style={{ fontWeight: 700 }}>{(item.category || item.name).toUpperCase()}</Text></View>
      <View style={A5.cell8}><Text>{item.hsnCode || "4909"}</Text></View>
      <View style={A5.cell8}><Text>{parseFloat(item.qty || 0).toFixed(2)}</Text></View>
      <View style={A5.cell8}><Text>{(parseFloat(item.rate || 0)).toFixed(2)}</Text></View>
      {isEstimate ? null : isIgst ? (
        <>
          <View style={A5.cell8}><Text>{itemRate.toFixed(2)}</Text></View>
          <View style={A5.cell12}><Text>{itemTax.toFixed(2)}</Text></View>
        </>
      ) : (
        <>
          <View style={A5.cell7}><Text>{(itemRate / 2).toFixed(2)}</Text></View>
          <View style={A5.cell10}><Text>{(itemTax / 2).toFixed(2)}</Text></View>
          <View style={A5.cell7}><Text>{(itemRate / 2).toFixed(2)}</Text></View>
          <View style={A5.cell10}><Text>{(itemTax / 2).toFixed(2)}</Text></View>
        </>
      )}
      <View style={A5.cell12r}><Text style={{ fontWeight: 700 }}>{itemAmount.toFixed(2)}</Text></View>
    </View>
  );
};

/* =================== FOOTER COMPONENT =================== */
const FooterComponent = ({
  activeInvoice, profile, taxableAmount, totalTax, taxGroups, total, roundOff,
  isIgst, isEstimate, docType, activeQr, qrBlobUrl, s,
  taxRowStyle, taxLabelStyle, taxValueStyle, footerFontPx
}: any) => {
  const qrSrc = activeQr?.isDynamic ? qrBlobUrl : activeQr?.imageUrl;

  return (
    <View style={s.footer}>
      <View style={s.footerLeft}>
        <Text style={s.bankTitle}>BANK DETAILS</Text>
        <View style={s.bankRow}>
          <Text style={s.bankLabel}>ACCOUNT NAME </Text>
          <Text style={{ fontWeight: 700 }}>: {profile.accountName || profile.name}</Text>
        </View>
        <View style={s.bankRow}>
          <Text style={s.bankLabel}>BANK </Text>
          <Text style={{ fontWeight: 700 }}>: {profile.bankName || "ICICI Bank"}</Text>
        </View>
        <View style={s.bankRow}>
          <Text style={s.bankLabel}>BRANCH </Text>
          <Text style={{ fontWeight: 700 }}>: {profile.bankBranch || "Gandhipuram"}</Text>
        </View>
        <View style={s.bankRow}>
          <Text style={s.bankLabel}>A/C NO </Text>
          <Text style={{ fontWeight: 700 }}>: {profile.accountNumber || "730705000264"}</Text>
        </View>
        <View style={s.bankRow}>
          <Text style={s.bankLabel}>IFSC CODE </Text>
          <Text style={{ fontWeight: 700 }}>: {profile.ifscCode || "ICIC0007307"}</Text>
        </View>
        <Text style={s.thankYou}>THANK YOU FOR YOUR BUSINESS</Text>
      </View>

      <View style={s.footerCenter}>
        {activeQr && total > 0 && qrSrc ? (
          <>
            <Image src={qrSrc} style={s.qrImage} />
            <Text style={{ fontSize: footerFontPx + 1.5, fontWeight: 700, color: "#333", marginTop: 4 }}>SCAN AND PAY</Text>
          </>
        ) : null}
      </View>

      <View style={s.footerRight}>
        <View style={s.totalsBorder}>
          <View style={taxRowStyle}>
            <View style={{ flex: 6.5 }}><Text style={{ fontWeight: 700, color: "#666" }}>Sub Total</Text></View>
            <View style={{ flex: 3.5, textAlign: "right" }}><Text style={{ fontWeight: 700 }}>{taxableAmount.toFixed(2)}</Text></View>
          </View>
          <TaxRowsComponent
            taxGroups={taxGroups} isIgst={isIgst} isEstimate={isEstimate}
            rowStyle={taxRowStyle} labelStyle={taxLabelStyle} valueStyle={taxValueStyle}
          />
          <View style={taxRowStyle}>
            <View style={{ flex: 6.5 }}><Text style={{ fontWeight: 700, color: "#666" }}>ROUND OFF</Text></View>
            <View style={{ flex: 3.5, textAlign: "right" }}><Text style={{ fontWeight: 700 }}>{roundOff.toFixed(2)}</Text></View>
          </View>
          <View style={s.grandRow}>
            <View style={{ flex: 6.5 }}><Text>GRAND TOTAL</Text></View>
            <View style={{ flex: 3.5, textAlign: "right" }}><Text>{total.toFixed(2)}</Text></View>
          </View>
        </View>
        <Text style={s.smallText}>This is computer generated {docType === "quotations" ? "quotation" : docType === "estimates" ? "estimate" : "invoice"} signature not required</Text>
        {activeInvoice.fileName ? (
          <Text style={{ fontSize: 7, fontWeight: 700, textAlign: "right", marginTop: 1 }}>FILE: {activeInvoice.fileName.toUpperCase()}</Text>
        ) : null}
      </View>
    </View>
  );
};

/* =================== A4 INVOICE =================== */
export const A4InvoicePDF = ({
  activeInvoice, profile, items, taxableAmount, totalTax, taxGroups, total, roundOff,
  isIgst, isEstimate, docType, docTitle, activeQr, qrBlobUrl, settingsData, settings
}: any) => {
  const MAX_ITEMS = 25;
  const invoiceNo = activeInvoice?.invoiceNo || activeInvoice?.quotationNo || activeInvoice?.estimateNo || "DRAFT";
  const date = formatDate(activeInvoice?.date);
  const customerName = activeInvoice?.customerName || "Walk-in Customer";
  const customerGst = activeInvoice?.customerGst || "N/A";

  const paddedItems = [...items];
  while (paddedItems.length < MAX_ITEMS) {
    paddedItems.push({ name: null });
  }

  const phone = profile.phone || "";
  const email = profile.email || "";

  return (
    <Document>
      <Page size="A4" style={A4.page}>
        {/* HEADER */}
        <View style={A4.header}>
          <View style={A4.headerLeft}>
            <LogoView logoUrl={profile.logoUrl} style={A4.logo} />
            <View>
              <Text style={A4.brandName}>{(profile.name || "PRINT WORKSHOP").toUpperCase()}</Text>
              <Text style={A4.slogan}>{(profile.slogan || "").toUpperCase()}</Text>
              <Text style={A4.subBrand}>DIGITAL PRINTING</Text>
            </View>
          </View>
          <HeaderContactBlock email={email} phone={phone} s={A4} />
        </View>

        {/* TITLE ROW */}
        <View style={A4.titleRow}>
          <View style={A4.emptyCol} />
          <View style={A4.titleText}><Text>{(docTitle || "TAX INVOICE").toUpperCase()}</Text></View>
          <View style={A4.gstinText}><Text>GSTIN : {profile.gst}</Text></View>
        </View>

        {/* BILLING META */}
        <View style={A4.billingRow}>
          <View style={A4.billingLeft}>
            <Text style={A4.toLabel}>TO :</Text>
            <Text style={A4.customerName}>{customerName.toUpperCase()}</Text>
            <Text style={A4.cityLine}>COIMBATORE</Text>
            <Text style={A4.gstLabel}>GSTIN : {customerGst}</Text>
            <Text style={A4.gstLabel}>STATE & CODE:</Text>
          </View>
          <View style={A4.billingRight}>
            <View style={A4.metaRow}>
              <Text style={{ textAlign: "right" }}>{docType === "quotations" ? "Quotation No" : docType === "estimates" ? "Estimate No" : "Invoice No"}</Text>
              <Text> : {invoiceNo}</Text>
            </View>
            <View style={A4.metaRow}>
              <Text style={{ textAlign: "right" }}>{docType === "quotations" ? "Quotation Date" : docType === "estimates" ? "Estimate Date" : "Invoice Date"}</Text>
              <Text> : {date}</Text>
            </View>
            <View style={A4.metaRow}>
              <Text style={{ textAlign: "right" }}>PO No</Text>
              <Text> : -</Text>
            </View>
          </View>
        </View>

        {/* ITEMS TABLE */}
        <View style={{ flex: 1 }}>
          <TableHeaderA4 isIgst={isIgst} isEstimate={isEstimate} />
          {paddedItems.map((item: any, i: number) => (
            <ItemRowA4 item={item} index={i} isIgst={isIgst} isEstimate={isEstimate} key={i} />
          ))}
        </View>

        {/* FOOTER */}
        <FooterComponent
          activeInvoice={activeInvoice} profile={profile}
          taxableAmount={taxableAmount} totalTax={totalTax} taxGroups={taxGroups}
          total={total} roundOff={roundOff}
          isIgst={isIgst} isEstimate={isEstimate} docType={docType}
          activeQr={activeQr} qrBlobUrl={qrBlobUrl}
          s={A4}
          taxRowStyle={{ flexDirection: "row", width: "100%", fontSize: 7 }}
          taxLabelStyle={{ fontWeight: 700, color: "#666", fontSize: 7 }}
          taxValueStyle={{ fontWeight: 700, fontSize: 7 }}
          footerFontPx={7}
        />
      </Page>
    </Document>
  );
};

/* =================== A5 INVOICE =================== */
export const A5InvoicePDF = ({
  activeInvoice, profile, items, taxableAmount, totalTax, taxGroups, total, roundOff,
  isIgst, isEstimate, docType, docTitle, activeQr, qrBlobUrl, settingsData, settings
}: any) => {
  const MAX_ITEMS = 5;
  const invoiceNo = activeInvoice?.invoiceNo || activeInvoice?.quotationNo || activeInvoice?.estimateNo || "DRAFT";
  const date = formatDate(activeInvoice?.date);
  const customerName = activeInvoice?.customerName || "Walk-in Customer";
  const customerGst = activeInvoice?.customerGst || "N/A";

  const paddedItems = [...items];
  while (paddedItems.length < MAX_ITEMS) {
    paddedItems.push({ name: null });
  }

  const phone = profile.phone || "";
  const email = profile.email || "";

  return (
    <Document>
      <Page size={[595.28, 419.53]} style={A5.page}>
        {/* HEADER */}
        <View style={A5.header}>
          <View style={A5.headerLeft}>
            <LogoView logoUrl={profile.logoUrl} style={A5.logo} />
            <View>
              <Text style={A5.brandName}>{(profile.name || "PRINT WORKSHOP").toUpperCase()}</Text>
              <Text style={A5.slogan}>{(profile.slogan || "").toUpperCase()}</Text>
              <Text style={A5.subBrand}>DIGITAL PRINTING</Text>
            </View>
          </View>
          <HeaderContactBlock email={email} phone={phone} s={A5} />
        </View>

        {/* TITLE ROW */}
        <View style={A5.titleRow}>
          <View style={A5.emptyCol} />
          <View style={A5.titleText}><Text>{(docTitle || "TAX INVOICE").toUpperCase()}</Text></View>
          <View style={A5.gstinText}><Text>GSTIN : {profile.gst}</Text></View>
        </View>

        {/* BILLING META */}
        <View style={A5.billingRow}>
          <View style={A5.billingLeft}>
            <Text style={A5.toLabel}>TO :</Text>
            <Text style={A5.customerName}>{customerName.toUpperCase()}</Text>
            <Text style={A5.cityLine}>COIMBATORE</Text>
            <Text style={A5.gstLabel}>GSTIN : {customerGst}</Text>
            <Text style={A5.gstLabel}>STATE & CODE:</Text>
          </View>
          <View style={A5.billingRight}>
            <View style={A5.metaRow}>
              <Text style={{ textAlign: "right" }}>{docType === "quotations" ? "Quotation No" : docType === "estimates" ? "Estimate No" : "Invoice No"}</Text>
              <Text> : {invoiceNo}</Text>
            </View>
            <View style={A5.metaRow}>
              <Text style={{ textAlign: "right" }}>{docType === "quotations" ? "Quotation Date" : docType === "estimates" ? "Estimate Date" : "Invoice Date"}</Text>
              <Text> : {date}</Text>
            </View>
            <View style={A5.metaRow}>
              <Text style={{ textAlign: "right" }}>PO No</Text>
              <Text> : -</Text>
            </View>
          </View>
        </View>

        {/* ITEMS TABLE */}
        <View style={{ flex: 1 }}>
          <TableHeaderA5 isIgst={isIgst} isEstimate={isEstimate} />
          {paddedItems.map((item: any, i: number) => (
            <ItemRowA5 item={item} index={i} isIgst={isIgst} isEstimate={isEstimate} key={i} />
          ))}
        </View>

        {/* FOOTER */}
        <FooterComponent
          activeInvoice={activeInvoice} profile={profile}
          taxableAmount={taxableAmount} totalTax={totalTax} taxGroups={taxGroups}
          total={total} roundOff={roundOff}
          isIgst={isIgst} isEstimate={isEstimate} docType={docType}
          activeQr={activeQr} qrBlobUrl={qrBlobUrl}
          s={A5}
          taxRowStyle={{ flexDirection: "row", width: "100%", fontSize: 5 }}
          taxLabelStyle={{ fontWeight: 700, color: "#666", fontSize: 5 }}
          taxValueStyle={{ fontWeight: 700, fontSize: 5 }}
          footerFontPx={5}
        />
      </Page>
    </Document>
  );
};

/* =================== THERMAL RECEIPT =================== */
export const ThermalReceiptPDF = ({
  activeInvoice, profile, items, taxableAmount, totalTax, taxGroups, total, roundOff,
  isIgst, isEstimate, docType, docTitle, activeQr, qrBlobUrl, settingsData, settings
}: any) => {
  const thermalWidthMm = parseFloat(settingsData?.settings?.thermalWidth || settings?.thermalWidth || "80");
  const thermalWidthPt = thermalWidthMm * 2.83465;
  const invoiceNo = activeInvoice?.invoiceNo || activeInvoice?.quotationNo || activeInvoice?.estimateNo || "DRAFT";
  const date = formatDate(activeInvoice?.date);
  const customerName = activeInvoice?.customerName || "Walk-in Customer";
  const currentTime = new Date().toLocaleTimeString("en-GB", { hour12: false }).replace(/:/g, ".");

  const totalQty = items.reduce((a: number, b: any) => a + parseInt(b.qty || 0), 0);

  const qrSrc = activeQr?.isDynamic ? qrBlobUrl : activeQr?.imageUrl;

  return (
    <Document>
      <Page size={[thermalWidthPt, "auto" as any]} style={TR.page}>
        {/* HEADER */}
        <View style={TR.header}>
          {profile.logoUrl && !isEstimate && ensureAbsoluteUrl(profile.logoUrl) && (
            <Image src={ensureAbsoluteUrl(profile.logoUrl)!} style={TR.logo} />
          )}
          <Text style={TR.brandName}>{profile.name || "Print Workshop"}</Text>
          <Text style={TR.slogan}>( {profile.slogan || "Innovation in Impression"} )</Text>
          <Text style={TR.address}>{profile.address || "No.4 Dhanlakshminagar, Sidhapudur, CBE-44"}</Text>
          <Text style={TR.phone}>Call @ {profile.phone || "0422 2244066"}</Text>
          {profile.email && <Text style={TR.email}>Mail : {profile.email}</Text>}
          {profile.gst && !isEstimate && <Text style={TR.gstin}>GSTIN : {profile.gst}</Text>}
          <Text style={TR.title}>{(docTitle || "TAX INVOICE").toUpperCase()}</Text>
        </View>

        <View style={TR.dashedLine} />

        {/* META */}
        <View style={TR.metaRow}>
          <Text>No.{invoiceNo}</Text>
          <Text>Date: {date}</Text>
        </View>
        <Text style={TR.customerId}>C.ID : {customerName}</Text>
        {activeInvoice?.customerGst && !isEstimate && (
          <Text style={TR.customerGst}>GSTIN : {activeInvoice.customerGst}</Text>
        )}

        <View style={TR.dashedLine} />

        {/* ITEMS */}
        <View style={TR.tableHeader}>
          <View style={{ width: "45%", textAlign: "left" }}><Text>Product Name</Text></View>
          <View style={{ width: "10%", textAlign: "right" }}><Text>Qty</Text></View>
          <View style={{ width: "20%", textAlign: "right" }}><Text>Rate</Text></View>
          <View style={{ width: "25%", textAlign: "right" }}><Text>Amount</Text></View>
        </View>

        {items.map((item: any, i: number) => (
          <View key={i} style={TR.tableRow}>
            <View style={{ width: "45%", textAlign: "left" }}>
              <Text style={{ fontWeight: 400 }}>{(item.category || item.name).toUpperCase()}</Text>
            </View>
            <View style={{ width: "10%", textAlign: "right" }}>
              <Text>{item.qty}</Text>
            </View>
            <View style={{ width: "20%", textAlign: "right" }}>
              <Text>{parseFloat(item.rate || 0).toFixed(0)}</Text>
            </View>
            <View style={{ width: "25%", textAlign: "right" }}>
              <Text>{parseFloat(item.amount || 0).toFixed(2)}</Text>
            </View>
          </View>
        ))}

        <View style={TR.dashedLine} />

        {/* SUMMARY */}
        <View style={{ flexDirection: "row", marginBottom: 2 }}>
          <View>
            <Text style={TR.summaryLeft}>Total Items : {items?.length || 0}</Text>
            <Text style={TR.summaryLeft}>Total Qty : {totalQty}</Text>
          </View>
          <View style={TR.summaryRight}>
            <Text>
              {totalTax > 0 ? "Sub Total: " : "Grand Total: "}
              {totalTax > 0 ? taxableAmount.toFixed(2) : total.toFixed(2)}
            </Text>
          </View>
        </View>

        {totalTax > 0 && (
          <View style={{ textAlign: "right" }}>
            {Object.values(taxGroups).map((group: any) =>
              isIgst ? (
                <Text key={`tigst-${group.rate}`} style={TR.taxText}>IGST {group.rate}% : {group.tax.toFixed(2)}</Text>
              ) : (
                <Fragment key={`tgst-${group.rate}`}>
                  <Text style={TR.taxText}>CGST {group.rate / 2}% : {(group.tax / 2).toFixed(2)}</Text>
                  <Text style={TR.taxText}>SGST {group.rate / 2}% : {(group.tax / 2).toFixed(2)}</Text>
                </Fragment>
              )
            )}
            {roundOff !== 0 && <Text style={TR.taxText}>Round Off: {roundOff.toFixed(2)}</Text>}
            <Text style={TR.grandTotal}>Grand Total: {total.toFixed(2)}</Text>
          </View>
        )}

        <View style={TR.dashedLine} />

        {/* FOOTER */}
        <View style={{ marginTop: 8 }}>
          <Text style={TR.footerText}>File : {activeInvoice?.fileName || "-"}</Text>
          <Text style={TR.footerText}>User: {profile.name?.split(" ")[0] || "Admin"} | Time: {currentTime}</Text>
          <Text style={TR.footerText}>{profile.website || "www.printworkshop.in"}</Text>
          <Text style={TR.footerText}>Thank You For Your Business</Text>
        </View>

        {/* QR */}
        {activeQr && total > 0 && qrSrc && (
          <View style={TR.qrWrap}>
            <Image src={qrSrc} style={TR.qrImage} />
            <Text style={TR.scanLabel}>Scan And Pay</Text>
          </View>
        )}
      </Page>
    </Document>
  );
};
