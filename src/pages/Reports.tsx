import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, BarChart2, FileText, Package, Receipt, TrendingUp, Users, FileCheck, History, Loader2 } from "lucide-react";
import { StatusBadge } from "./Dashboard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import * as XLSX from 'xlsx';

const reportTypes = [
  { key: "daily-sales", icon: BarChart2, title: "Daily Sales Report", desc: "Day-wise sales summary with customer and product breakdown" },
  { key: "inventory", icon: Package, title: "Inventory Report", desc: "Current stock levels, valuation, and movement history" },
  { key: "gst", icon: FileCheck, title: "GST Report", desc: "CGST, SGST, IGST breakdowns for filing" },
  { key: "invoice-ledger", icon: FileText, title: "Invoice Ledger", desc: "Complete list of all invoices with payment status" },
  { key: "expense", icon: Receipt, title: "Expense Summary", desc: "Category-wise expense breakdown and trends" },
  { key: "agent", icon: Users, title: "Agent Commission Report", desc: "Sales agent-wise commission calculation" },
  { key: "outstanding", icon: TrendingUp, title: "Outstanding Report", desc: "Receivable and payable aging analysis" },
  { key: "transaction", icon: History, title: "Transaction History", desc: "Complete transaction log across all modules" },
];

function GSTReport() {
  const [returnFor, setReturnFor] = useState("invoice");
  const [dateRange, setDateRange] = useState("Previous Month");
  const [taxType, setTaxType] = useState("Both");
  const [filterType, setFilterType] = useState("Both");
  const [hsnSearch, setHsnSearch] = useState("");

  const { data: invoices = [], isLoading: invLoading } = useQuery({ 
    queryKey: ["invoices"], 
    queryFn: () => fetch("/api/sales?resource=invoices").then(res => res.json()) 
  });

  const { data: expenses = [], isLoading: expLoading } = useQuery({ 
    queryKey: ["expenses"], 
    queryFn: () => fetch("/api/system?resource=expenses").then(res => res.json()) 
  });

  const isLoading = invLoading || expLoading;

  const handleExport = () => {
    const dataToExport = returnFor === "invoice" ? invoices : expenses;
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "GST Returns");
    XLSX.writeFile(workbook, `GST_Returns_${returnFor}_${new Date().toLocaleDateString()}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 items-end">
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase font-bold text-zinc-500">Tax Return For</Label>
            <Select value={returnFor} onValueChange={setReturnFor}>
              <SelectTrigger className="h-9 bg-zinc-900 border-zinc-800"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="invoice">Invoice</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="sales_return">Sales Return</SelectItem>
                <SelectItem value="purchase_return">Purchase Return</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase font-bold text-zinc-500">Create Date</Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="h-9 bg-zinc-900 border-zinc-800"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Today">Today</SelectItem>
                <SelectItem value="This Month">This Month</SelectItem>
                <SelectItem value="Previous Month">Previous Month</SelectItem>
                <SelectItem value="Custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 col-span-1">
            <Label className="text-[10px] uppercase font-bold text-zinc-500">Tax Type</Label>
            <Select value={taxType} onValueChange={setTaxType}>
              <SelectTrigger className="h-9 bg-zinc-900 border-zinc-800"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Both">Both (GST/Exempt)</SelectItem>
                <SelectItem value="GST">GST Only</SelectItem>
                <SelectItem value="Exempt">Exempt Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase font-bold text-zinc-500">Filter Type</Label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-9 bg-zinc-900 border-zinc-800"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Both">Both</SelectItem>
                <SelectItem value="Local">Local (CGST/SGST)</SelectItem>
                <SelectItem value="Inter">InterState (IGST)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase font-bold text-zinc-500">HSN/SAC</Label>
            <Input className="h-9 bg-zinc-900 border-zinc-800" placeholder="Search HSN..." value={hsnSearch} onChange={e => setHsnSearch(e.target.value)} />
          </div>

          <div className="flex gap-2">
            <Button size="sm" className="h-9 flex-1">Find</Button>
            <Button variant="outline" size="sm" className="h-9 flex-1 gap-1" onClick={handleExport}>
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-800">
        <CardHeader className="pb-2 border-b border-zinc-800 bg-zinc-900/40">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary">GST Return Summary</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Checkbox id="unGroup" />
                <Label htmlFor="unGroup" className="text-[10px] font-medium text-zinc-400">UnGroup HSN</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <Checkbox id="cess" />
                <Label htmlFor="cess" className="text-[10px] font-medium text-zinc-400">CESS</Label>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto min-h-[300px]">
            {isLoading ? (
              <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/20 text-muted-foreground">
                    <th className="text-left px-4 py-3 font-semibold uppercase tracking-tight">Invoice #</th>
                    <th className="text-left px-4 py-3 font-semibold uppercase tracking-tight">Date</th>
                    <th className="text-left px-4 py-3 font-semibold uppercase tracking-tight">Customer</th>
                    <th className="text-right px-4 py-3 font-semibold uppercase tracking-tight">Taxable Amt</th>
                    <th className="text-center px-4 py-3 font-semibold uppercase tracking-tight">GST %</th>
                    <th className="text-right px-4 py-3 font-semibold uppercase tracking-tight">CGST</th>
                    <th className="text-right px-4 py-3 font-semibold uppercase tracking-tight">SGST</th>
                    <th className="text-right px-4 py-3 font-semibold uppercase tracking-tight">Total Tax</th>
                    <th className="text-right px-4 py-3 font-semibold uppercase tracking-tight">Grand Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(returnFor === "invoice" ? invoices : []).map((inv: any) => (
                    <tr key={inv.id} className="border-b border-zinc-900 hover:bg-zinc-800/10 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-primary">{inv.invoiceNo}</td>
                      <td className="px-4 py-3 text-zinc-400">{inv.date}</td>
                      <td className="px-4 py-3 font-bold">{inv.customerName}</td>
                      <td className="px-4 py-3 text-right tabular-nums">₹{parseFloat(inv.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-center"><span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-bold">18%</span></td>
                      <td className="px-4 py-3 text-right text-zinc-500 italic tabular-nums">₹{(parseFloat(inv.tax)/2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-right text-zinc-500 italic tabular-nums">₹{(parseFloat(inv.tax)/2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">₹{parseFloat(inv.tax).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-right font-bold text-zinc-100 tabular-nums">₹{parseFloat(inv.total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                  {((returnFor === "invoice" ? invoices : []).length === 0) && (
                    <tr><td colSpan={9} className="p-20 text-center text-muted-foreground italic">No matching records found for the selected criteria.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InvoiceLedgerReport() {
  const { data: invoices = [], isLoading } = useQuery({ queryKey: ["invoices"], queryFn: () => fetch("/api/sales?resource=invoices").then(res => res.json()) });

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Input type="date" className="h-9 w-36" defaultValue="2024-03-01" />
        <span className="text-muted-foreground text-sm">to</span>
        <Input type="date" className="h-9 w-36" defaultValue="2024-05-31" />
        <Button size="sm">Generate</Button>
        <Button variant="outline" size="sm" className="ml-auto gap-1"><Download className="h-3.5 w-3.5" />Export</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {["Invoice #","Date","Customer","Amount","Status"].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv: any) => (
                  <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-mono text-xs font-semibold text-primary">{inv.invoiceNo}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{inv.date}</td>
                    <td className="px-4 py-2.5 font-medium">{inv.customerName}</td>
                    <td className="px-4 py-2.5 tabular-nums font-semibold">₹{parseFloat(inv.total).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={inv.status} /></td>
                  </tr>
                ))}
                {invoices.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No data found</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Reports() {
  const [active, setActive] = useState<string | null>(null);

  if (active) {
    const report = reportTypes.find(r => r.key === active)!;
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setActive(null)} className="gap-1">← Reports</Button>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-xl font-bold">{report.title}</h1>
        </div>
        {active === "gst" && <GSTReport />}
        {active === "invoice-ledger" && <InvoiceLedgerReport />}
        {!["gst","invoice-ledger"].includes(active) && (
          <div className="space-y-3">
            <Card>
              <CardContent className="p-8 text-center">
                <report.icon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">{report.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{report.desc}</p>
                <Button className="mt-4">Generate Report</Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Reports & Analytics</h1>
        <p className="text-sm text-muted-foreground">Generate business reports with real-time data</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {reportTypes.map(r => (
          <button
            key={r.key}
            onClick={() => setActive(r.key)}
            className="text-left group"
          >
            <Card className="h-full hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer group-hover:bg-primary/5">
              <CardContent className="p-5">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <r.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="font-semibold text-sm">{r.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}
