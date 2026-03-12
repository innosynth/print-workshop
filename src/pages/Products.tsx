import { useState } from "react";
import { products, categories, brands, warehouses } from "@/lib/mockData";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Upload, Edit2 } from "lucide-react";
import { StatusBadge } from "./Dashboard";

function ProductList() {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const filtered = products
    .filter(p => catFilter === "all" || p.category === catFilter)
    .filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search SKU, name, brand..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="h-9 w-44">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-1"><Upload className="h-3.5 w-3.5" />Bulk Import</Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 gap-1"><Plus className="h-3.5 w-3.5" />Add Product</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Add New Product</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3 py-2">
                {[
                  { label: "SKU", span: false }, { label: "Product Name", span: true },
                  { label: "Category", span: false }, { label: "Brand", span: false },
                  { label: "HSN Code", span: false }, { label: "Part Number", span: false },
                  { label: "Sell Price (₹)", span: false }, { label: "Purchase Price (₹)", span: false },
                  { label: "Min Stock", span: false }, { label: "Unit", span: false },
                  { label: "Rack/Location", span: false }, { label: "Barcode", span: false },
                  { label: "Description", span: true },
                ].map(f => (
                  <div key={f.label} className={f.span ? "col-span-2" : ""}>
                    <label className="text-xs font-medium text-muted-foreground">{f.label}</label>
                    <Input className="mt-1 h-9" placeholder={f.label} />
                  </div>
                ))}
                <div className="col-span-2 flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm">Cancel</Button>
                  <Button size="sm">Save Product</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b bg-muted/40">
                  {["SKU","Product Name","Category","Brand","Sell Price","Purchase","Stock","Unit","Rack","Status",""].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{p.sku}</td>
                    <td className="px-4 py-2.5 font-medium">{p.name}</td>
                    <td className="px-4 py-2.5"><Badge variant="outline" className="text-xs">{p.category}</Badge></td>
                    <td className="px-4 py-2.5 text-muted-foreground">{p.brand}</td>
                    <td className="px-4 py-2.5 tabular-nums font-semibold">₹{p.sellPrice}</td>
                    <td className="px-4 py-2.5 tabular-nums text-muted-foreground">₹{p.purchasePrice}</td>
                    <td className={`px-4 py-2.5 tabular-nums font-semibold ${
                      p.stock === 0 ? "text-destructive" : p.stock < p.minStock ? "text-yellow-600" : "text-primary"
                    }`}>{p.stock}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{p.unit}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{p.rack}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-2.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">No products found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">{filtered.length} products</p>
    </div>
  );
}

export default function Products() {
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Products</h1>
        <p className="text-sm text-muted-foreground">Product master, categories, brands, and price lists</p>
      </div>
      <Tabs defaultValue="products">
        <TabsList className="h-9">
          {["products","categories","brands","pricelists","batches","warehouses"].map(t => (
            <TabsTrigger key={t} value={t} className="text-xs px-3">
              {t === "pricelists" ? "Price Lists" : t.charAt(0).toUpperCase() + t.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="products" className="mt-4"><ProductList /></TabsContent>

        <TabsContent value="categories" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {["#","Category Name","Products","HSN Code","Action"].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c, i) => (
                    <tr key={c} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-2.5 font-semibold">{c}</td>
                      <td className="px-4 py-2.5">{products.filter(p => p.category === c).length}</td>
                      <td className="px-4 py-2.5 font-mono text-xs">{products.find(p => p.category === c)?.hsn ?? "—"}</td>
                      <td className="px-4 py-2.5">
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Edit2 className="h-3.5 w-3.5" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brands" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {["#","Brand Name","Products"].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {brands.map((b, i) => (
                    <tr key={b} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-2.5 font-semibold">{b}</td>
                      <td className="px-4 py-2.5">{products.filter(p => p.brand === b).length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="warehouses" className="mt-4">
          <Card>
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
        </TabsContent>

        {["pricelists","batches"].map(t => (
          <TabsContent key={t} value={t} className="mt-4">
            <div className="text-sm text-muted-foreground p-4">
              {t === "pricelists" ? "No custom price lists configured yet." : "No batch records found."}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
