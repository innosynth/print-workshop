import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IndianRupee, Users, TrendingUp, TrendingDown, AlertTriangle, PackageX, Printer, Loader2, Gauge } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { usePrintSettings } from "@/lib/print-settings-context";
import { QRCodeCanvas } from "qrcode.react";

function StatCard({ title, value, icon: Icon, sub, trend, isLoading }: {
  title: string; value: string; icon: React.ElementType;
  sub?: string; trend?: "up" | "down"; isLoading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{title}</p>
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin mt-2 text-primary/50" />
            ) : (
              <>
                <p className="text-2xl font-bold mt-1 text-foreground">{value}</p>
                {sub && (
                  <p className={`text-xs mt-1 flex items-center gap-1 ${trend === "up" ? "text-primary" : trend === "down" ? "text-destructive" : "text-muted-foreground"}`}>
                    {trend === "up" && <TrendingUp className="h-3 w-3" />}
                    {trend === "down" && <TrendingDown className="h-3 w-3" />}
                    {sub}
                  </p>
                )}
              </>
            )}
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const fmt = (n: number) =>
  "₹" + (n >= 100000 ? (n / 100000).toFixed(1) + "L" : n >= 1000 ? (n / 1000).toFixed(1) + "K" : n);

function InvoicePrintPreview({ invoice, onClose }: { invoice: any, onClose: () => void }) {
  const { settings } = usePrintSettings();
  const [paperSize, setPaperSize] = useState<"A4" | "thermal">(settings.defaultPaperSize);

  const companyInfo = {
    name: "Print Workshop",
    address: "Unit 4, Industrial Estate, Andheri East, Mumbai – 400 093",
    gst: "27AABCC1234D1Z8",
    phone: "022-28349876",
    email: "info@innosynth.org",
    upiId: "innosynth@upi",
  };

  const upiLink = `upi://pay?pa=${companyInfo.upiId}&pn=${encodeURIComponent(companyInfo.name)}&am=${invoice.total}&tn=${invoice.invoiceNo}&cu=INR`;

  const handlePrint = () => {
    window.print();
  };

  const a4Style = `
    @media print {
      @page { size: A4 landscape; margin: 10mm; }
      .no-print { display: none !important; }
      .print-container { width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
      /* Preserve logo colors */
      .print-container .bg-black, .print-container .bg-black * {
        background-color: black !important;
        color: white !important;
      }
    }
  `;

  const thermalStyle = `
    @media print {
      @page { size: ${settings.thermalWidth}mm auto; margin: 5mm; }
      .no-print { display: none !important; }
      .print-container { width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
      .thermal-format { font-size: ${settings.thermalFontSize}px !important; }
      .thermal-format table { font-size: calc(${settings.thermalFontSize}px - 1px) !important; }
      .thermal-format .company-info { font-size: calc(${settings.thermalFontSize}px - 1px) !important; }
      .thermal-format .invoice-header { font-size: calc(${settings.thermalFontSize}px + 1px) !important; }
      /* Preserve logo colors */
      .print-container .bg-black, .print-container .bg-black * {
        background-color: black !important;
        color: white !important;
      }
    }
  `;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <style>{paperSize === "A4" ? a4Style : thermalStyle}</style>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Invoice Print Preview - {invoice.invoiceNo}</span>
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
          <div className={`border-2 border-black ${paperSize === "thermal" ? "p-2" : "p-4"}`}
            style={paperSize === "thermal"
              ? { maxWidth: `${settings.thermalWidth}px`, margin: "0 auto", fontSize: `${settings.thermalFontSize}px` }
              : { fontSize: `${settings.a4FontSize}px` }}>
            <div className="text-center mb-2 company-info">
              <h2 className={`${paperSize === "thermal" ? "text-sm" : "text-xl"} font-bold`}>{companyInfo.name}</h2>
              <p className={`${paperSize === "thermal" ? "text-xs" : "text-sm"}`}>{companyInfo.address}</p>
              <p className={`${paperSize === "thermal" ? "text-xs" : "text-sm"}`}>GST: {companyInfo.gst} | Phone: {companyInfo.phone}</p>
              <p className={`${paperSize === "thermal" ? "text-xs" : "text-sm"}`}>Email: {companyInfo.email}</p>
            </div>

            <div className="flex justify-between items-start mb-2 invoice-header">
              <div>
                <h3 className={`${paperSize === "thermal" ? "text-xs" : "text-lg"} font-bold`}>TAX INVOICE</h3>
                <p className={`${paperSize === "thermal" ? "text-xs" : "text-sm"}`}>Invoice #: {invoice.invoiceNo}</p>
                <p className={`${paperSize === "thermal" ? "text-xs" : "text-sm"}`}>Date: {invoice.date}</p>
              </div>
              <div className="text-right">
                <p className={`${paperSize === "thermal" ? "text-xs" : "text-sm"} font-semibold`}>Customer: {invoice.customerName || invoice.customer}</p>
              </div>
            </div>

            <table className={`w-full border-collapse border border-black mb-2 ${paperSize === "thermal" ? "text-xs" : ""}`}>
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-black p-1 text-left">SL#</th>
                  <th className="border border-black p-1 text-left">Description</th>
                  <th className="border border-black p-1 text-center">Qty</th>
                  <th className="border border-black p-1 text-right">Rate</th>
                  <th className="border border-black p-1 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black p-1 text-center">1</td>
                  <td className="border border-black p-1">Print Services</td>
                  <td className="border border-black p-1 text-center">{invoice.items || 1}</td>
                  <td className="border border-black p-1 text-right">₹{parseFloat(invoice.amount).toLocaleString("en-IN")}</td>
                  <td className="border border-black p-1 text-right">₹{parseFloat(invoice.amount).toLocaleString("en-IN")}</td>
                </tr>
              </tbody>
            </table>

            <div className="flex justify-end">
              <div className="w-full">
                <div className="flex justify-between py-1">
                  <span className={paperSize === "thermal" ? "text-xs" : "text-sm"}>Subtotal:</span>
                  <span className={`${paperSize === "thermal" ? "text-xs" : "text-sm"} font-semibold`}>₹{parseFloat(invoice.amount).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className={paperSize === "thermal" ? "text-xs" : "text-sm"}>Tax:</span>
                  <span className={`${paperSize === "thermal" ? "text-xs" : "text-sm"} font-semibold`}>₹{parseFloat(invoice.tax).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between py-1 border-t-2 border-black mt-1 pt-1">
                  <span className={paperSize === "thermal" ? "text-sm font-bold" : "font-bold"}>Total:</span>
                  <span className={paperSize === "thermal" ? "text-sm font-bold" : "font-bold"}>₹{parseFloat(invoice.total).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-black">
              {paperSize === "A4" && (
                <div className="flex justify-center mb-4">
                  <div className="text-center">
                    <QRCodeCanvas
                      value={upiLink}
                      size={128}
                      level="H"
                      includeMargin={true}
                      className="border-2 border-black p-1"
                    />
                    <p className="text-xs mt-2 font-semibold">Scan to Pay ₹{parseFloat(invoice.total).toLocaleString("en-IN")}</p>
                    <p className="text-[10px] text-muted-foreground">UPI: {companyInfo.upiId}</p>
                  </div>
                </div>
              )}
              <div className="text-center">
                <p className={paperSize === "thermal" ? "text-[10px]" : "text-xs"}>Thank you for your business!</p>
                <p className={`${paperSize === "thermal" ? "text-[10px]" : "text-xs"} mt-1`}>This is a computer-generated invoice.</p>
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

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/system?resource=dashboard");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  const { data: recentInvoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["recent-invoices"],
    queryFn: async () => {
      const res = await fetch("/api/sales?resource=invoices");
      if (!res.ok) throw new Error("Failed to fetch invoices");
      return (await res.json()).slice(0, 5);
    },
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch("/api/core?resource=products");
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
  });

  const lowStock = Array.isArray(products) ? products.filter((p: any) => p.stock > 0 && p.stock < p.minStock) : [];
  const outOfStock = Array.isArray(products) ? products.filter((p: any) => p.stock === 0) : [];
  const invoicesList = Array.isArray(recentInvoices) ? recentInvoices : [];
  
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const handlePrintClick = (invoice: any) => {
    setSelectedInvoice(invoice);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Sales" value={fmt(stats?.todaySales || 0)} icon={IndianRupee} sub="+8.2% vs yesterday" trend="up" isLoading={statsLoading} />
        <StatCard title="Total Sales" value={fmt(stats?.totalSales || 0)} icon={TrendingUp} sub="Lifetime revenue" isLoading={statsLoading} />
        <StatCard title="Active Customers" value={String(stats?.activeCustomers || 0)} icon={Users} sub="Total registered" isLoading={statsLoading} />
        <div className="p-5 rounded-xl bg-primary/10 border border-primary/20 flex flex-col justify-between group cursor-pointer hover:bg-primary/15 transition-all shadow-lg shadow-primary/5" onClick={() => window.location.href='/meter-readings'}>
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Quick Action</p>
            <Gauge className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2">
            <p className="text-sm font-bold text-foreground">Log Meter Reading</p>
            <p className="text-[10px] text-muted-foreground">Record daily machine counters</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Receivable Outstanding</p>
            <p className="text-2xl font-bold text-foreground mt-1">₹0</p>
            <p className="text-xs text-muted-foreground mt-1 text-primary">Live data synced</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-destructive">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Payable Outstanding</p>
            <p className="text-2xl font-bold text-foreground mt-1">₹0</p>
            <p className="text-xs text-muted-foreground mt-1 text-destructive">Live data synced</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Low Stock Alerts ({lowStock.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="min-h-[150px] flex flex-col">
              {productsLoading ? (
                <div className="flex-1 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Product</th>
                      <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStock.map((p: any) => (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-2.5 font-medium">{p.name}</td>
                        <td className="px-4 py-2.5 text-right text-yellow-600 font-semibold">{p.stock}</td>
                      </tr>
                    ))}
                    {lowStock.length === 0 && (
                      <tr><td colSpan={2} className="px-4 py-8 text-center text-muted-foreground">No low stock items</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PackageX className="h-4 w-4 text-destructive" />
              Out of Stock ({outOfStock.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             <div className="min-h-[150px] flex flex-col">
              {productsLoading ? (
                <div className="flex-1 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Product</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outOfStock.map((p: any) => (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-2.5 font-medium">{p.name}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{p.category}</td>
                      </tr>
                    ))}
                    {outOfStock.length === 0 && (
                      <tr><td colSpan={2} className="px-4 py-8 text-center text-muted-foreground">No out of stock items</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             <div className="min-h-[150px] flex flex-col">
              {invoicesLoading ? (
                <div className="flex-1 flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      {["Invoice #", "Date", "Customer", "Amount", "Status", "Action"].map(h => (
                        <th key={h} className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {invoicesList.map((inv: any) => (
                      <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-2.5 font-mono text-xs font-semibold text-primary">{inv.invoiceNo}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{inv.date}</td>
                        <td className="px-4 py-2.5 font-medium">{inv.customerName || "—"}</td>
                        <td className="px-4 py-2.5 font-semibold">₹{parseFloat(inv.total).toLocaleString("en-IN")}</td>
                        <td className="px-4 py-2.5"><StatusBadge status={inv.status} /></td>
                        <td className="px-4 py-2.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 text-xs"
                            onClick={() => handlePrintClick(inv)}
                          >
                            <Printer className="h-3.5 w-3.5" />Print
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {invoicesList.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No recent invoices</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedInvoice && (
        <InvoicePrintPreview
          invoice={selectedInvoice}
          onClose={() => {
            setSelectedInvoice(null);
          }}
        />
      )}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Paid: "bg-primary/10 text-primary border-primary/20",
    Pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    Cancelled: "bg-destructive/10 text-destructive border-destructive/20",
    Partial: "bg-blue-100 text-blue-700 border-blue-200",
    Draft: "bg-muted text-muted-foreground border-border",
    Active: "bg-primary/10 text-primary border-primary/20",
    Inactive: "bg-muted text-muted-foreground border-border",
    Approved: "bg-primary/10 text-primary border-primary/20",
    Invoiced: "bg-blue-100 text-blue-700 border-blue-200",
    Quoted: "bg-purple-100 text-purple-700 border-purple-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${map[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}
