import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, Loader2 } from "lucide-react";
import { StatusBadge } from "./Dashboard";

function TxTable({ data, cols, isLoading }: { data: any[]; cols: any[]; isLoading?: boolean }) {
  const [search, setSearch] = useState("");
  const filtered = (data || []).filter(row =>
    Object.values(row).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );
  
  return (
    <div className="space-y-3">
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input placeholder="Search..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
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
                    {cols.map((c: any) => (
                      <th key={c.key} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                      {cols.map((c: any) => (
                        <td key={c.key} className="px-4 py-2.5">
                          {c.render ? c.render(row) : row[c.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={cols.length} className="px-4 py-8 text-center text-muted-foreground">No records found</td></tr>
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

export default function Purchase() {
  const [activeTab, setActiveTab] = useState("entries");

  const { data: entries = [], isLoading: entriesLoading } = useQuery({ queryKey: ["purchase-entries"], queryFn: () => fetch("/api/sales?resource=purchases&type=entries").then(res => res.json()) });
  const { data: orders = [], isLoading: ordersLoading } = useQuery({ queryKey: ["purchase-orders"], queryFn: () => fetch("/api/sales?resource=purchases&type=orders").then(res => res.json()) });
  const { data: expenses = [], isLoading: expensesLoading } = useQuery({ queryKey: ["expenses"], queryFn: () => fetch("/api/system?resource=expenses").then(res => res.json()) });

  const purCols = [
    { key: "purchaseNo", label: "Entry #", render: (r: any) => <span className="font-mono text-xs font-semibold text-primary">{r.purchaseNo}</span> },
    { key: "date", label: "Date" },
    { key: "supplierName", label: "Supplier", render: (r: any) => <span className="font-medium">{r.supplierName}</span> },
    { key: "amount", label: "Amount", render: (r: any) => <span className="tabular-nums">₹{parseFloat(r.amount).toLocaleString("en-IN")}</span> },
    { key: "status", label: "Status", render: (r: any) => <StatusBadge status={r.status} /> },
  ];

  const poCols = [
    { key: "orderNo", label: "PO #", render: (r: any) => <span className="font-mono text-xs font-semibold text-primary">{r.orderNo}</span> },
    { key: "date", label: "Date" },
    { key: "supplierName", label: "Supplier", render: (r: any) => <span className="font-medium">{r.supplierName}</span> },
    { key: "amount", label: "Amount", render: (r: any) => <span className="tabular-nums font-semibold">₹{parseFloat(r.amount).toLocaleString("en-IN")}</span> },
    { key: "status", label: "Status", render: (r: any) => <StatusBadge status={r.status} /> },
  ];

  const expCols = [
    { key: "id", label: "ID", render: (r: any) => <span className="font-mono text-xs font-semibold text-primary">{r.id}</span> },
    { key: "date", label: "Date" },
    { key: "category", label: "Category" },
    { key: "payee", label: "Pay To" },
    { key: "amount", label: "Amount", render: (r: any) => <span className="font-semibold tabular-nums">₹{parseFloat(r.amount).toLocaleString("en-IN")}</span> },
    { key: "status", label: "Status", render: (r: any) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Purchase</h1>
        <p className="text-sm text-muted-foreground">Purchase entries, orders, and expense vouchers</p>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="entries">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <TabsList className="h-9">
            {["entries", "orders", "expenses"].map(t => (
              <TabsTrigger key={t} value={t} className="text-xs px-3">
                {t === "entries" ? "Purchase Entries" : t === "orders" ? "Purchase Orders" : "Expense Vouchers"}
              </TabsTrigger>
            ))}
          </TabsList>
          <Button size="sm" className="h-9 gap-1"><Plus className="h-3.5 w-3.5" />New {activeTab.slice(0, -1)}</Button>
        </div>

        <TabsContent value="entries" className="mt-4"><TxTable data={entries} cols={purCols} isLoading={entriesLoading} /></TabsContent>
        <TabsContent value="orders" className="mt-4"><TxTable data={orders} cols={poCols} isLoading={ordersLoading} /></TabsContent>
        <TabsContent value="expenses" className="mt-4"><TxTable data={expenses} cols={expCols} isLoading={expensesLoading} /></TabsContent>
      </Tabs>
    </div>
  );
}
