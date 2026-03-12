import { useState } from "react";
import { purchaseEntries, purchaseOrders, expenses, contacts, products } from "@/lib/mockData";
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
import { Search, Plus, Trash2 } from "lucide-react";
import { StatusBadge } from "./Dashboard";

function TxTable({ data, cols }: { data: any[]; cols: { key: string; label: string; render?: (row: any) => React.ReactNode }[] }) {
  const [search, setSearch] = useState("");
  const filtered = data.filter(row =>
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
          <div className="overflow-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b bg-muted/40">
                  {cols.map(c => (
                    <th key={c.key} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">{c.label}</th>
                  ))}
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
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={cols.length} className="px-4 py-8 text-center text-muted-foreground">No records found</td></tr>
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

const purCols = [
  { key: "id", label: "Entry #", render: (r: any) => <span className="font-mono text-xs font-semibold text-primary">{r.id}</span> },
  { key: "date", label: "Date" },
  { key: "supplier", label: "Supplier", render: (r: any) => <span className="font-medium">{r.supplier}</span> },
  { key: "items", label: "Items" },
  { key: "amount", label: "Amount", render: (r: any) => <span className="tabular-nums">₹{r.amount.toLocaleString("en-IN")}</span> },
  { key: "tax", label: "GST", render: (r: any) => <span className="tabular-nums text-muted-foreground">₹{r.tax.toLocaleString("en-IN")}</span> },
  { key: "total", label: "Total", render: (r: any) => <span className="font-semibold tabular-nums">₹{r.total.toLocaleString("en-IN")}</span> },
  { key: "status", label: "Status", render: (r: any) => <StatusBadge status={r.status} /> },
];

const poCols = [
  { key: "id", label: "PO #", render: (r: any) => <span className="font-mono text-xs font-semibold text-primary">{r.id}</span> },
  { key: "date", label: "Date" },
  { key: "supplier", label: "Supplier", render: (r: any) => <span className="font-medium">{r.supplier}</span> },
  { key: "expectedDate", label: "Expected Date" },
  { key: "amount", label: "Amount", render: (r: any) => <span className="tabular-nums font-semibold">₹{r.amount.toLocaleString("en-IN")}</span> },
  { key: "status", label: "Status", render: (r: any) => <StatusBadge status={r.status} /> },
];

const expCols = [
  { key: "id", label: "Voucher #", render: (r: any) => <span className="font-mono text-xs font-semibold text-primary">{r.id}</span> },
  { key: "date", label: "Date" },
  { key: "category", label: "Category", render: (r: any) => <span className="font-medium">{r.category}</span> },
  { key: "description", label: "Description", render: (r: any) => <span className="text-muted-foreground text-xs">{r.description}</span> },
  { key: "payTo", label: "Pay To" },
  { key: "amount", label: "Amount", render: (r: any) => <span className="font-semibold tabular-nums">₹{r.amount.toLocaleString("en-IN")}</span> },
  { key: "status", label: "Status", render: (r: any) => <StatusBadge status={r.status} /> },
];

function CreatePOModal() {
  const [lineItems, setLineItems] = useState([{ product: "", qty: 1, price: 0 }]);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" className="h-9 gap-1"><Plus className="h-3.5 w-3.5" />New PO</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Create Purchase Order</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Supplier</label>
              <Select>
                <SelectTrigger className="mt-1 h-9"><SelectValue placeholder="Select supplier" /></SelectTrigger>
                <SelectContent>
                  {contacts.filter(c => c.type === "Supplier").map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Order Date</label>
              <Input type="date" className="mt-1 h-9" defaultValue={new Date().toISOString().split("T")[0]} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Expected Delivery</label>
              <Input type="date" className="mt-1 h-9" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold">Items</label>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1"
                onClick={() => setLineItems(p => [...p, { product: "", qty: 1, price: 0 }])}>
                <Plus className="h-3 w-3" />Add Row
              </Button>
            </div>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/40 border-b">
                    {["Product","Qty","Unit Price","Amount",""].map(h => (
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
                            idx === i ? { ...it, product: v, price: p?.purchasePrice ?? 0 } : it
                          ));
                        }}>
                          <SelectTrigger className="h-7 text-xs w-44"><SelectValue placeholder="Select product" /></SelectTrigger>
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
                      <td className="px-2 py-1.5 font-semibold tabular-nums">₹{(item.qty * item.price).toLocaleString("en-IN")}</td>
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
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm">Cancel</Button>
            <Button size="sm">Create PO</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Purchase() {
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Purchase</h1>
        <p className="text-sm text-muted-foreground">Purchase entries, orders, returns and expense vouchers</p>
      </div>
      <Tabs defaultValue="entries">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <TabsList className="h-9">
            {["entries","returns","orders","supplier-qt","indent","expenses","estimation"].map(t => (
              <TabsTrigger key={t} value={t} className="text-xs px-3">
                {t === "entries" ? "Purchase Entries" : t === "supplier-qt" ? "Supplier Quotations" : t === "indent" ? "Material Indent" : t === "expenses" ? "Expense Vouchers" : t.charAt(0).toUpperCase() + t.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
          <CreatePOModal />
        </div>

        <TabsContent value="entries" className="mt-4"><TxTable data={purchaseEntries} cols={purCols} /></TabsContent>
        <TabsContent value="returns" className="mt-4">
          <div className="text-sm text-muted-foreground p-4">No purchase returns recorded yet.</div>
        </TabsContent>
        <TabsContent value="orders" className="mt-4"><TxTable data={purchaseOrders} cols={poCols} /></TabsContent>
        <TabsContent value="supplier-qt" className="mt-4">
          <div className="text-sm text-muted-foreground p-4">No supplier quotations recorded yet.</div>
        </TabsContent>
        <TabsContent value="indent" className="mt-4">
          <div className="text-sm text-muted-foreground p-4">No material indents recorded yet.</div>
        </TabsContent>
        <TabsContent value="expenses" className="mt-4"><TxTable data={expenses} cols={expCols} /></TabsContent>
        <TabsContent value="estimation" className="mt-4">
          <div className="text-sm text-muted-foreground p-4">No purchase estimations recorded yet.</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
