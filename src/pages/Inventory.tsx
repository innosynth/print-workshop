import { useState } from "react";
import { stockMovements, products, warehouses } from "@/lib/mockData";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Boxes, TrendingDown, AlertTriangle } from "lucide-react";
import { StatusBadge } from "./Dashboard";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const inward = stockMovements.filter(m => m.type === "Inward");
const outward = stockMovements.filter(m => m.type === "Outward");
const lowStock = products.filter(p => p.stock > 0 && p.stock < p.minStock);
const outOfStock = products.filter(p => p.stock === 0);

function MovementTable({ data }: { data: typeof stockMovements }) {
  const [search, setSearch] = useState("");
  const filtered = data.filter(m =>
    m.product.toLowerCase().includes(search.toLowerCase()) ||
    m.ref.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {["Entry #", "Date", "Product", "Qty", "Unit", "Warehouse", "Ref"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-mono text-xs font-semibold text-primary">{m.id}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{m.date}</td>
                  <td className="px-4 py-2.5 font-medium">{m.product}</td>
                  <td className="px-4 py-2.5 font-semibold tabular-nums">{m.qty}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{m.unit}</td>
                  <td className="px-4 py-2.5">{m.warehouse}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{m.ref}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No records found</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function CreateInventoryModal({ trigger, title, tabName }: { trigger: React.ReactNode; title: string, tabName: string }) {
  const [open, setOpen] = useState(false);

  // Define fields for each tab type
  const getFields = () => {
    switch (tabName) {
      case "inward":
        return [
          { label: "Product", span: false, isProduct: true },
          { label: "Quantity", span: false, type: "number" },
          { label: "Unit", span: false },
          { label: "Warehouse", span: false, isWarehouse: true },
          { label: "Reference No.", span: true },
          { label: "Date", span: false, type: "date" },
          { label: "Remarks", span: true, type: "textarea" },
        ];
      case "outward":
        return [
          { label: "Product", span: false, isProduct: true },
          { label: "Quantity", span: false, type: "number" },
          { label: "Unit", span: false },
          { label: "Warehouse", span: false, isWarehouse: true },
          { label: "Reference No.", span: true },
          { label: "Date", span: false, type: "date" },
          { label: "Remarks", span: true, type: "textarea" },
        ];
      case "grn":
        return [
          { label: "Product", span: false, isProduct: true },
          { label: "Quantity Received", span: false, type: "number" },
          { label: "Unit", span: false },
          { label: "Warehouse", span: false, isWarehouse: true },
          { label: "PO/Reference No.", span: true },
          { label: "GRN Date", span: false, type: "date" },
          { label: "Supplier", span: true },
          { label: "Remarks", span: true, type: "textarea" },
        ];
      case "dispatch":
        return [
          { label: "Product", span: false, isProduct: true },
          { label: "Quantity Dispatched", span: false, type: "number" },
          { label: "Unit", span: false },
          { label: "Warehouse", span: false, isWarehouse: true },
          { label: "Dispatch/Invoice No.", span: true },
          { label: "Dispatch Date", span: false, type: "date" },
          { label: "Customer", span: true },
          { label: "Remarks", span: true, type: "textarea" },
        ];
      case "packing":
        return [
          { label: "Invoice/Order No.", span: true },
          { label: "Customer Name", span: true },
          { label: "Packing Date", span: false, type: "date" },
          { label: "No. of Packages", span: false, type: "number" },
          { label: "Package Type", span: false },
          { label: "Weight (kg)", span: false, type: "number" },
          { label: "Carrier/Courier", span: true },
          { label: "Tracking No.", span: true },
          { label: "Remarks", span: true, type: "textarea" },
        ];
      case "adjustments":
        return [
          { label: "Product", span: false, isProduct: true },
          { label: "Adjustment Type", span: false, isAdjustmentType: true },
          { label: "Quantity", span: false, type: "number" },
          { label: "Unit", span: false },
          { label: "Warehouse", span: false, isWarehouse: true },
          { label: "Date", span: false, type: "date" },
          { label: "Reason", span: true, type: "textarea" },
          { label: "Authorized By", span: true },
        ];
      default:
        return [];
    }
  };

  const fields = getFields();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          {fields.map(f => (
            <div key={f.label} className={f.span ? "col-span-2" : ""}>
              <Label className="text-xs font-medium text-muted-foreground">{f.label}</Label>
              {f.isProduct ? (
                <Select>
                  <SelectTrigger className="mt-1 h-9">
                    <SelectValue placeholder={`Select ${f.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : f.isWarehouse ? (
                <Select>
                  <SelectTrigger className="mt-1 h-9">
                    <SelectValue placeholder={`Select ${f.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : f.isAdjustmentType ? (
                <Select>
                  <SelectTrigger className="mt-1 h-9">
                    <SelectValue placeholder={`Select ${f.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">Add Stock</SelectItem>
                    <SelectItem value="remove">Remove Stock</SelectItem>
                    <SelectItem value="set">Set Quantity</SelectItem>
                  </SelectContent>
                </Select>
              ) : f.type === "textarea" ? (
                <Textarea className="mt-1 h-20" placeholder={f.label} />
              ) : (
                <Input className="mt-1 h-9" placeholder={f.label} type={f.type || "text"} />
              )}
            </div>
          ))}
          <div className="col-span-2 flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => console.log("Creating", tabName)}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Inventory() {
  const [activeTab, setActiveTab] = useState("inward");

  const getNewButtonLabel = (tab: string) => {
    switch (tab) {
      case "inward": return "Add Stock Inward";
      case "outward": return "Add Stock Outward";
      case "grn": return "Add GRN Entry";
      case "dispatch": return "Add Dispatch Entry";
      case "packing": return "Add Packing List";
      case "adjustments": return "Add Stock Adjustment";
      default: return "Add New";
    }
  };

  const getButtonText = (tab: string) => {
    switch (tab) {
      case "inward": return "New Inward";
      case "outward": return "New Outward";
      case "grn": return "New GRN";
      case "dispatch": return "New Dispatch";
      case "packing": return "New Packing";
      case "adjustments": return "New Adjustment";
      default: return "New Entry";
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Inventory</h1>
        <p className="text-sm text-muted-foreground">Stock movements, GRN, dispatch, and adjustments</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Boxes className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Products</p>
              <p className="text-xl font-bold">{products.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-yellow-100 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Low Stock Items</p>
              <p className="text-xl font-bold text-yellow-600">{lowStock.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center">
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Out of Stock</p>
              <p className="text-xl font-bold text-destructive">{outOfStock.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="inward">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <TabsList className="h-9">
            {["inward", "outward", "grn", "dispatch", "packing", "adjustments"].map(t => (
              <TabsTrigger key={t} value={t} className="text-xs px-3">
                {t === "inward" ? "Stock Inward" : t === "outward" ? "Stock Outward" : t === "grn" ? "GRN" : t === "packing" ? "Packing List" : t.charAt(0).toUpperCase() + t.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
          <CreateInventoryModal
            tabName={activeTab}
            title={getNewButtonLabel(activeTab)}
            trigger={
              <Button size="sm" className="h-9 gap-1">
                <Plus className="h-3.5 w-3.5" />
                {getButtonText(activeTab)}
              </Button>
            }
          />
        </div>

        <TabsContent value="inward" className="mt-4"><MovementTable data={inward} /></TabsContent>
        <TabsContent value="outward" className="mt-4"><MovementTable data={outward} /></TabsContent>
        <TabsContent value="grn" className="mt-4"><MovementTable data={inward} /></TabsContent>
        <TabsContent value="dispatch" className="mt-4"><MovementTable data={outward} /></TabsContent>
        <TabsContent value="packing" className="mt-4">
          <Card><CardContent className="p-4">
            <p className="text-sm text-muted-foreground">No packing lists created yet.</p>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="adjustments" className="mt-4">
          <div className="space-y-4">
            {/* Warehouses */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Warehouses</CardTitle></CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      {["ID", "Name", "Location", "Capacity (sqft)", "Incharge"].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {warehouses.map(w => (
                      <tr key={w.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-2.5 font-mono text-xs">{w.id}</td>
                        <td className="px-4 py-2.5 font-semibold">{w.name}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{w.location}</td>
                        <td className="px-4 py-2.5 tabular-nums">{w.capacity.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-2.5">{w.incharge}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
