import { useState } from "react";
import { invoices, quotations, salesReturns, contacts, products } from "@/lib/mockData";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Trash2, UserPlus, Printer, FileText } from "lucide-react";
import { StatusBadge } from "./Dashboard";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePrintSettings } from "@/lib/print-settings-context";
import { QRCodeCanvas } from "qrcode.react";

function InvoicePrintPreview({ invoice, onClose, docType }: { invoice: any, onClose: () => void, docType?: string }) {
  const { settings } = usePrintSettings();
  const [paperSize, setPaperSize] = useState<"A4" | "thermal">(settings.defaultPaperSize);

  const companyInfo = {
    name: "InnoSynth Print Workshop",
    address: "Unit 4, Industrial Estate, Andheri East, Mumbai – 400 093",
    gst: "27AABCC1234D1Z8",
    phone: "022-28349876",
    email: "info@innosynth.org",
    upiId: "innosynth@upi",
  };

  // Generate UPI payment link (only for invoices)
  const upiLink = `upi://pay?pa=${companyInfo.upiId}&pn=${encodeURIComponent(companyInfo.name)}&am=${invoice.total || invoice.amount}&tn=${invoice.id}&cu=INR`;

  const handlePrint = () => {
    window.print();
  };

  const a4Style = `
    @media print {
      @page { size: A4; margin: ${settings.a4Margin}mm; }
      .no-print { display: none !important; }
      .print-container { width: 100% !important; max-width: none !important; }
    }
  `;

  const thermalStyle = `
    @media print {
      @page { size: ${settings.thermalWidth}mm ${settings.thermalHeight}mm; margin: ${settings.thermalMargin}mm; }
      .no-print { display: none !important; }
      .print-container { width: 100% !important; max-width: none !important; }
      .thermal-format { font-size: ${settings.thermalFontSize}px !important; }
      .thermal-format table { font-size: calc(${settings.thermalFontSize}px - 1px) !important; }
      .thermal-format .company-info { font-size: calc(${settings.thermalFontSize}px - 1px) !important; }
      .thermal-format .invoice-header { font-size: calc(${settings.thermalFontSize}px + 1px) !important; }
    }
  `;

  // Determine document title
  const docTitle = docType === "estimates" ? "ESTIMATE" : docType === "quotations" ? "QUOTATION" : "TAX INVOICE";
  const showGST = docType !== "estimates";

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <style>{paperSize === "A4" ? a4Style : thermalStyle}</style>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{docTitle} Print Preview - {invoice.id}</span>
            <div className="flex gap-2">
              <Button
                variant={paperSize === "A4" ? "default" : "outline"}
                size="sm"
                onClick={() => setPaperSize("A4")}
                className="no-print"
              >
                A4
              </Button>
              <Button
                variant={paperSize === "thermal" ? "default" : "outline"}
                size="sm"
                onClick={() => setPaperSize("thermal")}
                className="no-print"
              >
                Thermal (80mm)
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className={`print-container ${paperSize === "thermal" ? "thermal-format" : ""}`}>
          {/* Invoice Content */}
          <div className={`border-2 border-black ${paperSize === "thermal" ? "p-4" : "p-4"}`}
            style={paperSize === "thermal"
              ? { width: "300px", margin: "0 auto", fontSize: `${settings.thermalFontSize}px`, wordWrap: "break-word", wordBreak: "break-word" }
              : { fontSize: `${settings.a4FontSize}px` }}>
            {/* Header */}
            <div className="text-center mb-3 company-info">
              <h2 className={`${paperSize === "thermal" ? "text-sm" : "text-xl"} font-bold leading-tight`}>{companyInfo.name}</h2>
              <p className={`${paperSize === "thermal" ? "text-xs" : "text-sm"} leading-tight text-center break-words`}>{companyInfo.address}</p>
              <p className={`${paperSize === "thermal" ? "text-xs" : "text-sm"} leading-tight text-center`}>{showGST ? `GST: ${companyInfo.gst} | ` : ''}Phone: {companyInfo.phone}</p>
              <p className={`${paperSize === "thermal" ? "text-xs" : "text-sm"} leading-tight text-center`}>Email: {companyInfo.email}</p>
            </div>

            {/* Invoice Details */}
            <div className="mb-3 invoice-header">
              <div className="text-center">
                <h3 className={`${paperSize === "thermal" ? "text-sm" : "text-lg"} font-bold`}>{docTitle}</h3>
                <p className={`${paperSize === "thermal" ? "text-xs" : "text-sm"}`}>{docType === "estimates" ? "Estimate #" : docType === "quotations" ? "Quotation #" : "Invoice #"}: {invoice.id}</p>
                <p className={`${paperSize === "thermal" ? "text-xs" : "text-sm"}`}>Date: {invoice.date}</p>
                <p className={`${paperSize === "thermal" ? "text-xs" : "text-sm"} font-semibold mt-1`}>Customer: {invoice.customer}</p>
              </div>
            </div>

            {/* Items Table */}
            <table className={`w-full border-collapse border border-black mb-3 ${paperSize === "thermal" ? "text-xs" : ""}`}>
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-black px-2 py-1 text-center">SL#</th>
                  <th className="border border-black px-2 py-1 text-left">Description</th>
                  <th className="border border-black px-2 py-1 text-center">Qty</th>
                  <th className="border border-black px-2 py-1 text-right">Rate</th>
                  <th className="border border-black px-2 py-1 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black px-2 py-1 text-center">1</td>
                  <td className="border border-black px-2 py-1">Print Services</td>
                  <td className="border border-black px-2 py-1 text-center">{invoice.items || 1}</td>
                  <td className="border border-black px-2 py-1 text-right">₹{Math.round(invoice.amount / (invoice.items || 1))}</td>
                  <td className="border border-black px-2 py-1 text-right">₹{invoice.amount.toLocaleString("en-IN")}</td>
                </tr>
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-full">
                <div className="flex justify-between py-1">
                  <span className={paperSize === "thermal" ? "text-xs" : "text-sm"}>Subtotal:</span>
                  <span className={`${paperSize === "thermal" ? "text-xs" : "text-sm"} font-semibold`}>₹{invoice.amount.toLocaleString("en-IN")}</span>
                </div>
                {showGST && (
                  <div className="flex justify-between py-1">
                    <span className={paperSize === "thermal" ? "text-xs" : "text-sm"}>Tax (18%):</span>
                    <span className={`${paperSize === "thermal" ? "text-xs" : "text-sm"} font-semibold`}>₹{Math.round(invoice.amount * 0.18).toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-t-2 border-black mt-1 pt-1">
                  <span className={paperSize === "thermal" ? "text-sm font-bold" : "font-bold"}>Total:</span>
                  <span className={paperSize === "thermal" ? "text-sm font-bold" : "font-bold"}>
                    ₹{(showGST ? (invoice.total || invoice.amount * 1.18) : invoice.amount).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-2 border-t border-black">
              {/* UPI Payment QR Code - Only show for A4 and invoices */}
              {paperSize === "A4" && docType !== "estimates" && docType !== "quotations" && (
                <div className="flex justify-center mb-4">
                  <div className="text-center">
                    <QRCodeCanvas
                      value={upiLink}
                      size={128}
                      level="H"
                      includeMargin={true}
                      className="border-2 border-black p-1"
                    />
                    <p className="text-xs mt-2 font-semibold">Scan to Pay ₹{(invoice.total || invoice.amount * 1.18).toLocaleString("en-IN")}</p>
                    <p className="text-[10px] text-muted-foreground">UPI: {companyInfo.upiId}</p>
                  </div>
                </div>
              )}
              <div className="text-center">
                <p className={paperSize === "thermal" ? "text-[10px]" : "text-xs"}>Thank you for your business!</p>
                <p className={`${paperSize === "thermal" ? "text-[10px]" : "text-xs"} mt-1`}>This is a computer-generated {docTitle.toLowerCase()}.</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 mt-4 no-print">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button onClick={handlePrint}><Printer className="h-4 w-4 mr-2" />Print</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TxTable({ data, cols, onPrint, onConvert }: { data: any[]; cols: { key: string; label: string; render?: (row: any) => React.ReactNode }[], onPrint?: (row: any) => void, onConvert?: (row: any) => void }) {
  const [search, setSearch] = useState("");
  const filtered = data.filter(row =>
    Object.values(row).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b bg-muted/40">
                  {cols.map(c => (
                    <th key={c.key} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">{c.label}</th>
                  ))}
                  {(onPrint || onConvert) && <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">Action</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                    {cols.map(c => (
                      <td key={c.key} className="px-4 py-2.5">
                        {c.render ? c.render(row) : row[c.key]}
                      </td>
                    ))}
                    {(onPrint || onConvert) && (
                      <td className="px-4 py-2.5">
                        <div className="flex gap-1">
                          {onPrint && (
                            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => onPrint(row)}>
                              <Printer className="h-3.5 w-3.5" />Print
                            </Button>
                          )}
                          {onConvert && (
                            <Button variant="default" size="sm" className="h-7 gap-1 text-xs" onClick={() => onConvert(row)}>
                              Convert to Invoice
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={cols.length + (onPrint || onConvert ? 1 : 0)} className="px-4 py-8 text-center text-muted-foreground">No records found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">{filtered.length} records</p>
    </div>
  );
}

function CreateInvoiceModal({ trigger, title, tabName }: { trigger: React.ReactNode; title: string, tabName: string }) {
  const [lineItems, setLineItems] = useState([{ product: "", qty: 1, price: 0, gst: 18 }]);
  const [open, setOpen] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [customerType, setCustomerType] = useState<"B2B" | "B2C">("B2B");
  const subtotal = lineItems.reduce((s, l) => s + l.qty * l.price, 0);
  const tax = lineItems.reduce((s, l) => s + l.qty * l.price * l.gst / 100, 0);

  // Customer form state
  const [customerForm, setCustomerForm] = useState({
    companyName: "",
    contactPerson: "",
    mobile: "",
    whatsapp: "",
    email: "",
    gstNumber: "",
    city: "",
    billingAddress: "",
    fullName: "",
    address: "",
  });

  const handleAddCustomer = () => {
    console.log("Adding customer:", customerForm, customerType);
    setShowAddCustomer(false);
    setCustomerForm({
      companyName: "",
      contactPerson: "",
      mobile: "",
      whatsapp: "",
      email: "",
      gstNumber: "",
      city: "",
      billingAddress: "",
      fullName: "",
      address: "",
    });
  };

  // Define header fields for each tab type
  const getHeaderFields = () => {
    switch (tabName) {
      case "invoices":
        return [
          { name: "Customer", type: "select", options: contacts.filter(c => c.type === "B2B" || c.type === "B2C"), required: true, isCustomer: true },
          { name: "Invoice Date", type: "date", required: true },
          { name: "Due Date", type: "date" },
          { name: "Payment Terms", type: "text", placeholder: "e.g., Net 30" },
        ];
      case "quotations":
        return [
          { name: "Customer", type: "select", options: contacts.filter(c => c.type === "B2B" || c.type === "B2C"), required: true, isCustomer: true },
          { name: "Quotation Date", type: "date", required: true },
          { name: "Valid Until", type: "date", required: true },
          { name: "Reference No.", type: "text", placeholder: "Optional reference" },
        ];
      case "estimates":
        return [
          { name: "Customer", type: "select", options: contacts.filter(c => c.type === "B2B" || c.type === "B2C"), required: true, isCustomer: true },
          { name: "Estimate Date", type: "date", required: true },
          { name: "Valid Until", type: "date", required: true },
          { name: "Reference No.", type: "text", placeholder: "Optional reference" },
        ];
      case "returns":
        return [
          { name: "Customer", type: "select", options: contacts.filter(c => c.type === "B2B" || c.type === "B2C"), required: true, isCustomer: true },
          { name: "Return Date", type: "date", required: true },
          { name: "Reference Invoice", type: "text", placeholder: "Original invoice number", required: true },
          { name: "Return Reason", type: "text", placeholder: "Reason for return" },
        ];
      case "receipts":
        return [
          { name: "Customer", type: "select", options: contacts.filter(c => c.type === "B2B" || c.type === "B2C"), required: true, isCustomer: true },
          { name: "Receipt Date", type: "date", required: true },
          { name: "Amount", type: "number", placeholder: "Enter amount", required: true },
          { name: "Payment Mode", type: "select", options: [{ id: "cash", name: "Cash" }, { id: "cheque", name: "Cheque" }, { id: "neft", name: "NEFT/IMPS" }, { id: "upi", name: "UPI" }], required: true },
          { name: "Reference No.", type: "text", placeholder: "Cheque/UPI ref number" },
          { name: "Against Invoice", type: "text", placeholder: "Invoice number" },
        ];
      case "proforma":
        return [
          { name: "Customer", type: "select", options: contacts.filter(c => c.type === "B2B" || c.type === "B2C"), required: true, isCustomer: true },
          { name: "Proforma Date", type: "date", required: true },
          { name: "Delivery Date", type: "date" },
          { name: "Sales Order No.", type: "text", placeholder: "If applicable" },
          { name: "Special Instructions", type: "textarea", placeholder: "Any special instructions" },
        ];
      case "obf":
        return [
          { name: "Customer", type: "select", options: contacts.filter(c => c.type === "B2B" || c.type === "B2C"), required: true, isCustomer: true },
          { name: "Booking Date", type: "date", required: true },
          { name: "Expected Delivery", type: "date" },
          { name: "Advance Amount", type: "number", placeholder: "Advance received" },
          { name: "Balance Amount", type: "number", placeholder: "Balance to be received" },
          { name: "Notes", type: "textarea", placeholder: "Additional notes" },
        ];
      case "pricing":
        return [
          { name: "Customer", type: "select", options: contacts.filter(c => c.type === "B2B" || c.type === "B2C"), required: true, isCustomer: true },
          { name: "Product", type: "select", options: products, required: true },
          { name: "Special Price", type: "number", placeholder: "Enter special price", required: true },
          { name: "Valid From", type: "date", required: true },
          { name: "Valid Until", type: "date" },
          { name: "Minimum Qty", type: "number", placeholder: "Minimum order quantity" },
        ];
      default:
        return [];
    }
  };

  const headerFields = getHeaderFields();
  const showLineItems = tabName !== "receipts" && tabName !== "pricing";

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              {headerFields.map((field) => (
                <div key={field.name}>
                  <Label className="text-xs font-medium text-muted-foreground">
                    {field.name} {field.required && <span className="text-destructive">*</span>}
                  </Label>
                  {field.type === "select" ? (
                    <Select>
                      <SelectTrigger className="mt-1 h-9">
                        <SelectValue placeholder={`Select ${field.name.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.isCustomer && (
                          <div className="p-2 border-b">
                            <Button
                              variant="ghost"
                              className="w-full justify-start gap-2 text-xs text-primary"
                              onClick={() => setShowAddCustomer(true)}
                            >
                              <UserPlus className="h-3.5 w-3.5" />
                              Add New Customer
                            </Button>
                          </div>
                        )}
                        {field.options?.map((opt: any) => (
                          <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field.type === "textarea" ? (
                    <Textarea className="mt-1 h-20" placeholder={field.placeholder} />
                  ) : (
                    <Input className="mt-1 h-9" placeholder={field.placeholder} type={field.type || "text"} />
                  )}
                </div>
              ))}
            </div>

            {showLineItems && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-foreground">Line Items</label>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1"
                      onClick={() => setLineItems(p => [...p, { product: "", qty: 1, price: 0, gst: 18 }])}>
                      <Plus className="h-3 w-3" />Add Row
                    </Button>
                  </div>
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/40 border-b">
                          {["Product", "Qty", "Unit Price", "GST %", "Amount", ""].map(h => (
                            <th key={h} className="text-left px-3 py-2 font-medium text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {lineItems.map((item, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="px-2 py-1.5">
                              <Select onValueChange={(v) => {
                                const p = products.find(p => p.id === v);
                                setLineItems(items => items.map((it, idx) =>
                                  idx === i ? { ...it, product: v, price: p?.sellPrice ?? 0 } : it
                                ));
                              }}>
                                <SelectTrigger className="h-7 text-xs w-40">
                                  <SelectValue placeholder="Select product" />
                                </SelectTrigger>
                                <SelectContent>
                                  {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-2 py-1.5">
                              <Input type="number" className="h-7 w-16 text-xs" value={item.qty}
                                onChange={e => setLineItems(items => items.map((it, idx) =>
                                  idx === i ? { ...it, qty: +e.target.value } : it
                                ))} />
                            </td>
                            <td className="px-2 py-1.5">
                              <Input type="number" className="h-7 w-24 text-xs" value={item.price}
                                onChange={e => setLineItems(items => items.map((it, idx) =>
                                  idx === i ? { ...it, price: +e.target.value } : it
                                ))} />
                            </td>
                            <td className="px-2 py-1.5">
                              <Select value={String(item.gst)} onValueChange={v => setLineItems(items => items.map((it, idx) =>
                                idx === i ? { ...it, gst: +v } : it
                              ))}>
                                <SelectTrigger className="h-7 w-16 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {[0, 5, 12, 18, 28].map(r => <SelectItem key={r} value={String(r)}>{r}%</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-2 py-1.5 tabular-nums font-semibold">
                              ₹{(item.qty * item.price * (1 + item.gst / 100)).toLocaleString("en-IN")}
                            </td>
                            <td className="px-2 py-1.5">
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                                onClick={() => setLineItems(items => items.filter((_, idx) => idx !== i))}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="w-52 space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{subtotal.toLocaleString("en-IN")}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>₹{tax.toFixed(0)}</span></div>
                    <div className="flex justify-between font-bold border-t pt-1"><span>Total</span><span>₹{(subtotal + tax).toFixed(0)}</span></div>
                  </div>
                </div>
              </>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={() => setOpen(false)}>{tabName === "invoices" ? "Create Invoice" : tabName === "quotations" ? "Create Quotation" : tabName === "returns" ? "Create Return" : tabName === "receipts" ? "Create Receipt" : tabName === "proforma" ? "Create Proforma" : tabName === "obf" ? "Create OBF" : "Save Pricing"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Customer Dialog */}
      <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add New Customer</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2 mb-4">
              <Button
                variant={customerType === "B2B" ? "default" : "outline"}
                size="sm"
                onClick={() => setCustomerType("B2B")}
              >
                B2B Customer
              </Button>
              <Button
                variant={customerType === "B2C" ? "default" : "outline"}
                size="sm"
                onClick={() => setCustomerType("B2C")}
              >
                B2C Customer
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {customerType === "B2B" ? (
                <>
                  <div className="col-span-2">
                    <Label className="text-xs font-medium text-muted-foreground">Company Name *</Label>
                    <Input className="mt-1 h-9" placeholder="Enter company name" value={customerForm.companyName} onChange={e => setCustomerForm({ ...customerForm, companyName: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Contact Person *</Label>
                    <Input className="mt-1 h-9" placeholder="Enter contact person" value={customerForm.contactPerson} onChange={e => setCustomerForm({ ...customerForm, contactPerson: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Mobile *</Label>
                    <Input className="mt-1 h-9" placeholder="Enter mobile number" value={customerForm.mobile} onChange={e => setCustomerForm({ ...customerForm, mobile: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">WhatsApp</Label>
                    <Input className="mt-1 h-9" placeholder="Enter WhatsApp number" value={customerForm.whatsapp} onChange={e => setCustomerForm({ ...customerForm, whatsapp: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Email *</Label>
                    <Input className="mt-1 h-9" placeholder="Enter email" value={customerForm.email} onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">GST Number *</Label>
                    <Input className="mt-1 h-9" placeholder="Enter GST number" value={customerForm.gstNumber} onChange={e => setCustomerForm({ ...customerForm, gstNumber: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">City *</Label>
                    <Input className="mt-1 h-9" placeholder="Enter city" value={customerForm.city} onChange={e => setCustomerForm({ ...customerForm, city: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs font-medium text-muted-foreground">Billing Address *</Label>
                    <Textarea className="mt-1 h-20" placeholder="Enter billing address" value={customerForm.billingAddress} onChange={e => setCustomerForm({ ...customerForm, billingAddress: e.target.value })} />
                  </div>
                </>
              ) : (
                <>
                  <div className="col-span-2">
                    <Label className="text-xs font-medium text-muted-foreground">Full Name *</Label>
                    <Input className="mt-1 h-9" placeholder="Enter full name" value={customerForm.fullName} onChange={e => setCustomerForm({ ...customerForm, fullName: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Mobile *</Label>
                    <Input className="mt-1 h-9" placeholder="Enter mobile number" value={customerForm.mobile} onChange={e => setCustomerForm({ ...customerForm, mobile: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">WhatsApp</Label>
                    <Input className="mt-1 h-9" placeholder="Enter WhatsApp number" value={customerForm.whatsapp} onChange={e => setCustomerForm({ ...customerForm, whatsapp: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Email</Label>
                    <Input className="mt-1 h-9" placeholder="Enter email" value={customerForm.email} onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">City *</Label>
                    <Input className="mt-1 h-9" placeholder="Enter city" value={customerForm.city} onChange={e => setCustomerForm({ ...customerForm, city: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs font-medium text-muted-foreground">Address *</Label>
                    <Textarea className="mt-1 h-20" placeholder="Enter address" value={customerForm.address} onChange={e => setCustomerForm({ ...customerForm, address: e.target.value })} />
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowAddCustomer(false)}>Cancel</Button>
              <Button size="sm" onClick={handleAddCustomer}>Save Customer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

const invCols = [
  { key: "id", label: "Invoice #", render: (r: any) => <span className="font-mono text-xs font-semibold text-primary">{r.id}</span> },
  { key: "date", label: "Date" },
  { key: "customer", label: "Customer", render: (r: any) => <span className="font-medium">{r.customer}</span> },
  { key: "items", label: "Items" },
  { key: "amount", label: "Amount", render: (r: any) => <span className="tabular-nums">₹{r.amount.toLocaleString("en-IN")}</span> },
  { key: "total", label: "Total", render: (r: any) => <span className="font-semibold tabular-nums">₹{r.total.toLocaleString("en-IN")}</span> },
  { key: "status", label: "Status", render: (r: any) => <StatusBadge status={r.status} /> },
];

const qtCols = [
  { key: "id", label: "Quotation #", render: (r: any) => <span className="font-mono text-xs font-semibold text-primary">{r.id}</span> },
  { key: "date", label: "Date" },
  { key: "customer", label: "Customer", render: (r: any) => <span className="font-medium">{r.customer}</span> },
  { key: "amount", label: "Amount", render: (r: any) => <span className="tabular-nums">₹{r.amount.toLocaleString("en-IN")}</span> },
  { key: "status", label: "Status", render: (r: any) => <StatusBadge status={r.status} /> },
];

const srCols = [
  { key: "id", label: "Return #", render: (r: any) => <span className="font-mono text-xs font-semibold text-primary">{r.id}</span> },
  { key: "date", label: "Date" },
  { key: "customer", label: "Customer", render: (r: any) => <span className="font-medium">{r.customer}</span> },
  { key: "refInvoice", label: "Ref Invoice" },
  { key: "amount", label: "Amount", render: (r: any) => <span className="tabular-nums">₹{r.amount.toLocaleString("en-IN")}</span> },
  { key: "status", label: "Status", render: (r: any) => <StatusBadge status={r.status} /> },
];

const estCols = [
  { key: "id", label: "Estimate #", render: (r: any) => <span className="font-mono text-xs font-semibold text-primary">{r.id}</span> },
  { key: "date", label: "Date" },
  { key: "customer", label: "Customer", render: (r: any) => <span className="font-medium">{r.customer}</span> },
  { key: "amount", label: "Amount (Excl. GST)", render: (r: any) => <span className="tabular-nums">₹{r.amount.toLocaleString("en-IN")}</span> },
  { key: "status", label: "Status", render: (r: any) => <StatusBadge status={r.status} /> },
];

export default function Sales() {
  const [activeTab, setActiveTab] = useState("invoices");
  const [selectedInvoice, setSelectedInvoice] = useState<any>({ data: null, type: "invoices" });

  const getButtonText = (tab: string) => {
    switch (tab) {
      case "invoices": return "New Invoice";
      case "quotations": return "New Quotation";
      case "estimates": return "New Estimate";
      case "returns": return "New Return";
      case "receipts": return "New Receipt";
      case "proforma": return "New Proforma";
      case "obf": return "New OBF";
      case "pricing": return "Add Pricing";
      default: return "New";
    }
  };

  const getDialogTitle = (tab: string) => {
    switch (tab) {
      case "invoices": return "Create Invoice";
      case "quotations": return "Create Quotation";
      case "estimates": return "Create Estimate";
      case "returns": return "Create Sales Return";
      case "receipts": return "Create Receipt";
      case "proforma": return "Create Proforma Invoice";
      case "obf": return "Create Order Booking Form";
      case "pricing": return "Add Customer Pricing";
      default: return "Create";
    }
  };

  const handlePrint = (row: any) => {
    setSelectedInvoice({ data: row, type: activeTab });
  };

  const handleConvertToInvoice = (row: any) => {
    console.log("Converting quotation to invoice:", row);
    // Here you would typically create a new invoice from the quotation data
    alert(`Converting Quotation ${row.id} to Invoice`);
  };

  const handleCreateEstimate = (row: any) => {
    console.log("Creating estimate from quotation:", row);
    // Here you would typically create an estimate from the quotation data
    alert(`Creating Estimate from Quotation ${row.id}`);
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Sales</h1>
        <p className="text-sm text-muted-foreground">Invoices, quotations, and sales transactions</p>
      </div>
      <Tabs defaultValue="invoices" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <TabsList className="h-9">
            {["invoices", "quotations", "estimates", "returns", "receipts", "proforma", "obf", "pricing"].map(t => (
              <TabsTrigger key={t} value={t} className="text-xs px-3">
                {t === "obf" ? "OBF" : t === "proforma" ? "Proforma / SO" : t === "pricing" ? "Customer Pricing" : t.charAt(0).toUpperCase() + t.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
          <CreateInvoiceModal tabName={activeTab} title={getDialogTitle(activeTab)} trigger={
            <Button size="sm" className="h-9 gap-1"><Plus className="h-3.5 w-3.5" />{getButtonText(activeTab)}</Button>
          } />
        </div>

        <TabsContent value="invoices" className="mt-4"><TxTable data={invoices} cols={invCols} onPrint={handlePrint} /></TabsContent>
        <TabsContent value="quotations" className="mt-4"><TxTable data={quotations} cols={qtCols} onPrint={handlePrint} onConvert={handleConvertToInvoice} /></TabsContent>
        <TabsContent value="estimates" className="mt-4"><TxTable data={quotations} cols={estCols} onPrint={handlePrint} /></TabsContent>
        <TabsContent value="returns" className="mt-4"><TxTable data={salesReturns} cols={srCols} onPrint={handlePrint} /></TabsContent>
        <TabsContent value="receipts" className="mt-4">
          <div className="text-sm text-muted-foreground p-4">No receipts recorded yet.</div>
        </TabsContent>
        <TabsContent value="proforma" className="mt-4">
          <div className="text-sm text-muted-foreground p-4">No proforma invoices / sales orders recorded yet.</div>
        </TabsContent>
        <TabsContent value="obf" className="mt-4">
          <div className="text-sm text-muted-foreground p-4">No order booking forms recorded yet.</div>
        </TabsContent>
        <TabsContent value="pricing" className="mt-4">
          <Card><CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Customer-specific price lists will appear here.</p>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* Print Preview Dialog */}
      {selectedInvoice.data && (
        <InvoicePrintPreview
          invoice={selectedInvoice.data}
          docType={selectedInvoice.type}
          onClose={() => setSelectedInvoice({ data: null, type: "invoices" })}
        />
      )}
    </div>
  );
}
