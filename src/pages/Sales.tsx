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
import { Search, Plus, Trash2 } from "lucide-react";
import { StatusBadge } from "./Dashboard";

function TxTable({ data, cols }: { data: any[]; cols: { key: string; label: string; render?: (row: any) => React.ReactNode }[] }) {
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

function CreateInvoiceModal({ trigger, title }: { trigger: React.ReactNode; title: string }) {
  const [lineItems, setLineItems] = useState([{ product: "", qty: 1, price: 0, gst: 18 }]);
  const subtotal = lineItems.reduce((s, l) => s + l.qty * l.price, 0);
  const tax = lineItems.reduce((s, l) => s + l.qty * l.price * l.gst / 100, 0);
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Customer</label>
              <Select>
                <SelectTrigger className="mt-1 h-9">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.filter(c => c.type === "B2B" || c.type === "B2C").map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Date</label>
              <Input type="date" className="mt-1 h-9" defaultValue={new Date().toISOString().split("T")[0]} />
            </div>
          </div>
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
                    {["Product","Qty","Unit Price","GST %","Amount",""].map(h => (
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
                            {[0,5,12,18,28].map(r => <SelectItem key={r} value={String(r)}>{r}%</SelectItem>)}
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
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm">Save Draft</Button>
            <Button size="sm">Create {title.split(" ").pop()}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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

export default function Sales() {
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Sales</h1>
        <p className="text-sm text-muted-foreground">Invoices, quotations, and sales transactions</p>
      </div>
      <Tabs defaultValue="invoices">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <TabsList className="h-9">
            {["invoices","quotations","returns","receipts","proforma","obf","pricing"].map(t => (
              <TabsTrigger key={t} value={t} className="text-xs px-3">
                {t === "obf" ? "OBF" : t === "proforma" ? "Proforma / SO" : t === "pricing" ? "Customer Pricing" : t.charAt(0).toUpperCase() + t.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
          <CreateInvoiceModal title="Create Invoice" trigger={
            <Button size="sm" className="h-9 gap-1"><Plus className="h-3.5 w-3.5" />New Invoice</Button>
          } />
        </div>

        <TabsContent value="invoices" className="mt-4"><TxTable data={invoices} cols={invCols} /></TabsContent>
        <TabsContent value="quotations" className="mt-4"><TxTable data={quotations} cols={qtCols} /></TabsContent>
        <TabsContent value="returns" className="mt-4"><TxTable data={salesReturns} cols={srCols} /></TabsContent>
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
            <p className="text-sm text-muted-foreground">Customer-specific price lists coming soon.</p>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
