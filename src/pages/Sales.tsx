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
import { usePrintSettings } from "@/lib/print-settings-context";
import { QRCodeCanvas } from "qrcode.react";

function InvoicePrintPreview({ invoice, onClose, docType }: { invoice: any, onClose: () => void, docType?: string }) {
  const { settings } = usePrintSettings();
  const [paperSize, setPaperSize] = useState<"A4" | "thermal">(settings.defaultPaperSize);

  const { data: qrs = [] } = useQuery({
    queryKey: ["payment_qrs"],
    queryFn: () => fetch("/api/core?resource=payment_qrs").then(res => res.json())
  });

  const activeQr = qrs.find((qr: any) => 
    docType === "invoices" ? qr.isActiveForInvoice : qr.isActiveForEstimate
  );

  const companyInfo = {
    name: "InnoSynth Print Workshop",
    address: "Unit 4, Industrial Estate, Andheri East, Mumbai – 400 093",
    gst: "27AABCC1234D1Z8",
    phone: "022-28349876",
    email: "info@innosynth.org",
  };

  const amount = parseFloat(invoice.amount || 0);
  const total = parseFloat(invoice.total || amount);

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
    }
  `;

  const docTitle = docType === "estimates" ? "ESTIMATE" : docType === "quotations" ? "QUOTATION" : "TAX INVOICE";
  const showGST = docType !== "estimates";

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <style>{paperSize === "A4" ? a4Style : thermalStyle}</style>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{docTitle} Print Preview - {invoice.invoiceNo || invoice.quotationNo || invoice.id}</span>
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
                Thermal
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className={`print-container ${paperSize === "thermal" ? "thermal-format" : ""}`}>
          <div className="border-2 border-black p-4"
            style={paperSize === "thermal"
              ? { width: "300px", margin: "0 auto", fontSize: `${settings.thermalFontSize}px` }
              : { fontSize: `${settings.a4FontSize}px` }}>
            <div className="text-center mb-3">
              <h2 className="text-lg font-bold">{companyInfo.name}</h2>
              <p className="text-xs">{companyInfo.address}</p>
              <p className="text-xs">{showGST ? `GST: ${companyInfo.gst} | ` : ''}Phone: {companyInfo.phone}</p>
            </div>

            <div className="mb-3 text-center">
              <h3 className="font-bold">{docTitle}</h3>
              <p className="text-xs">No: {invoice.invoiceNo || invoice.quotationNo || invoice.id}</p>
              <p className="text-xs">Date: {invoice.date}</p>
              <p className="font-semibold mt-1">Customer: {invoice.customerName}</p>
            </div>

            <table className="w-full border-collapse border border-black mb-3">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black px-1 text-xs">SL</th>
                  <th className="border border-black px-1 text-left text-xs">Description</th>
                  <th className="border border-black px-1 text-right text-xs">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black px-1 text-center text-xs">1</td>
                  <td className="border border-black px-1 text-xs">Services</td>
                  <td className="border border-black px-1 text-right text-xs">₹{amount.toLocaleString("en-IN")}</td>
                </tr>
              </tbody>
            </table>

            <div className="flex justify-between items-end">
              <div>
                {activeQr && (
                  <div className="flex flex-col items-center">
                    <img src={activeQr.imageUrl} className="h-24 w-24 border border-black p-1" alt="Payment QR" />
                    <p className="text-[8px] mt-0.5 uppercase font-bold">Scan to Pay</p>
                  </div>
                )}
              </div>
              <div className="w-full max-w-[150px]">
                <div className="flex justify-between text-xs">
                  <span>Total:</span>
                  <span className="font-bold">₹{total.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4 no-print">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button onClick={handlePrint}><Printer className="h-4 w-4 mr-2" />Print</Button>
          </div>
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
          <TabsList className="h-9">
            {["invoices", "quotations", "returns"].map(t => (
              <TabsTrigger key={t} value={t} className="text-xs px-3">
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
          <Button size="sm" className="h-9 gap-1"><Plus className="h-3.5 w-3.5" />New {activeTab.slice(0, -1)}</Button>
        </div>

        <TabsContent value="invoices" className="mt-4"><TxTable data={invoices} cols={invCols} isLoading={invLoading} onPrint={(r) => setSelectedInvoice({ data: r, type: "invoices" })} /></TabsContent>
        <TabsContent value="quotations" className="mt-4"><TxTable data={quotations} cols={qtCols} isLoading={qtLoading} onPrint={(r) => setSelectedInvoice({ data: r, type: "quotations" })} /></TabsContent>
        <TabsContent value="returns" className="mt-4"><TxTable data={returns} cols={qtCols} isLoading={srLoading} /></TabsContent>
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
