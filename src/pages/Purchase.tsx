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
import { Search, Plus, Trash2, UserPlus } from "lucide-react";
import { StatusBadge } from "./Dashboard";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

function CreatePurchaseModal({ trigger, title, tabName }: { trigger: React.ReactNode; title: string, tabName: string }) {
  const [lineItems, setLineItems] = useState([{ product: "", qty: 1, price: 0, gst: 18 }]);
  const [open, setOpen] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const subtotal = lineItems.reduce((s, l) => s + l.qty * l.price, 0);
  const tax = lineItems.reduce((s, l) => s + l.qty * l.price * l.gst / 100, 0);

  // Supplier form state
  const [supplierForm, setSupplierForm] = useState({
    companyName: "",
    contactPerson: "",
    mobile: "",
    email: "",
    gstNumber: "",
    city: "",
    billingAddress: "",
  });

  const handleAddSupplier = () => {
    console.log("Adding supplier:", supplierForm);
    setShowAddSupplier(false);
    setSupplierForm({
      companyName: "",
      contactPerson: "",
      mobile: "",
      email: "",
      gstNumber: "",
      city: "",
      billingAddress: "",
    });
  };

  // Define header fields for each tab type
  const getHeaderFields = () => {
    switch (tabName) {
      case "entries":
        return [
          { name: "Supplier", type: "select", options: contacts.filter(c => c.type === "Supplier"), required: true, isSupplier: true },
          { name: "Entry Date", type: "date", required: true },
          { name: "Due Date", type: "date" },
          { name: "Payment Terms", type: "text", placeholder: "e.g., Net 30" },
        ];
      case "returns":
        return [
          { name: "Supplier", type: "select", options: contacts.filter(c => c.type === "Supplier"), required: true, isSupplier: true },
          { name: "Return Date", type: "date", required: true },
          { name: "Reference PO", type: "text", placeholder: "Original PO number", required: true },
          { name: "Return Reason", type: "text", placeholder: "Reason for return" },
        ];
      case "orders":
        return [
          { name: "Supplier", type: "select", options: contacts.filter(c => c.type === "Supplier"), required: true, isSupplier: true },
          { name: "Order Date", type: "date", required: true },
          { name: "Expected Delivery", type: "date", required: true },
          { name: "Reference No.", type: "text", placeholder: "Optional reference" },
        ];
      case "supplier-qt":
        return [
          { name: "Supplier", type: "select", options: contacts.filter(c => c.type === "Supplier"), required: true, isSupplier: true },
          { name: "Quotation Date", type: "date", required: true },
          { name: "Valid Until", type: "date", required: true },
          { name: "Reference No.", type: "text", placeholder: "Supplier quotation ref" },
        ];
      case "indent":
        return [
          { name: "Department", type: "select", options: [{ id: "production", name: "Production" }, { id: "sales", name: "Sales" }, { id: "warehouse", name: "Warehouse" }], required: true },
          { name: "Indent Date", type: "date", required: true },
          { name: "Required By", type: "date" },
          { name: "Purpose", type: "text", placeholder: "Purpose of material request" },
        ];
      case "expenses":
        return [
          { name: "Category", type: "select", options: [{ id: "travel", name: "Travel" }, { id: "utilities", name: "Utilities" }, { id: "office", name: "Office Supplies" }, { id: "maintenance", name: "Maintenance" }, { id: "other", name: "Other" }], required: true },
          { name: "Expense Date", type: "date", required: true },
          { name: "Pay To", type: "text", placeholder: "Payee name", required: true },
          { name: "Description", type: "textarea", placeholder: "Expense description" },
        ];
      case "estimation":
        return [
          { name: "Project/Job", type: "text", placeholder: "Project or job name", required: true },
          { name: "Estimation Date", type: "date", required: true },
          { name: "Valid Until", type: "date" },
          { name: "Prepared By", type: "text", placeholder: "Name of person preparing estimate" },
        ];
      default:
        return [];
    }
  };

  const headerFields = getHeaderFields();
  const showLineItems = tabName !== "expenses";

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
                        {field.isSupplier && (
                          <div className="p-2 border-b">
                            <Button
                              variant="ghost"
                              className="w-full justify-start gap-2 text-xs text-primary"
                              onClick={() => setShowAddSupplier(true)}
                            >
                              <UserPlus className="h-3.5 w-3.5" />
                              Add New Supplier
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
                                  idx === i ? { ...it, product: v, price: p?.purchasePrice ?? 0 } : it
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
              <Button size="sm" onClick={() => console.log("Creating", tabName, lineItems)}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Supplier Dialog */}
      <Dialog open={showAddSupplier} onOpenChange={setShowAddSupplier}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add New Supplier</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs">Company Name *</Label>
              <Input className="mt-1 h-9" value={supplierForm.companyName} onChange={e => setSupplierForm({ ...supplierForm, companyName: e.target.value })} placeholder="Enter company name" />
            </div>
            <div>
              <Label className="text-xs">Contact Person</Label>
              <Input className="mt-1 h-9" value={supplierForm.contactPerson} onChange={e => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })} placeholder="Contact person name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Mobile</Label>
                <Input className="mt-1 h-9" value={supplierForm.mobile} onChange={e => setSupplierForm({ ...supplierForm, mobile: e.target.value })} placeholder="Mobile number" />
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <Input className="mt-1 h-9" value={supplierForm.email} onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })} placeholder="Email address" />
              </div>
            </div>
            <div>
              <Label className="text-xs">GST Number</Label>
              <Input className="mt-1 h-9" value={supplierForm.gstNumber} onChange={e => setSupplierForm({ ...supplierForm, gstNumber: e.target.value })} placeholder="GST number" />
            </div>
            <div>
              <Label className="text-xs">City</Label>
              <Input className="mt-1 h-9" value={supplierForm.city} onChange={e => setSupplierForm({ ...supplierForm, city: e.target.value })} placeholder="City" />
            </div>
            <div>
              <Label className="text-xs">Billing Address</Label>
              <Textarea className="mt-1 h-20" value={supplierForm.billingAddress} onChange={e => setSupplierForm({ ...supplierForm, billingAddress: e.target.value })} placeholder="Full billing address" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowAddSupplier(false)}>Cancel</Button>
              <Button size="sm" onClick={handleAddSupplier}>Add Supplier</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function Purchase() {
  const [activeTab, setActiveTab] = useState("entries");

  const getNewButtonLabel = (tab: string) => {
    switch (tab) {
      case "entries": return "New Purchase Entry";
      case "returns": return "New Purchase Return";
      case "orders": return "New Purchase Order";
      case "supplier-qt": return "New Supplier Quotation";
      case "indent": return "New Material Indent";
      case "expenses": return "New Expense Voucher";
      case "estimation": return "New Estimation";
      default: return "New";
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Purchase</h1>
        <p className="text-sm text-muted-foreground">Purchase entries, orders, returns and expense vouchers</p>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="entries">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <TabsList className="h-9">
            {["entries", "returns", "orders", "supplier-qt", "indent", "expenses", "estimation"].map(t => (
              <TabsTrigger key={t} value={t} className="text-xs px-3">
                {t === "entries" ? "Purchase Entries" : t === "supplier-qt" ? "Supplier Quotations" : t === "indent" ? "Material Indent" : t === "expenses" ? "Expense Vouchers" : t.charAt(0).toUpperCase() + t.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
          <CreatePurchaseModal
            tabName={activeTab}
            title={getNewButtonLabel(activeTab)}
            trigger={
              <Button size="sm" className="h-9 gap-1">
                <Plus className="h-3.5 w-3.5" />
                {activeTab === "entries" ? "New Entry" : activeTab === "returns" ? "New Return" : activeTab === "orders" ? "New PO" : activeTab === "supplier-qt" ? "New Quotation" : activeTab === "indent" ? "New Indent" : activeTab === "expenses" ? "New Expense" : "New Estimation"}
              </Button>
            }
          />
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
