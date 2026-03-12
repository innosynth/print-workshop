import { useState } from "react";
import { stockMovements, products, warehouses } from "@/lib/mockData";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Boxes, TrendingDown, AlertTriangle } from "lucide-react";
import { StatusBadge } from "./Dashboard";

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
        <Button size="sm" className="h-9 gap-1"><Plus className="h-3.5 w-3.5" />New Entry</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {["Entry #","Date","Product","Qty","Unit","Warehouse","Ref"].map(h => (
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

export default function Inventory() {
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

      <Tabs defaultValue="inward">
        <TabsList className="h-9">
          {["inward","outward","grn","dispatch","packing","adjustments"].map(t => (
            <TabsTrigger key={t} value={t} className="text-xs px-3">
              {t === "inward" ? "Stock Inward" : t === "outward" ? "Stock Outward" : t === "grn" ? "GRN" : t === "packing" ? "Packing List" : t.charAt(0).toUpperCase() + t.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>

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
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Stock Adjustment</CardTitle></CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Product</label>
                    <select className="mt-1 w-full h-9 text-sm border border-input rounded-md px-3 bg-background">
                      {products.map(p => <option key={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Adjustment Type</label>
                    <select className="mt-1 w-full h-9 text-sm border border-input rounded-md px-3 bg-background">
                      <option>Add Stock</option>
                      <option>Remove Stock</option>
                      <option>Set Quantity</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Quantity</label>
                    <Input type="number" className="mt-1 h-9" placeholder="0" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Reason</label>
                    <Input className="mt-1 h-9" placeholder="Reason for adjustment" />
                  </div>
                </div>
                <Button size="sm">Apply Adjustment</Button>
              </CardContent>
            </Card>

            {/* Warehouses */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Warehouses</CardTitle></CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      {["ID","Name","Location","Capacity (sqft)","Incharge"].map(h => (
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
