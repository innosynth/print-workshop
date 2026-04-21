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

  // For thermal: pre-calculate exact page height so coordinates are correct
  let thermalPageHeight = 500;
  if (isThermal) {
    const M = 4;
    const PW = 72.1;
    const CW = PW - M * 2;
    const COL_QTY = 43;

    // Use a temp doc solely for text-wrapping measurement
    const temp = new jsPDF({ orientation: "p", unit: "mm", format: [PW, 100] as any });
    let h = M + 4; // top margin + 1 line space

    // Header
    h += 5; // shop name
    temp.setFont("helvetica", "normal");
    temp.setFontSize(7);
    const isEstimate = isEstimateDoc;
    if (profile.slogan) h += 3.5;
    const addrLC = temp.splitTextToSize(profile.address, CW - 4).length;
    h += addrLC * 3.2; // address lines
    h += 3.5; // phone
    h += 5;   // mail
    h += 4;   // doc title + underline
    h += 4;   // separator
    h += 4;   // invoice no + date
    h += 3;   // customer
    h += 4;   // separator
    h += 4;   // table header

    // Items (measure wrapping per item)
    temp.setFont("helvetica", "normal");
    temp.setFontSize(7.5);
    const maxNameW = COL_QTY - M - 6;
    invoice.items.forEach(item => {
      const lines = temp.splitTextToSize((item.name || "").toUpperCase(), maxNameW).length;
      h += 4; // first line
      h += Math.max(0, lines - 1) * 3.5; // wrapped lines
    });

    h += 2;   // gap after items
    h += 5;   // separator
    h += 5;   // total items
    h += 4;   // total qty + total
    h += 6;   // separator
    h += 3.5; // file
    h += 5;   // user + time
    h += 5;   // website
    h += 6;   // thank you
    if (qrImageUrl) h += 31; // QR + gap
    h += 6;   // bottom padding

    thermalPageHeight = Math.max(h, 50);
  }

  const format = isA4 ? "a4" : isA5 ? "a5" : [72.1, thermalPageHeight];

  const doc = new jsPDF({
    orientation: orientation as any,
    unit,
    format: format as any
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  // Margins: A4=210x297 → print 202x289 (4mm), A5=148x210 → print 140x202 (4mm), Thermal=72.1mm (4mm)
  const margin = 4;
  let currY = margin;

  // Icons & Symbols
  const SYM_RS = "Rs. "; // Using Rs. consistently for reliability if unicode ₹ fails
  const ICON_PHONE = "Ph: ";
  const ICON_MAIL = "Email: ";
  const ICON_PIN = "Addr: ";

  // Font helpers
  const setBold = () => doc.setFont("helvetica", "bold");
  const setNormal = () => doc.setFont("helvetica", "normal");
  const setSize = (s: number) => doc.setFontSize(s);
  const setGray = () => doc.setTextColor(128, 128, 128);
  const setBlack = () => doc.setTextColor(0, 0, 0);

  if (isThermal) {
    // ═══════════════════════════════════════════════════════════
    // THERMAL POS RECEIPT — 72.1mm width, dynamic height
    // Font: Helvetica (Arial) throughout — bold where needed
    // ═══════════════════════════════════════════════════════════
    const PW = doc.internal.pageSize.getWidth(); // 72.1
    const M = margin; // 4mm
    const CW = PW - M * 2; // content width ~64mm
    const CX = PW / 2; // center X

    // Column positions for items table (right-aligned anchors)
    const COL_QTY = 43;
    const COL_RATE = 54;
    const COL_AMT = PW - M;

    // Dashed separator helper
    const drawDash = (y: number) => {
      doc.setLineDashPattern([1.5, 1], 0);
      doc.setLineWidth(0.2);
      doc.line(M, y, PW - M, y);
      doc.setLineDashPattern([], 0);
    };

    // ───── HEADER: Shop Name (Bold) ─────
    currY += 4; // Extra space at top
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(profile.name || "Print Workshop", CX, currY, { align: "center" });
    currY += 5;

    // ───── HEADER: Slogan, Address, Phone (Normal) ─────
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);

    if (profile.slogan) {
      doc.text(`( ${profile.slogan} )`, CX, currY, { align: "center" });
      currY += 3.5;
    }

    const addrLines = doc.splitTextToSize(profile.address, CW - 4);
    doc.text(addrLines, CX, currY, { align: "center" });
    currY += addrLines.length * 3.2;

    doc.text(`Call @ ${profile.phone}`, CX, currY, { align: "center" });
    currY += 3.5;

    // ───── Mail (Bold) ─────
    doc.setFont("helvetica", "bold");
    doc.text(`Mail : ${profile.email}`, CX, currY, { align: "center" });
    currY += 5;

    // ───── DOCUMENT TITLE (Bold) ─────
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(docTitle, CX, currY, { align: "center" });
    currY += 4;

    // ───── SEPARATOR ─────
    drawDash(currY);
    currY += 4;

    // ───── INVOICE META ROW (Normal) ─────
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    const docNo = invoice.invoiceNo || invoice.quotationNo || invoice.estimateNo || "DRAFT";
    doc.text(`No.${docNo}`, M, currY);
    doc.text(`Date: ${invoice.date || new Date().toLocaleDateString()}`, PW - M, currY, { align: "right" });
    currY += 4;
    doc.text(`C.ID : ${invoice.customerName || "Walk-in Customer"}`, M, currY);
    currY += 3;

    // ───── SEPARATOR ─────
    drawDash(currY);
    currY += 4;

    // ───── TABLE HEADER (Bold) ─────
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("Product Name", M, currY);
    doc.text("Qty", COL_QTY, currY, { align: "right" });
    doc.text("Rate", COL_RATE, currY, { align: "right" });
    doc.text("Amount", COL_AMT, currY, { align: "right" });
    currY += 4;

    // ───── TABLE ITEMS (Normal) ─────
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
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

      // First line: name + qty + rate + amount
      doc.text(nameLines[0] || "", M, currY);
      doc.text(qty.toString(), COL_QTY, currY, { align: "right" });
      doc.text(parseFloat(item.rate || 0).toString(), COL_RATE, currY, { align: "right" });
      const itemRowTotal = isEstimate ? amt : (amt + itax);
      doc.text(itemRowTotal.toFixed(2), COL_AMT, currY, { align: "right" });
      currY += 4;

      // Wrapped name continuation lines
      for (let k = 1; k < nameLines.length; k++) {
        doc.text(nameLines[k], M, currY);
        currY += 3.5;
      }
    });

    currY += 2;

    // ───── SEPARATOR ─────
    drawDash(currY);
    currY += 5;

    // ───── TOTALS SECTION (Bold) ─────
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(`Total Items : ${invoice.items.length}`, M, currY);
    currY += 5;

    doc.text(`Total Qty : ${totalQty}`, M, currY);
    doc.setFontSize(10);
    const grandTotal = isEstimate ? totalTaxable : (totalTaxable + totalTax);
    doc.text(`Total: ${grandTotal.toFixed(2)}`, PW - M, currY, { align: "right" });
    currY += 4;

    // ───── SEPARATOR ─────
    drawDash(currY);
    currY += 6;

    // ───── FILE & USER INFO (Bold) ─────
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(`File : ${invoice.fileName || ""}`, M, currY);
    currY += 3.5;
    const timeStr = new Date()
      .toLocaleTimeString("en-GB", { hour12: false })
      .replace(/:/g, ".");
    doc.text(`User :admin | Time : ${timeStr}`, M, currY);
    currY += 5;

    // ───── WEBSITE (Bold) ─────
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(
      profile.website || "www.printworkshop.in",
      CX,
      currY,
      { align: "center" }
    );
    currY += 5;

    // ───── THANK YOU ─────
    doc.setFontSize(9);
    doc.text("Thank For Your Business", CX, currY, { align: "center" });
    currY += 6;

    // ───── QR CODE (from configured payment QR) ─────
    if (qrImageUrl) {
      try {
        const qrS = 28;
        doc.addImage(
          qrImageUrl,
          "PNG",
          CX - qrS / 2,
          currY,
          qrS,
          qrS
        );
        currY += qrS + 3;
      } catch (_e) {
        // QR load failed — skip silently
      }
    }

    // Page height was pre-calculated before doc creation — no post-render trim needed

  } else {
    // A4 / A5 Layout (Landscape)
    const scale = isA4 ? 1 : 0.7;
    const contentWidth = pageWidth - margin * 2;

    // 1. Header (LOGO FIX)
    if (profile.logoUrl) {
        try { doc.addImage(profile.logoUrl, "PNG", margin, currY, 20 * scale, 20 * scale); } catch (e) {}
    } else {
        // Draw the PW Box Logo as fallback if logoUrl is missing
        doc.setFillColor(0, 0, 0);
        doc.rect(margin, currY, 18 * scale, 18 * scale, "F");
        doc.setTextColor(255, 255, 255);
        setSize(14 * scale); setBold();
        doc.text("PW", margin + 9 * scale, currY + 11 * scale, { align: "center" });
        setBlack();
    }

    setBold(); setSize(22 * scale);
    doc.text(profile.name?.toUpperCase() || "PRINT WORKSHOP", margin + 22 * scale, currY + 7 * scale);
    
    setSize(9 * scale); setNormal(); setGray();
    doc.text(profile.slogan?.toUpperCase() || "INNOVATION IN IMPRESSION", margin + 22 * scale, currY + 12 * scale, { angle: 0 }); // Italic not easy in standard fonts, so we just use gray
    setBlack(); setBold();
    doc.text("DIGITAL PRINTING", margin + 22 * scale, currY + 17 * scale);

    // Right Side Header (PRECISE ALIGNMENT)
    setSize(8.5 * scale); setNormal();
    doc.text(`${ICON_PHONE}${profile.phone}`, pageWidth - margin, currY + 4 * scale, { align: "right" });
    doc.text(`${ICON_MAIL}${profile.email}`, pageWidth - margin, currY + 9 * scale, { align: "right" });
    const addrLines = doc.splitTextToSize(profile.address, 60 * scale);
    doc.text(addrLines, pageWidth - margin, currY + 14 * scale, { align: "right" });

    currY += 24 * scale;
    doc.setLineWidth(0.2);
    doc.line(margin, currY, pageWidth - margin, currY);
    currY += 3 * scale;

    // 2. Title Strip (Q U O T A T I O N)
    doc.setFillColor(250, 250, 250);
    doc.rect(margin, currY, contentWidth, 10 * scale, "F");
    doc.setDrawColor(0, 0, 0);
    doc.line(margin, currY, pageWidth - margin, currY);
    doc.line(margin, currY + 10 * scale, pageWidth - margin, currY + 10 * scale);
    
    setBold(); setSize(14 * scale);
    const spacedTitle = docTitle.split('').join(' ');
    doc.text(spacedTitle, pageWidth / 2, currY + 7 * scale, { align: "center" });
    currY += 15 * scale;

    // 3. Info Grid (uppercase labels)
    setSize(9 * scale); setNormal(); setGray();
    doc.text("TO :", margin, currY);
    setBlack(); setBold(); setSize(11 * scale);
    doc.text(invoice.customerName?.toUpperCase() || "WALK-IN CUSTOMER", margin, currY + 5 * scale);
    setNormal(); setSize(9 * scale);
    doc.text("COIMBATORE", margin, currY + 10 * scale);
    doc.text(`GSTIN : ${invoice.customerGst || "N/A"}`, margin, currY + 15 * scale);
    doc.text(`STATE & CODE :`, margin, currY + 20 * scale);

    // Right info
    const labelX = pageWidth - margin - 50 * scale;
    const valueX = pageWidth - margin;
    const labels = [
        "QUOTATION NO :",
        "QUOTATION DATE :",
        "FILE REF :",
        "GSTIN :"
    ];
    const vals = [
        invoice.invoiceNo || invoice.quotationNo || invoice.estimateNo || "DRAFT",
        invoice.date || new Date().toLocaleDateString(),
        invoice.fileName || "-",
        profile.gst
    ];

    labels.forEach((lbl, i) => {
        setGray(); doc.text(lbl, labelX, currY + (i * 5.5 * scale), { align: "right" });
        setBlack(); setBold(); doc.text(vals[i], valueX, currY + (i * 5.5 * scale), { align: "right" });
    });

    currY += 30 * scale;

    // 4. Table (8 COLS: S.NO, DESCRIPTION, HSN, QTY, RATE, IGST%, IGST AMT, AMOUNT)
    const cols = {
        sno: { x: margin, w: 10 * scale },
        desc: { x: margin + 10 * scale, w: contentWidth - 145 * scale },
        hsn: { x: margin + contentWidth - 135 * scale, w: 15 * scale },
        qty: { x: margin + contentWidth - 120 * scale, w: 15 * scale },
        rate: { x: margin + contentWidth - 105 * scale, w: 22 * scale },
        igstP: { x: margin + contentWidth - 83 * scale, w: 15 * scale },
        igstA: { x: margin + contentWidth - 68 * scale, w: 25 * scale },
        amt: { x: margin + contentWidth - 43 * scale, w: 43 * scale }
    };

    doc.setFillColor(245, 245, 245);
    doc.rect(margin, currY, contentWidth, 10 * scale, "F");
    setBold(); setSize(8 * scale);
    doc.rect(margin, currY, contentWidth, 10 * scale, "S");
    
    doc.text("S.NO", cols.sno.x + cols.sno.w / 2, currY + 6 * scale, { align: "center" });
    doc.text("DESCRIPTION", cols.desc.x + 2, currY + 6 * scale);
    doc.text("HSN", cols.hsn.x + cols.hsn.w / 2, currY + 6 * scale, { align: "center" });
    doc.text("QTY", cols.qty.x + cols.qty.w / 2, currY + 6 * scale, { align: "center" });
    doc.text(`RATE (${SYM_RS})`, cols.rate.x + cols.rate.w - 2, currY + 6 * scale, { align: "right" });
    doc.text("IGST %", cols.igstP.x + cols.igstP.w / 2, currY + 6 * scale, { align: "center" });
    doc.text(`IGST AMT(${SYM_RS})`, cols.igstA.x + cols.igstA.w / 2, currY + 6 * scale, { align: "center" });
    doc.text("AMOUNT", cols.amt.x + cols.amt.w - 2, currY + 6 * scale, { align: "right" });

    currY += 10 * scale;
    setNormal();

    let taxableTotal = 0;
    let taxTotal = 0;

    invoice.items.forEach((item, index) => {
        const amt = parseFloat(item.amount || 0);
        const rate = parseFloat(item.rate || 0);
        const qty = parseFloat(item.qty || 0);
        const gRate = parseFloat(item.gstRate || 0);
        const isEstimate = isEstimateDoc;
        const itemTax = isEstimate ? 0 : amt * (gRate / 100);
        
        taxableTotal += amt;
        taxTotal += itemTax;

        const descLines = doc.splitTextToSize(item.name?.toUpperCase() || "", cols.desc.w - 4);
        const rowH = Math.max(10 * scale, descLines.length * 5 * scale + 2);

        // Draw Row borders
        Object.values(cols).forEach(c => doc.rect(c.x, currY, c.w, rowH, "S"));

        doc.text((index + 1).toString(), cols.sno.x + cols.sno.w / 2, currY + 6 * scale, { align: "center" });
        doc.text(descLines, cols.desc.x + 2, currY + 6 * scale);
        doc.text(item.hsnCode || "-", cols.hsn.x + cols.hsn.w / 2, currY + 6 * scale, { align: "center" });
        doc.text(qty.toFixed(2), cols.qty.x + cols.qty.w / 2, currY + 6 * scale, { align: "center" });
        doc.text(rate.toFixed(2), cols.rate.x + cols.rate.w - 2, currY + 6 * scale, { align: "right" });
        doc.text(gRate > 0 && !isEstimate ? gRate.toFixed(2) : "-", cols.igstP.x + cols.igstP.w / 2, currY + 6 * scale, { align: "center" });
        doc.text(itemTax > 0 ? itemTax.toFixed(2) : "-", cols.igstA.x + cols.igstA.w / 2, currY + 6 * scale, { align: "center" });
        setBold(); doc.text((amt + itemTax).toFixed(2), cols.amt.x + cols.amt.w - 2, currY + 6 * scale, { align: "right" });
        setNormal();

        currY += rowH;
    });

    // Dummy rows (match look)
    const fillerCount = Math.max(0, 5 - invoice.items.length);
    for(let k=0; k<fillerCount; k++) {
        Object.values(cols).forEach(c => doc.rect(c.x, currY, c.w, 8 * scale, "S"));
        currY += 8 * scale;
    }

    currY += 10 * scale;

    // 5. Footer Details
    const footerY = currY;
    setSize(9 * scale); setBold();
    doc.text("BANK DETAILS", margin, currY);
    doc.line(margin, currY + 1, margin + 20 * scale, currY + 1);
    currY += 6 * scale;
    setNormal(); setSize(8 * scale);
    const details = [
        ["Account Name", `: ${profile.accountName}`],
        ["Bank", `: ${profile.bankName}`],
        ["Branch", `: ${profile.bankBranch}`],
        ["A/C No", `: ${profile.accountNumber}`],
        ["IFSC Code", `: ${profile.ifscCode}`]
    ];
    details.forEach((d, i) => {
        setGray(); doc.text(d[0], margin, currY + (i * 4.5 * scale));
        setBlack(); setBold(); doc.text(d[1], margin + 22 * scale, currY + (i * 4.5 * scale));
    });

    setBold(); setSize(10 * scale);
    doc.text("THANK YOU FOR YOUR BUSINESS", margin, footerY + 35 * scale);

    // Middle QR
    if (qrImageUrl) {
        try {
            doc.rect(pageWidth / 2 - 15 * scale, footerY, 30 * scale, 30 * scale, "S");
            doc.addImage(qrImageUrl, "PNG", pageWidth / 2 - 14 * scale, footerY + 1 * scale, 28 * scale, 28 * scale);
            setSize(8 * scale); setBold();
            doc.text("SCAN & PAY", pageWidth / 2, footerY + 35 * scale, { align: "center" });
        } catch(e) {}
    }

    // Totals Box (PRECISE MATCH)
    const boxW = 85 * scale;
    const boxX = pageWidth - margin - boxW;
    let tY = footerY;
    
    doc.rect(boxX, tY, boxW, 8 * scale, "S");
    setSize(9 * scale); setNormal(); setGray();
    doc.text("Sub Total", boxX + 4, tY + 5.5 * scale);
    setBlack(); setBold();
    doc.text(`${SYM_RS}${taxableTotal.toFixed(2)}`, valueX - 4, tY + 5.5 * scale, { align: "right" });
    
    if (!isEstimateDoc) {
        tY += 8 * scale;
        doc.rect(boxX, tY, boxW, 8 * scale, "S");
        setNormal(); setGray();
        doc.text("IGST", boxX + 4, tY + 5.5 * scale);
        setBlack(); setBold();
        doc.text(`${SYM_RS}${taxTotal.toFixed(2)}`, valueX - 4, tY + 5.5 * scale, { align: "right" });
    }

    tY += 8 * scale;
    doc.setFillColor(245, 245, 245);
    doc.rect(boxX, tY, boxW, 10 * scale, "F");
    doc.rect(boxX, tY, boxW, 10 * scale, "S");
    setSize(11 * scale); setBold();
    doc.text("Grand Total", boxX + 4, tY + 6.5 * scale);
    doc.text(`${SYM_RS}${(taxableTotal + taxTotal).toFixed(2)}`, valueX - 4, tY + 6.5 * scale, { align: "right" });

    setSize(7 * scale); setNormal(); setGray();
    doc.text("This is computer generated document signature not required", pageWidth - margin, pageHeight - margin + 3.5 * scale, { align: "right" });
  }

  return doc;
};
