import { useState } from "react";
import { invoices, products, expenses } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Download, BarChart2, FileText, Package, Receipt, TrendingUp, Users, FileCheck, History } from "lucide-react";
import { StatusBadge } from "./Dashboard";

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
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Input type="date" className="h-9 w-36" defaultValue="2024-03-01" />
        <span className="text-muted-foreground text-sm">to</span>
        <Input type="date" className="h-9 w-36" defaultValue="2024-03-31" />
        <Button size="sm">Generate</Button>
        <Button variant="outline" size="sm" className="ml-auto gap-1"><Download className="h-3.5 w-3.5" />Export</Button>
      </div>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">GST Summary – March 2024</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {["Invoice #","Date","Customer","Taxable Amt","CGST (9%)","SGST (9%)","IGST","Total Tax","Invoice Total"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.slice(0, 10).map(inv => {
                const cgst = Math.round(inv.tax / 2);
                const sgst = inv.tax - cgst;
                return (
                  <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-mono text-xs font-semibold text-primary">{inv.id}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{inv.date}</td>
                    <td className="px-4 py-2.5 font-medium">{inv.customer}</td>
                    <td className="px-4 py-2.5 tabular-nums">₹{inv.amount.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5 tabular-nums">₹{cgst.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5 tabular-nums">₹{sgst.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5 tabular-nums text-muted-foreground">—</td>
                    <td className="px-4 py-2.5 tabular-nums font-semibold">₹{inv.tax.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5 tabular-nums font-bold">₹{inv.total.toLocaleString("en-IN")}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t bg-muted/30">
                <td colSpan={3} className="px-4 py-2.5 font-semibold text-xs">TOTAL</td>
                <td className="px-4 py-2.5 font-bold tabular-nums">₹{invoices.slice(0,10).reduce((s,i) => s + i.amount, 0).toLocaleString("en-IN")}</td>
                <td className="px-4 py-2.5 font-bold tabular-nums">₹{invoices.slice(0,10).reduce((s,i) => s + Math.round(i.tax/2), 0).toLocaleString("en-IN")}</td>
                <td className="px-4 py-2.5 font-bold tabular-nums">₹{invoices.slice(0,10).reduce((s,i) => s + i.tax - Math.round(i.tax/2), 0).toLocaleString("en-IN")}</td>
                <td className="px-4 py-2.5 font-bold text-muted-foreground">—</td>
                <td className="px-4 py-2.5 font-bold tabular-nums">₹{invoices.slice(0,10).reduce((s,i) => s + i.tax, 0).toLocaleString("en-IN")}</td>
                <td className="px-4 py-2.5 font-bold tabular-nums">₹{invoices.slice(0,10).reduce((s,i) => s + i.total, 0).toLocaleString("en-IN")}</td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function InvoiceLedgerReport() {
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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {["Invoice #","Date","Customer","Amount","Tax","Total","Status"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-mono text-xs font-semibold text-primary">{inv.id}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{inv.date}</td>
                  <td className="px-4 py-2.5 font-medium">{inv.customer}</td>
                  <td className="px-4 py-2.5 tabular-nums">₹{inv.amount.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-2.5 tabular-nums text-muted-foreground">₹{inv.tax.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-2.5 tabular-nums font-semibold">₹{inv.total.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={inv.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
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
            <div className="flex items-center gap-3">
              <Input type="date" className="h-9 w-36" defaultValue="2024-03-01" />
              <span className="text-muted-foreground text-sm">to</span>
              <Input type="date" className="h-9 w-36" defaultValue="2024-05-31" />
              <Button size="sm">Generate</Button>
              <Button variant="outline" size="sm" className="ml-auto gap-1"><Download className="h-3.5 w-3.5" />Export</Button>
            </div>
            <Card>
              <CardContent className="p-8 text-center">
                <report.icon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">{report.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{report.desc}</p>
                <Button className="mt-4" onClick={() => {}}>Generate Report</Button>
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
        <p className="text-sm text-muted-foreground">Generate business reports with date filters and export</p>
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
