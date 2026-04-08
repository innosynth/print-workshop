import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, Loader2, Trash2 } from "lucide-react";
import { StatusBadge } from "./Dashboard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";


function CreatePurchaseModal({ trigger, title, type }: { trigger: React.ReactNode; title: string, type: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [items, setItems] = useState([{ name: "", qty: 1, rate: 0, amount: 0 }]);
  const [supplierId, setSupplierId] = useState("");

  const { data: contacts = [] } = useQuery({ 
    queryKey: ["contacts-suppliers"], 
    queryFn: () => fetch("/api/core?resource=contacts").then(res => res.json()) 
  });
  const suppliers = contacts.filter((c: any) => c.type === "Supplier" || c.type === "Employee");

  const addItem = () => setItems([...items, { name: "", qty: 1, rate: 0, amount: 0 }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    if (field === "qty" || field === "rate") {
      newItems[index].amount = newItems[index].qty * newItems[index].rate;
    }
    setItems(newItems);
  };

  const total = items.reduce((sum, item) => sum + item.amount, 0);

  const handleSave = async () => {
    if (!supplierId) {
      toast({ variant: "destructive", title: "Error", description: "Please select a supplier/payee" });
      return;
    }
    setLoading(true);
    try {
      const resource = type === 'expenses' ? 'expenses' : 'purchases';
      const endpoint = type === 'expenses' ? '/api/system?resource=expenses' : `/api/sales?resource=purchases&type=${type}`;
      
      const payload = type === 'expenses' ? {
        category: "General",
        description: items[0].name,
        amount: total.toString(),
        payTo: suppliers.find((s: any) => s.id.toString() === supplierId)?.name || "",
        date: new Date().toISOString().split('T')[0]
      } : {
        supplierId: parseInt(supplierId),
        [type === 'entries' ? 'purchaseNo' : 'orderNo']: `${type === 'entries' ? 'PUR' : 'PO'}-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString().split('T')[0],
        amount: total.toString(),
        tax: (total * 0.18).toString(),
        total: (total * 1.18).toString(),
        status: "Paid",
        items: items
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to save");
      toast({ title: "Success", description: `${title} created successfully` });
      setOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{type === 'expenses' ? 'Pay To' : 'Supplier'}</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {suppliers.map((s: any) => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
          </div>

          <Separator />
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="font-bold">Items/Details</Label>
              <Button variant="outline" size="sm" onClick={addItem} className="h-7"><Plus className="h-3 w-3 mr-1" />Add Row</Button>
            </div>
            {items.map((item, i) => (
              <div key={i} className="flex gap-2">
                <Input placeholder="Description" className="flex-[3]" value={item.name} onChange={e => updateItem(i, "name", e.target.value)} />
                <Input type="number" placeholder="Qty" className="flex-1" value={item.qty} onChange={e => updateItem(i, "qty", parseFloat(e.target.value) || 0)} />
                <Input type="number" placeholder="Rate" className="flex-1" value={item.rate} onChange={e => updateItem(i, "rate", parseFloat(e.target.value) || 0)} />
                <Button variant="ghost" size="icon" onClick={() => removeItem(i)} disabled={items.length === 1}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 font-bold text-lg">
            Total: ₹{(total * 1.18).toFixed(2)}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save {type.slice(0, -1)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
    { key: "items", label: "Items", render: (r: any) => <span className="tabular-nums">{r.items || 0}</span> },
    { key: "amount", label: "Amount", render: (r: any) => <span className="tabular-nums">₹{parseFloat(r.amount).toLocaleString("en-IN")}</span> },
    { key: "tax", label: "GST", render: (r: any) => <span className="tabular-nums text-muted-foreground">₹{parseFloat(r.tax || (r.amount * 0.18)).toLocaleString("en-IN")}</span> },
    { key: "total", label: "Total", render: (r: any) => <span className="tabular-nums font-bold">₹{parseFloat(r.total || (r.amount * 1.18)).toLocaleString("en-IN")}</span> },
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Purchase</h1>
          <p className="text-sm text-muted-foreground">Purchase entries, orders, returns and expense vouchers</p>
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="entries">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <TabsList className="h-12 flex-wrap bg-transparent gap-2 px-1">
            {[
              { id: "entries", label: "Purchase Entries" },
              { id: "returns", label: "Returns" },
              { id: "orders", label: "Orders" },
              { id: "quotations", label: "Supplier Quotations" },
              { id: "indents", label: "Material Indent" },
              { id: "expenses", label: "Expense Vouchers" },
              { id: "estimations", label: "Estimation" }
            ].map(t => (
              <TabsTrigger key={t.id} value={t.id} className="text-xs px-5 h-10 font-black uppercase tracking-tight data-[state=active]:bg-primary/10 data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary transition-all">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <CreatePurchaseModal
            type={activeTab}
            title={`Add New ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
            trigger={
              <Button size="sm" className="h-9 gap-1 shadow-lg shadow-primary/20">
                <Plus className="h-3.5 w-3.5" />New {activeTab === "entries" ? "Entry" : activeTab.slice(0, -1)}
              </Button>
            }
          />
        </div>

        <TabsContent value="entries" className="mt-4"><TxTable data={entries} cols={purCols} isLoading={entriesLoading} /></TabsContent>
        <TabsContent value="orders" className="mt-4"><TxTable data={orders} cols={poCols} isLoading={ordersLoading} /></TabsContent>
        <TabsContent value="returns" className="mt-4">
          <div className="p-20 text-center text-muted-foreground border-2 border-dashed border-zinc-800 rounded-xl">No purchase returns recorded today</div>
        </TabsContent>
        <TabsContent value="quotations" className="mt-4">
          <div className="p-20 text-center text-muted-foreground border-2 border-dashed border-zinc-800 rounded-xl">Active supplier quotations summary</div>
        </TabsContent>
        <TabsContent value="indents" className="mt-4">
          <div className="p-20 text-center text-muted-foreground border-2 border-dashed border-zinc-800 rounded-xl">Pending material indents from production</div>
        </TabsContent>
        <TabsContent value="estimations" className="mt-4">
          <div className="p-20 text-center text-muted-foreground border-2 border-dashed border-zinc-800 rounded-xl">Purchase estimations and pre-order costs</div>
        </TabsContent>
        <TabsContent value="expenses" className="mt-4"><TxTable data={expenses} cols={expCols} isLoading={expensesLoading} /></TabsContent>
      </Tabs>
    </div>
  );
}
