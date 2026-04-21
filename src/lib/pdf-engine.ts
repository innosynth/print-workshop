import jsPDF from "jspdf";

interface InvoiceData {
  invoiceNo?: string;
  quotationNo?: string;
  estimateNo?: string;
  date?: string;
  customerName?: string;
  customerGst?: string;
  fileName?: string;
  isIgst?: boolean;
  items: any[];
}

interface ProfileData {
  name: string;
  slogan?: string;
  address: string;
  gst: string;
  phone: string;
  email: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  bankBranch: string;
  accountName: string;
  logoUrl?: string;
  website?: string;
}

export const generateInvoicePDF = async (
  invoice: InvoiceData,
  profile: ProfileData,
  paperSize: "A4" | "A5" | "thermal",
  docTitle: string,
  qrImageUrl?: string
) => {
  const isA4 = paperSize === "A4";
  const isA5 = paperSize === "A5";
  const isThermal = paperSize === "thermal";

  const orientation = isThermal ? "p" : "l"; 
  const unit = "mm";
  const isEstimateDoc = docTitle.toUpperCase() === "ESTIMATE";

  // Pre-calculate exact page height for ALL formats to ensure production-grade fit
  let finalHeight = isA4 ? 210 : isA5 ? 148.5 : 500;
  
  if (isThermal) {
    const M = 4;
    const PW = 72.1;
    const CW = PW - M * 2;
    const COL_QTY = 43;

    const temp = new jsPDF({ orientation: "p", unit: "mm", format: [PW, 100] as any });
    let h = M + 4; 

    h += 5; 
    temp.setFont("helvetica", "normal");
    temp.setFontSize(7);
    if (profile.slogan) h += 4;
    const addrLC = temp.splitTextToSize(profile.address, CW - 4).length;
    h += addrLC * 3.5; 
    h += 4; 
    h += 5;   
    h += 5;   
    h += 5;   
    h += 5;   
    h += 4;   
    h += 5;   
    h += 5;   

    temp.setFont("helvetica", "normal");
    temp.setFontSize(7.5);
    const maxNameW = COL_QTY - M - 6;
    invoice.items.forEach(item => {
      const lines = temp.splitTextToSize((item.name || "").toUpperCase(), maxNameW).length;
      h += 4; 
      h += Math.max(0, lines - 1) * 3.5; 
    });

    h += 3;   
    h += 6;   
    h += 6;   
    h += 5;   
    h += 7;   
    h += 4; 
    h += 6;   
    h += 6;   
    h += 7;   
    if (qrImageUrl) h += 35; 
    h += 6;   

    finalHeight = Math.max(h, 50);
  } else {
    // A4 / A5 Height Calculation
    const scale = isA4 ? 1 : 0.72;
    const M = 4; // Updated to 4mm margin (8mm total reduction from width)
    const contentWidth = (isA4 ? 297 : 210) - (2 * M);
    
    // Scale standard widths for calculation
    const W_SNO = 12 * scale;
    const W_AMT = 30 * scale;
    const W_QTY = 15 * scale;
    const W_HSN = 18 * scale;
    const W_RATE = 25 * scale;
    const shopStateCode = profile.gst?.slice(0, 2) || "33";
    const custStateCode = invoice.customerGst?.slice(0, 2) || "33";
    const isIgst = invoice.isIgst ?? (shopStateCode !== custStateCode && !isEstimateDoc);
    let taxAreaW = 0;
    if (!isEstimateDoc) {
      taxAreaW = isIgst ? (20 + 25) * scale : (15 + 20 + 15 + 20) * scale;
    }
    const remainingW = contentWidth - W_SNO - W_AMT - taxAreaW - W_QTY - W_HSN - W_RATE;
    const W_DESC = remainingW;

    const temp = new jsPDF({ orientation: "l", unit: "mm", format: isA4 ? "a4" : "a5" });
    temp.setFontSize(9 * scale);

    let h = M;
    h += 22 * scale; // Header Area
    h += 8 * scale;  // Gap
    h += 10 * scale; // Title Row
    h += 30 * scale; // Billing Row
    h += 14 * scale; // Table Header
    
    invoice.items.forEach(item => {
      const descLines = temp.splitTextToSize(item.name?.toUpperCase() || "", W_DESC - 6 * scale);
      const rowH = Math.max(8 * scale, descLines.length * 4.5 * scale + 2);
      h += rowH;
    });

    h += 15 * scale; // Gap before footer
    
    // Footer height (Bank details, QR, and Totals box)
    const totalsH = (isEstimateDoc ? 3 : 5) * 8 * scale; // Estimate has fewer rows
    const footerContentH = Math.max(45 * scale, totalsH); 
    h += footerContentH;
    h += 12 * scale; // Disclaimer + Final margin
    
    finalHeight = Math.max(h, isA4 ? 210 : 148.5);
  }

  const format = isThermal ? [72.1, finalHeight] : [ (isA4 ? 297 : 210), finalHeight ];

  const doc = new jsPDF({
    orientation: orientation as any,
    unit,
    format: format as any
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 4; // Normalized to 4mm for all formats per user specs
  let currY = margin;

  // Font helpers
  const setBold = () => doc.setFont("helvetica", "bold");
  const setNormal = () => doc.setFont("helvetica", "normal");
  const setSize = (s: number) => doc.setFontSize(s);
  const setBlack = () => doc.setTextColor(0, 0, 0);

  if (isThermal) {
    const PW = doc.internal.pageSize.getWidth();
    const M = margin;
    const CW = PW - M * 2;
    const CX = PW / 2;

    const COL_QTY = 43;
    const COL_RATE = 54;
    const COL_AMT = PW - M;

    const drawDash = (y: number) => {
      doc.setLineDashPattern([1.5, 1], 0);
      doc.setLineWidth(0.2);
      doc.line(M, y, PW - M, y);
      doc.setLineDashPattern([], 0);
    };

    currY += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(profile.name || "Print Workshop", CX, currY, { align: "center" });
    currY += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    if (profile.slogan) {
      doc.text(`( ${profile.slogan} )`, CX, currY, { align: "center" });
      currY += 4;
    }

    const addrLines = doc.splitTextToSize(profile.address, CW - 4);
    doc.text(addrLines, CX, currY, { align: "center" });
    currY += addrLines.length * 3.5;

    doc.text(`Call @ ${profile.phone}`, CX, currY, { align: "center" });
    currY += 4;

    doc.setFont("helvetica", "bold");
    doc.text(`Mail : ${profile.email}`, CX, currY, { align: "center" });
    currY += 5;

    doc.setFontSize(10);
    doc.text(docTitle, CX, currY, { align: "center" });
    currY += 5;

    drawDash(currY);
    currY += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const docNo = invoice.invoiceNo || invoice.quotationNo || invoice.estimateNo || "DRAFT";
    doc.text(`No.${docNo}`, M, currY);
    doc.text(`Date: ${invoice.date || new Date().toLocaleDateString()}`, PW - M, currY, { align: "right" });
    currY += 5;
    doc.text(`C.ID : ${invoice.customerName || "Walk-in Customer"}`, M, currY);
    currY += 4;

    drawDash(currY);
    currY += 5;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Product Name", M, currY);
    doc.text("Qty", COL_QTY, currY, { align: "right" });
    doc.text("Rate", COL_RATE, currY, { align: "right" });
    doc.text("Amount", COL_AMT, currY, { align: "right" });
    currY += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const isEstimate = isEstimateDoc;
    let totalTaxable = 0;
    let totalTax = 0;
    let totalQty = 0;

    invoice.items.forEach((item) => {
      const amt = parseFloat(item.amount || 0);
      const qty = parseFloat(item.qty || 0);
      const gRate = parseFloat(item.gstRate || 0);
      const itax = isEstimate ? 0 : (amt * (gRate / 100));
      totalTaxable += amt;
      totalTax += itax;
      totalQty += qty;

      const maxNameW = COL_QTY - M - 6;
      const nameLines = doc.splitTextToSize((item.name || "").toUpperCase(), maxNameW);

      doc.text(nameLines[0] || "", M, currY);
      doc.text(qty.toString(), COL_QTY, currY, { align: "right" });
      doc.text(parseFloat(item.rate || 0).toFixed(0), COL_RATE, currY, { align: "right" });
      const itemRowTotal = isEstimate ? amt : (amt + itax);
      doc.text(itemRowTotal.toFixed(2), COL_AMT, currY, { align: "right" });
      currY += 4.5;

      for (let k = 1; k < nameLines.length; k++) {
        doc.text(nameLines[k], M, currY);
        currY += 4;
      }
    });

    currY += 3;
    drawDash(currY);
    currY += 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(`Total Items : ${invoice.items.length}`, M, currY);
    currY += 6;

    doc.text(`Total Qty : ${totalQty}`, M, currY);
    doc.setFontSize(10);
    const grandTotal = isEstimate ? totalTaxable : (totalTaxable + totalTax);
    doc.text(`Total: ${grandTotal.toFixed(2)}`, PW - M, currY, { align: "right" });
    currY += 6;

    drawDash(currY);
    currY += 7;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(`File : ${invoice.fileName || ""}`, M, currY);
    currY += 4;
    const timeStr = new Date()
      .toLocaleTimeString("en-GB", { hour12: false })
      .replace(/:/g, ".");
    doc.text(`User :admin | Time : ${timeStr}`, M, currY);
    currY += 6;

    doc.text(profile.website || "www.printworkshop.in", CX, currY, { align: "center" });
    currY += 6;

    doc.setFontSize(9);
    doc.text("Thank For Your Business", CX, currY, { align: "center" });
    currY += 7;

    if (qrImageUrl) {
      try {
        const qrS = 30;
        doc.addImage(qrImageUrl, "PNG", CX - qrS / 2, currY, qrS, qrS);
        const qrBottomY = currY + qrS + 4;
        doc.setFontSize(8);
        doc.text("SCAN \u0026 PAY", CX, qrBottomY, { align: "center" });
      } catch (e) {}
    }
  } else {
    // ═══════════════════════════════════════════════════════════
    // A4 / A5 PREMIUM LANDSCAPE LAYOUT
    // ═══════════════════════════════════════════════════════════
    const scale = isA4 ? 1 : 0.72;
    const CX = pageWidth / 2;
    const isEstimate = isEstimateDoc;

    // 1. Header Area
    currY = margin;
    
    // Logo Icon (Circular Placeholder)
    const logoSize = 18 * scale;
    if (profile.logoUrl) {
      try {
        // Draw circular background for logo if needed or just image
        doc.addImage(profile.logoUrl, "PNG", margin, currY, logoSize, logoSize);
      } catch(e) {
        // Fallback icon
        doc.setFillColor(30, 30, 30);
        doc.circle(margin + logoSize/2, currY + logoSize/2, logoSize/2, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10 * scale);
        doc.text("PW", margin + logoSize/2, currY + logoSize/2 + 1.5 * scale, { align: "center" });
      }
    } else {
      doc.setFillColor(30, 30, 30);
      doc.circle(margin + logoSize/2, currY + logoSize/2, logoSize/2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10 * scale);
      doc.text("PW", margin + logoSize/2, currY + logoSize/2 + 1.5 * scale, { align: "center" });
    }

    setBlack();
    const brandX = margin + logoSize + 4 * scale;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24 * scale);
    doc.text(profile.name.toUpperCase(), brandX, currY + 7 * scale);
    
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9 * scale);
    doc.setTextColor(100, 100, 100);
    doc.text(profile.slogan || "Innovation in Impression", brandX, currY + 11.5 * scale);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10 * scale);
    doc.setTextColor(50, 50, 50);
    doc.text("DIGITAL PRINTING", brandX, currY + 16 * scale);

    // Contact Block (Top-Right)
    const contactX = pageWidth - margin;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9 * scale);
    doc.setTextColor(0, 0, 0);
    let contactY = currY + 4 * scale;
    
    doc.text(`${profile.phone}`, contactX, contactY, { align: "right" }); contactY += 5 * scale;
    doc.text(profile.email, contactX, contactY, { align: "right" }); contactY += 5 * scale;
    
    const addrLines = doc.splitTextToSize(profile.address, 65 * scale);
    doc.setFontSize(9.2 * scale); // Increased by 15% (from 8)
    doc.setFont("helvetica", "normal");
    doc.text(addrLines, contactX, contactY, { align: "right" });
    
    currY += 22 * scale;
    doc.setDrawColor(220);
    doc.line(margin, currY, pageWidth - margin, currY);
    currY += 8 * scale;

    // 2. Document Title Row
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14 * scale);
    doc.text(docTitle.toUpperCase(), CX, currY, { align: "center" });
    
    doc.setFontSize(10 * scale);
    doc.text(`GSTIN : ${profile.gst}`, pageWidth - margin, currY, { align: "right" });
    currY += 10 * scale;

    // 3. Billing Row
    const billingY = currY;
    doc.setFontSize(9 * scale);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("To :", margin, billingY);
    
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11 * scale);
    doc.text(invoice.customerName?.toUpperCase() || "WALK-IN CUSTOMER", margin, billingY + 6 * scale);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9 * scale);
    doc.text("COIMBATORE", margin, billingY + 11 * scale);
    doc.text(`GSTIN : ${invoice.customerGst || "N/A"}`, margin, billingY + 17 * scale);
    doc.text(`State \u0026 Code : `, margin, billingY + 22 * scale);

    // Right Meta Box
    const metaX = pageWidth - margin - 48 * scale;
    const metaVX = pageWidth - margin;
    let rY = billingY + 6 * scale;
    
    const metaArr = [
      ["Invoice No:", `${invoice.invoiceNo || invoice.quotationNo || invoice.estimateNo || "DRAFT"}`],
      ["Invoice Date:", `${invoice.date || new Date().toLocaleDateString()}`],
      ["PO No:", "-"],
      ["File Ref:", `${invoice.fileName || "-"}`]
    ];

    metaArr.forEach(m => {
      doc.setFont("helvetica", "bold");
      doc.text(m[0], metaX, rY);
      const labelW = doc.getTextWidth(m[0] + " ");
      doc.setFont("helvetica", "normal");
      doc.text(m[1], metaX + labelW, rY);
      rY += 6 * scale;
    });

    currY = billingY + 30 * scale;
    const contentWidth = pageWidth - (2 * margin);

    // 4. Items Table
    const shopStateCode = profile.gst?.slice(0, 2) || "33";
    const custStateCode = invoice.customerGst?.slice(0, 2) || "33";
    const isIgst = invoice.isIgst ?? (shopStateCode !== custStateCode && !isEstimate);

    const W_SNO = 12 * scale;
    const W_AMT = 30 * scale;
    const W_TAXA = 22 * scale;
    const W_TAXPArr = [14, 14, 14, 14]; // CGST%, CGST Amt, SGST%, SGST Amt
    
    let taxAreaW = 0;
    if (!isEstimate) {
      taxAreaW = isIgst ? (20 + 25) * scale : (15 + 20 + 15 + 20) * scale;
    }

    const W_QTY = 15 * scale;
    const W_HSN = 18 * scale;
    const W_RATE = 25 * scale;
    
    const remainingW = contentWidth - W_SNO - W_AMT - taxAreaW - W_QTY - W_HSN - W_RATE;
    
    const cols = {
      sno: { x: margin, w: W_SNO, label: "S.No" },
      desc: { x: margin + W_SNO, w: remainingW, label: "Description" },
      hsn: { x: margin + W_SNO + remainingW, w: W_HSN, label: "HSN" },
      qty: { x: margin + W_SNO + remainingW + W_HSN, w: W_QTY, label: "QTY" },
      rate: { x: margin + W_SNO + remainingW + W_HSN + W_QTY, w: W_RATE, label: "RATE (Rs.)" },
      taxInfo: { x: margin + W_SNO + remainingW + W_HSN + W_QTY + W_RATE, w: taxAreaW },
      amt: { x: pageWidth - margin - W_AMT, w: W_AMT, label: "AMOUNT" }
    };

    // Draw Table Header Band
    doc.setFillColor(235, 235, 235);
    doc.rect(margin, currY, contentWidth, 10 * scale, "F");
    setBold();
    doc.setFontSize(8.5 * scale);
    
    doc.text(cols.sno.label, cols.sno.x + cols.sno.w/2, currY + 6.5 * scale, { align: "center" });
    doc.text(cols.desc.label, cols.desc.x + 3 * scale, currY + 6.5 * scale);
    doc.text(cols.hsn.label, cols.hsn.x + cols.hsn.w/2, currY + 6.5 * scale, { align: "center" });
    doc.text(cols.qty.label, cols.qty.x + cols.qty.w/2, currY + 6.5 * scale, { align: "center" });
    doc.text(cols.rate.label, cols.rate.x + cols.rate.w/2, currY + 6.5 * scale, { align: "center" });
    
    // Tax Headers
    if (!isEstimate) {
      if (isIgst) {
        doc.text("IGST %", cols.taxInfo.x + 10 * scale, currY + 6.5 * scale, { align: "center" });
        doc.text("IGST (Rs.)", cols.taxInfo.x + 32 * scale, currY + 6.5 * scale, { align: "center" });
      } else {
        const tw = taxAreaW / 4;
        doc.text("CGST %", cols.taxInfo.x + tw * 0.5, currY + 6.5 * scale, { align: "center" });
        doc.text("CGST (Rs.)", cols.taxInfo.x + tw * 1.5, currY + 6.5 * scale, { align: "center" });
        doc.text("SGST %", cols.taxInfo.x + tw * 2.5, currY + 6.5 * scale, { align: "center" });
        doc.text("SGST (Rs.)", cols.taxInfo.x + tw * 3.5, currY + 6.5 * scale, { align: "center" });
      }
    }
    
    doc.text(cols.amt.label, cols.amt.x + cols.amt.w/2, currY + 6.5 * scale, { align: "center" });
    currY += 14 * scale;

    // Table Body
    setNormal();
    doc.setFontSize(9 * scale);
    let taxableAmount = 0;
    let taxTotal = 0;

    invoice.items.forEach((item, i) => {
      const amt = parseFloat(item.amount || 0);
      const qty = parseFloat(item.qty || 0);
      const rate = parseFloat(item.rate || 0);
      const gRate = parseFloat(item.gstRate || 0);
      const itax = isEstimate ? 0 : amt * (gRate / 100);
      
      taxableAmount += amt;
      taxTotal += itax;

      const descLines = doc.splitTextToSize(item.name?.toUpperCase() || "", cols.desc.w - 6 * scale);
      const rowH = Math.max(8 * scale, descLines.length * 4.5 * scale + 2);

      doc.text((i + 1).toString(), cols.sno.x + cols.sno.w / 2, currY + 5 * scale, { align: "center" });
      doc.text(descLines, cols.desc.x + 3 * scale, currY + 5 * scale);
      doc.text(item.hsnCode || "-", cols.hsn.x + cols.hsn.w/2, currY + 5 * scale, { align: "center" });
      doc.text(qty.toFixed(2), cols.qty.x + cols.qty.w/2, currY + 5 * scale, { align: "center" });
      doc.text(rate.toFixed(2), cols.rate.x + cols.rate.w/2, currY + 5 * scale, { align: "center" });

      if (!isEstimate) {
        if (isIgst) {
          doc.text(gRate.toFixed(2), cols.taxInfo.x + 10 * scale, currY + 5 * scale, { align: "center" });
          doc.text(itax.toFixed(2), cols.taxInfo.x + 32 * scale, currY + 5 * scale, { align: "center" });
        } else {
          const tw = taxAreaW / 4;
          doc.text((gRate/2).toFixed(2), cols.taxInfo.x + tw * 0.5, currY + 5 * scale, { align: "center" });
          doc.text((itax/2).toFixed(2), cols.taxInfo.x + tw * 1.5, currY + 5 * scale, { align: "center" });
          doc.text((gRate/2).toFixed(2), cols.taxInfo.x + tw * 2.5, currY + 5 * scale, { align: "center" });
          doc.text((itax/2).toFixed(2), cols.taxInfo.x + tw * 3.5, currY + 5 * scale, { align: "center" });
        }
      }

      doc.text((amt + itax).toFixed(2), cols.amt.x + cols.amt.w - 3 * scale, currY + 5 * scale, { align: "right" });
      currY += rowH;
    });

    const bodyFillLimit = isA4 ? 140 * scale : 100 * scale;
    if (currY < bodyFillLimit) currY = bodyFillLimit;
    currY += 15 * scale;

    // 5. Footer Area
    const footerY = currY;
    
    // Bank Details (Bottom-Left)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11 * scale); // Increased by 10% (from 10)
    doc.text("Bank Details", margin, footerY);
    
    const bLabels = ["Account Name", "Bank", "Branch", "A\\C No", "IFSC Code"];
    const bValues = [
      `${profile.accountName || profile.name}`,
      `${profile.bankName}`,
      `${profile.bankBranch}`,
      `${profile.accountNumber}`,
      `${profile.ifscCode}`
    ];
    
    let by = footerY + 6 * scale;
    doc.setFontSize(9.35 * scale); // Increased by 10% (from 8.5)
    bLabels.forEach((bl, i) => {
      doc.setFont("helvetica", "normal");
      doc.text(bl + ":", margin, by);
      doc.setFont("helvetica", "bold");
      doc.text(bValues[i], margin + 28 * scale, by);
      by += 5 * scale;
    });
    
    doc.setFontSize(10 * scale);
    doc.text("THANK YOU FOR YOUR BUSINESS", margin, by + 6 * scale);

    // QR Payment (Bottom-Center)
    if (qrImageUrl) {
      try {
        const qrSize = 34 * scale;
        const qx = CX - qrSize/2;
        doc.addImage(qrImageUrl, "PNG", qx, footerY + 2 * scale, qrSize, qrSize);
        doc.setFontSize(8.5 * scale);
        doc.setFont("helvetica", "bold");
        doc.text("SCAN \u0026 PAY", CX, footerY + qrSize + 6 * scale, { align: "center" });
      } catch(e) {}
    }

    // Totals Box (Bottom-Right)
    const boxW = 75 * scale;
    const boxX = pageWidth - margin - boxW;
    let ty = footerY;
    const rowH = 7 * scale;
    
    const subT = taxableAmount;
    const cgst = isIgst ? 0 : taxTotal / 2;
    const sgst = isIgst ? 0 : taxTotal / 2;
    const igst = isIgst ? taxTotal : 0;
    
    const rows = [
      ["Sub Total", subT.toFixed(2)],
      ...(isEstimate ? [] : isIgst ? [["IGST 18 %", igst.toFixed(2)]] : [
        [`CGST ${(parseFloat(invoice.items[0]?.gstRate || 18)/2).toFixed(0)} %`, cgst.toFixed(2)],
        [`SGST ${(parseFloat(invoice.items[0]?.gstRate || 18)/2).toFixed(0)} %`, sgst.toFixed(2)]
      ]),
      ["Round Off", "0.00"],
      ["Grand Total", (subT + taxTotal).toFixed(2)]
    ];

    rows.forEach((r, i) => {
      const isGrand = i === rows.length - 1;
      doc.setDrawColor(200);
      doc.setLineWidth(0.2);
      
      if (isGrand) {
        doc.setFillColor(235, 235, 235);
        doc.rect(boxX, ty, boxW, rowH + 2 * scale, "F");
      }
      doc.rect(boxX, ty, boxW, isGrand ? rowH + 2 * scale : rowH, "S");
      
      doc.setFont("helvetica", isGrand ? "bold" : "normal");
      doc.setFontSize(isGrand ? 11 * scale : 9 * scale);
      doc.text(r[0], boxX + 3 * scale, ty + (isGrand ? 6 * scale : 5 * scale));
      doc.text(r[1], metaVX - 3 * scale, ty + (isGrand ? 6 * scale: 5 * scale), { align: "right" });
      ty += isGrand ? rowH + 2 * scale : rowH;
    });
    
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7 * scale);
    doc.text("This is computer generated invoice signature not required", metaVX, ty + 5 * scale, { align: "right" });
  }

  return doc;
};
