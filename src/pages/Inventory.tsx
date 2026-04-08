import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, Boxes, TrendingDown, AlertTriangle, Loader2 } from "lucide-react";
import { StatusBadge } from "./Dashboard";

function MovementTable({ data, isLoading }: { data: any[]; isLoading?: boolean }) {
  const [search, setSearch] = useState("");
  const filtered = (data || []).filter(m =>
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
          <div className="overflow-auto min-h-[200px] flex flex-col">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {["Entry #", "Date", "Product", "Qty", "Unit", "Warehouse", "Ref"].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m: any, i: number) => (
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
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Inventory() {
  const [activeTab, setActiveTab] = useState("inward");

  const { data: inventoryData, isLoading } = useQuery({ 
    queryKey: ["inventory"], 
    queryFn: () => fetch("/api/system?resource=inventory").then(res => res.json()) 
  });

  const summary = inventoryData?.summary || { totalProducts: 0, lowStock: 0, outOfStock: 0 };
  const movements = inventoryData?.movements || [];

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Inventory</h1>
        <p className="text-sm text-muted-foreground">Stock movements, GRN, and adjustments</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Boxes className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Products</p>
              <p className="text-xl font-bold">{summary.totalProducts}</p>
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
              <p className="text-xl font-bold text-yellow-600">{summary.lowStock}</p>
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
              <p className="text-xl font-bold text-destructive">{summary.outOfStock}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="inward">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <TabsList className="h-9">
            {["inward", "outward", "grn", "dispatch"].map(t => (
              <TabsTrigger key={t} value={t} className="text-xs px-3">
                {t === "inward" ? "Stock Inward" : t === "outward" ? "Stock Outward" : t.toUpperCase()}
              </TabsTrigger>
            ))}
          </TabsList>
          <Button size="sm" className="h-9 gap-1"><Plus className="h-3.5 w-3.5" />New {activeTab.toUpperCase()}</Button>
        </div>

        <TabsContent value="inward" className="mt-4"><MovementTable data={movements.filter((m: any) => m.type === "Inward")} isLoading={isLoading} /></TabsContent>
        <TabsContent value="outward" className="mt-4"><MovementTable data={movements.filter((m: any) => m.type === "Outward")} isLoading={isLoading} /></TabsContent>
        <TabsContent value="grn" className="mt-4"><MovementTable data={movements.filter((m: any) => m.type === "Inward")} isLoading={isLoading} /></TabsContent>
        <TabsContent value="dispatch" className="mt-4"><MovementTable data={movements.filter((m: any) => m.type === "Outward")} isLoading={isLoading} /></TabsContent>
      </Tabs>
    </div>
  );
}
