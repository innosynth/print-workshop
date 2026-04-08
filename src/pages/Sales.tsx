import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Search, Plus, Trash2, Printer, Loader2 } from "lucide-react";
import { StatusBadge } from "./Dashboard";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { usePrintSettings } from "@/lib/print-settings-context";
import { QRCodeCanvas } from "qrcode.react";

function InvoicePrintPreview({ invoice, onClose, docType }: { invoice: any, onClose: () => void, docType?: string }) {
  const { settings } = usePrintSettings();
  const [paperSize, setPaperSize] = useState<"A4" | "thermal">(settings.defaultPaperSize);

  const { data: settingsData } = useQuery({
    queryKey: ["settings"],
    queryFn: () => fetch("/api/core?resource=settings").then(res => res.json())
  });

  const { data: qrs = [] } = useQuery({
    queryKey: ["payment_qrs"],
    queryFn: () => fetch("/api/core?resource=payment_qrs").then(res => res.json())
  });

  const activeQr = qrs.find((qr: any) => 
    docType === "invoices" ? qr.isActiveForInvoice : qr.isActiveForEstimate
  );

  const profile = settingsData?.profile || {
    name: "Print Workshop",
    slogan: "Innovation in Impression",
    address: "No.68, Sarojini Road, Sidhapudur, Coimbatore-44",
    gst: "33AAZFP8345G1ZN",
    phone: "+91 84352 66666",
    email: "aprintworkshop@gmail.com",
    bankName: "ICICI Bank",
    accountNumber: "730705000264",
    ifscCode: "ICIC0007307"
  };

  const amount = parseFloat(invoice.amount || 0);
  const total = parseFloat(invoice.total || amount);
  const taxRate = 18; // Default 18%
  const taxableAmount = total / (1 + taxRate / 100);
  const totalTax = total - taxableAmount;
  const cgst = totalTax / 2;
  const sgst = totalTax / 2;

  const handlePrint = () => {
    window.print();
  };

  const a4Style = `
    @media print {
      @page { size: A4; margin: ${settings.a4Margin}mm; }
      body { -webkit-print-color-adjust: exact; }
      .no-print { display: none !important; }
      .print-container { width: 100% !important; max-width: none !important; color: black !important; }
      .text-primary-print { color: #000 !important; }
      .bg-muted-print { background-color: #f3f4f6 !important; }
    }
  `;

  const thermalStyle = `
    @media print {
      @page { size: ${settings.thermalWidth}mm auto; margin: ${settings.thermalMargin}mm; }
      .no-print { display: none !important; }
      .print-container { width: 100% !important; max-width: none !important; color: black !important; }
      .thermal-format { font-size: ${settings.thermalFontSize}px !important; }
    }
  `;

  const docTitle = docType === "estimates" ? "ESTIMATE" : docType === "quotations" ? "QUOTATION" : "TAX INVOICE";

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto bg-white p-0">
        <style>{paperSize === "A4" ? a4Style : thermalStyle}</style>
        
        <div className="p-4 border-b flex items-center justify-between no-print sticky top-0 bg-white z-10">
          <span className="font-bold">{docTitle} Preview - {invoice.invoiceNo || "Draft"}</span>
          <div className="flex gap-2">
            <Button variant={paperSize === "A4" ? "default" : "outline"} size="sm" onClick={() => setPaperSize("A4")}>A4 Paper</Button>
            <Button variant={paperSize === "thermal" ? "default" : "outline"} size="sm" onClick={() => setPaperSize("thermal")}>Thermal POS</Button>
            <Separator orientation="vertical" className="h-8 mx-2" />
            <Button onClick={handlePrint} className="gap-2"><Printer className="h-4 w-4" /> Print Document</Button>
          </div>
        </div>

        <div className={`print-container p-8 mx-auto ${paperSize === "thermal" ? "max-w-[300px] thermal-format p-4" : "max-w-[800px]"}`}>
          {paperSize === "A4" ? (
            <div className="space-y-6" style={{ fontSize: `${settings.a4FontSize}px` }}>
              {/* A4 Header */}
              <div className="flex justify-between items-start border-b-2 border-black pb-4">
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center text-white font-bold text-2xl">PW</div>
                  <div>
                    <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">{profile.name}</h1>
                    <p className="text-[10px] font-bold text-gray-600 uppercase mt-1 italic">{profile.slogan}</p>
                    <p className="text-[10px] font-bold text-black uppercase">DIGITAL PRINTING</p>
                  </div>
                </div>
                <div className="text-right space-y-0.5 text-[10px] font-bold">
                  <p className="flex justify-end gap-2 items-center"><span className="text-gray-500">📞</span> {profile.phone}</p>
                  <p className="flex justify-end gap-2 items-center"><span className="text-gray-500">✉️</span> {profile.email}</p>
                  <div className="flex justify-end gap-2 items-start max-w-[200px] mt-1 leading-tight">
                    <span className="text-gray-500">📍</span> 
                    <span>{profile.address}</span>
                  </div>
                </div>
              </div>

              {/* Title Strip */}
              <div className="bg-gray-50 border-y border-black py-1.5 text-center">
                <h2 className="text-lg font-black tracking-[0.2em]">{docTitle}</h2>
              </div>

              {/* Billing Info */}
              <div className="grid grid-cols-2 gap-8 text-[11px]">
                <div className="space-y-1">
                  <p className="font-bold text-gray-500 uppercase tracking-widest text-[9px]">To :</p>
                  <p className="text-sm font-black">{invoice.customerName || "Walk-in Customer"}</p>
                  <p className="text-gray-600">COIMBATORE</p>
                  <p className="mt-2 text-[10px] font-bold">GSTIN : {invoice.customerGst || "N/A"}</p>
                  <p className="text-[10px] font-bold">State & Code:</p>
                </div>
                <div className="space-y-1 text-right">
                  <div className="flex justify-end gap-2">
                    <span className="text-gray-500 uppercase text-[9px] font-bold">Invoice No :</span>
                    <span className="font-bold w-24 text-left">{invoice.invoiceNo || "DRAFT"}</span>
                  </div>
                  <div className="flex justify-end gap-2">
                    <span className="text-gray-500 uppercase text-[9px] font-bold">Invoice Date :</span>
                    <span className="font-bold w-24 text-left">{invoice.date || new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-end gap-2">
                    <span className="text-gray-500 uppercase text-[9px] font-bold">PO No :</span>
                    <span className="font-bold w-24 text-left">-</span>
                  </div>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-tight">GSTIN : <span className="text-sm">{profile.gst}</span></p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full border-collapse border border-black text-[10px]">
                <thead className="bg-gray-100 font-bold uppercase">
                  <tr>
                    <th className="border border-black px-1 py-1 w-8 text-center">S.No</th>
                    <th className="border border-black px-2 py-1 text-left">Description</th>
                    <th className="border border-black px-1 py-1 w-12 text-center">HSN</th>
                    <th className="border border-black px-1 py-1 w-10 text-center">QTY</th>
                    <th className="border border-black px-1 py-1 w-16 text-right">RATE (₹)</th>
                    <th className="border border-black px-1 py-1 w-10 text-center">CGST %</th>
                    <th className="border border-black px-1 py-1 w-16 text-right">CGST Amt(₹)</th>
                    <th className="border border-black px-1 py-1 w-10 text-center">SGST %</th>
                    <th className="border border-black px-1 py-1 w-16 text-right">SGST Amt(₹)</th>
                    <th className="border border-black px-2 py-1 w-20 text-right">AMOUNT</th>
                  </tr>
                </thead>
                <tbody className="font-medium">
                  {invoice.items?.map((item: any, i: number) => (
                    <tr key={i}>
                      <td className="border border-black px-1 py-1 text-center">{i + 1}</td>
                      <td className="border border-black px-2 py-1 font-bold">{item.name || "Custom Service"}</td>
                      <td className="border border-black px-1 py-1 text-center">4909</td>
                      <td className="border border-black px-1 py-1 text-center">{item.qty || 1}.00</td>
                      <td className="border border-black px-1 py-1 text-right">{(item.rate || 0).toFixed(2)}</td>
                      <td className="border border-black px-1 py-1 text-center">9.00</td>
                      <td className="border border-black px-1 py-1 text-right">{(item.amount * 0.09).toFixed(2)}</td>
                      <td className="border border-black px-1 py-1 text-center">9.00</td>
                      <td className="border border-black px-1 py-1 text-right">{(item.amount * 0.09).toFixed(2)}</td>
                      <td className="border border-black px-2 py-1 text-right font-bold">{parseFloat(item.amount || 0).toFixed(2)}</td>
                    </tr>
                  )) || (
                    <tr className="min-h-[100px]">
                      <td className="border border-black px-1 py-6 text-center">1</td>
                      <td className="border border-black px-2 py-6 font-bold">DIGITAL PRINTING SERVICES</td>
                      <td className="border border-black px-1 py-6 text-center">4909</td>
                      <td className="border border-black px-1 py-6 text-center">1.00</td>
                      <td className="border border-black px-1 py-6 text-right">{taxableAmount.toFixed(2)}</td>
                      <td className="border border-black px-1 py-6 text-center">9.00</td>
                      <td className="border border-black px-1 py-6 text-right">{cgst.toFixed(2)}</td>
                      <td className="border border-black px-1 py-6 text-center">9.00</td>
                      <td className="border border-black px-1 py-6 text-right">{sgst.toFixed(2)}</td>
                      <td className="border border-black px-2 py-6 text-right font-bold">{total.toFixed(2)}</td>
                    </tr>
                  )}
                  {/* Empty rows to maintain height */}
                  {[...Array(5)].map((_, i) => (
                    <tr key={i} className="h-6">
                      <td className="border border-black"></td><td className="border border-black"></td><td className="border border-black"></td>
                      <td className="border border-black"></td><td className="border border-black"></td><td className="border border-black"></td>
                      <td className="border border-black"></td><td className="border border-black"></td><td className="border border-black"></td>
                      <td className="border border-black"></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* A4 Footer */}
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-4 space-y-4">
                  <div className="text-[10px]">
                    <p className="font-black border-b border-black mb-1 w-fit uppercase">Bank Details</p>
                    <div className="grid grid-cols-2 gap-x-2">
                       <span className="text-gray-500">Account Name</span><span className="font-bold">: {profile.accountName || profile.name}</span>
                       <span className="text-gray-500">Bank</span><span className="font-bold">: {profile.bankName}</span>
                       <span className="text-gray-500">Branch</span><span className="font-bold">: {profile.bankBranch}</span>
                       <span className="text-gray-500">A/C No</span><span className="font-bold">: {profile.accountNumber}</span>
                       <span className="text-gray-500">IFSC Code</span><span className="font-bold">: {profile.ifscCode}</span>
                    </div>
                  </div>
                  <p className="text-[10px] font-black uppercase mt-4">THANK YOU FOR YOUR BUSINESS</p>
                </div>

                <div className="col-span-4 flex flex-col items-center justify-center">
                   {activeQr ? (
                      <div className="text-center">
                        <img src={activeQr.imageUrl} className="h-20 w-20 border border-black p-1" alt="Payment QR" />
                        <p className="text-[9px] font-black uppercase mt-1 tracking-widest">SCAN & PAY</p>
                      </div>
                   ) : (
                      <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-[8px] text-gray-400 text-center">QR CODE<br/>PENDING</div>
                   )}
                </div>

                <div className="col-span-4">
                  <table className="w-full text-[11px] font-bold">
                    <tbody>
                      <tr className="border border-black">
                        <td className="px-2 py-1 text-gray-500">Sub Total</td>
                        <td className="px-2 py-1 text-right font-black">₹{taxableAmount.toFixed(2)}</td>
                      </tr>
                      <tr className="border border-black">
                        <td className="px-2 py-1 text-gray-500">CGST 9 %</td>
                        <td className="px-2 py-1 text-right font-black">₹{cgst.toFixed(2)}</td>
                      </tr>
                      <tr className="border border-black">
                        <td className="px-2 py-1 text-gray-500">SGST 9 %</td>
                        <td className="px-2 py-1 text-right font-black">₹{sgst.toFixed(2)}</td>
                      </tr>
                      <tr className="border border-black bg-gray-50 font-black">
                        <td className="px-2 py-1 text-gray-900 text-xs">Grand Total</td>
                        <td className="px-2 py-1 text-right text-sm">₹{total.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-[8px] text-right mt-2 text-gray-500">This is computer generated document signature not required</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-1 text-center font-sans tracking-tight leading-tight" style={{ fontSize: `${settings.thermalFontSize}px` }}>
              {/* Thermal Format Header */}
              <div className="mb-2">
                <h1 className="text-2xl font-black">{profile.name}</h1>
                <p className="text-[10px] font-medium leading-none">( {profile.slogan} )</p>
                <p className="text-[10px] mt-1">{profile.address}</p>
                <p className="text-[10px]">Call @ {profile.phone}</p>
                <p className="text-[10px]"><span className="font-bold">Mail :</span> {profile.email}</p>
                <h2 className="text-xs font-bold mt-1 uppercase underline">{docTitle}</h2>
              </div>
              
              <div className="text-[10px] py-0.5 border-t border-dashed border-black">
                <div className="flex justify-between font-bold">
                  <span>No.{invoice.invoiceNo || "7118"}</span>
                  <span>Date: {invoice.date || "31-03-2026"}</span>
                </div>
                <div className="text-left font-bold">
                  C.ID : {invoice.customerName || "Sri Saraswathy Printers"}
                </div>
              </div>

              <div className="border-t border-dashed border-black pt-1">
                <table className="w-full text-[10px]">
                  <thead className="font-bold">
                    <tr className="text-left border-b border-dashed border-black">
                      <th className="py-1">Product Name</th>
                      <th className="text-right py-1">Qty</th>
                      <th className="text-right py-1">Rate</th>
                      <th className="text-right py-1">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="font-medium pt-1">
                    {invoice.items?.map((item: any, i: number) => (
                      <tr key={i} className="align-top">
                        <td className="text-left py-1 uppercase">{item.name}</td>
                        <td className="text-right py-1">{item.qty}</td>
                        <td className="text-right py-1">{item.rate}</td>
                        <td className="text-right py-1">{item.amount.toFixed(2)}</td>
                      </tr>
                    )) || (
                      <>
                        <tr className="align-top">
                          <td className="text-left py-1 uppercase font-bold">SYNTHETIC</td>
                          <td className="text-right py-1">1</td>
                          <td className="text-right py-1">30</td>
                          <td className="text-right py-1">30.00</td>
                        </tr>
                        <tr className="align-top">
                          <td className="text-left py-1 uppercase font-bold">LASER B/W PRINT</td>
                          <td className="text-right py-1">7</td>
                          <td className="text-right py-1">2</td>
                          <td className="text-right py-1">14.00</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-dashed border-black py-2 space-y-1">
                <div className="text-left font-bold text-[11px]">
                   <p>Total Items : {invoice.items?.length || 2}</p>
                   <div className="flex justify-between items-center">
                     <span>Total Qty : {invoice.items?.reduce((a:any, b:any)=> a + b.qty, 0) || 8}</span>
                     <span className="text-sm font-black">Total: {total.toFixed(2)}</span>
                   </div>
                </div>
              </div>

              <div className="border-t border-dashed border-black pt-2 flex flex-col items-center gap-1">
                {/* Barcode Placeholder */}
                <div className="w-32 h-8 bg-zinc-200 flex items-center justify-center relative overflow-hidden">
                   <div className="flex gap-[1px] w-full h-full p-2 bg-white">
                     {[...Array(20)].map((_, i) => (
                       <div key={i} className="flex-1 bg-black" style={{ width: `${Math.random() * 2 + 1}px` }}></div>
                     ))}
                   </div>
                </div>
                <div className="w-full text-left font-bold text-[9px] space-y-0.5 mt-1">
                   <p>File :</p>
                   <p>User :admin | Time : {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/:/g, '.')}</p>
                </div>
                <div className="space-y-0.5">
                   <p className="font-bold text-[10px]">{profile.website}</p>
                   <p className="font-black text-[11px] uppercase">Thank For Your Business</p>
                </div>
                {activeQr && (
                   <img src={activeQr.imageUrl} className="h-20 w-20 border border-black p-1 mt-1" alt="QA" />
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TxTable({ data, cols, isLoading, onPrint, onConvert }: { 
  data: any[]; cols: any[]; isLoading?: boolean; onPrint?: (row: any) => void; onConvert?: (row: any) => void 
}) {
  const [search, setSearch] = useState("");
  const filtered = (data || []).filter(row =>
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
          <div className="overflow-auto min-h-[200px] flex flex-col">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
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
                                Convert
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={cols.length + 1} className="px-4 py-8 text-center text-muted-foreground">No records found</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">{filtered.length} records</p>
    </div>
  );
}

export default function Sales() {
  const [activeTab, setActiveTab] = useState("invoices");
  const [selectedInvoice, setSelectedInvoice] = useState<any>({ data: null, type: "invoices" });

  const { data: invoices = [], isLoading: invLoading } = useQuery({ queryKey: ["invoices"], queryFn: () => fetch("/api/sales?resource=invoices").then(res => res.json()) });
  const { data: quotations = [], isLoading: qtLoading } = useQuery({ queryKey: ["quotations"], queryFn: () => fetch("/api/sales?resource=quotations").then(res => res.json()) });
  const { data: returns = [], isLoading: srLoading } = useQuery({ queryKey: ["returns"], queryFn: () => fetch("/api/sales?resource=returns").then(res => res.json()) });

  const invCols = [
    { key: "invoiceNo", label: "Invoice #", render: (r: any) => <span className="font-mono text-xs font-semibold text-primary">{r.invoiceNo}</span> },
    { key: "date", label: "Date" },
    { key: "customerName", label: "Customer", render: (r: any) => <span className="font-medium">{r.customerName}</span> },
    { key: "total", label: "Total", render: (r: any) => <span className="font-semibold tabular-nums">₹{parseFloat(r.total).toLocaleString("en-IN")}</span> },
    { key: "status", label: "Status", render: (r: any) => <StatusBadge status={r.status} /> },
  ];

  const qtCols = [
    { key: "quotationNo", label: "Quotation #", render: (r: any) => <span className="font-mono text-xs font-semibold text-primary">{r.quotationNo}</span> },
    { key: "date", label: "Date" },
    { key: "customerName", label: "Customer", render: (r: any) => <span className="font-medium">{r.customerName}</span> },
    { key: "amount", label: "Amount", render: (r: any) => <span className="tabular-nums">₹{parseFloat(r.amount).toLocaleString("en-IN")}</span> },
    { key: "status", label: "Status", render: (r: any) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Sales</h1>
        <p className="text-sm text-muted-foreground">Invoices, quotations, and sales transactions</p>
      </div>
      <Tabs defaultValue="invoices" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <TabsList className="h-12 flex-wrap gap-2 bg-transparent">
            {[
              { id: "invoices", label: "Invoices" },
              { id: "quotations", label: "Quotations" },
              { id: "estimates", label: "Estimates" },
              { id: "returns", label: "Returns" },
              { id: "receipts", label: "Receipts" },
              { id: "proforma", label: "Proforma / SO" },
              { id: "obf", label: "OBF" },
              { id: "pricing", label: "Customer Pricing" }
            ].map(t => (
              <TabsTrigger key={t.id} value={t.id} className="text-xs px-5 h-10 font-black uppercase tracking-tight data-[state=active]:bg-primary/10 data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary transition-all">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <Button size="sm" className="h-9 gap-1 shadow-lg shadow-primary/20">
            <Plus className="h-3.5 w-3.5" />New {activeTab.slice(0, -1)}
          </Button>
        </div>

        <TabsContent value="invoices" className="mt-4">
          <TxTable data={invoices} cols={invCols} isLoading={invLoading} onPrint={(r) => setSelectedInvoice({ data: r, type: "invoices" })} />
        </TabsContent>
        <TabsContent value="quotations" className="mt-4">
          <TxTable data={quotations} cols={qtCols} isLoading={qtLoading} onPrint={(r) => setSelectedInvoice({ data: r, type: "quotations" })} />
        </TabsContent>
        <TabsContent value="estimates" className="mt-4">
          <TxTable data={invoices.filter((i:any) => i.status === 'Draft')} cols={invCols} isLoading={invLoading} onPrint={(r) => setSelectedInvoice({ data: r, type: "estimates" })} />
        </TabsContent>
        <TabsContent value="returns" className="mt-4">
          <TxTable data={returns} cols={qtCols} isLoading={srLoading} />
        </TabsContent>
        <TabsContent value="receipts" className="mt-4">
          <div className="p-20 text-center text-muted-foreground border-2 border-dashed border-zinc-800 rounded-xl">No receipts recorded today</div>
        </TabsContent>
        <TabsContent value="proforma" className="mt-4">
          <div className="p-20 text-center text-muted-foreground border-2 border-dashed border-zinc-800 rounded-xl">No active Proforma / Sales Orders</div>
        </TabsContent>
        <TabsContent value="obf" className="mt-4">
          <div className="p-20 text-center text-muted-foreground border-2 border-dashed border-zinc-800 rounded-xl">Order Booking Forms (OBF) summary</div>
        </TabsContent>
        <TabsContent value="pricing" className="mt-4">
          <div className="p-20 text-center text-muted-foreground border-2 border-dashed border-zinc-800 rounded-xl">Special customer pricing matrix</div>
        </TabsContent>
      </Tabs>

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
