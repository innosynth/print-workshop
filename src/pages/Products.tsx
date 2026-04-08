import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Search, Plus, Upload, Edit2, UserPlus, Loader2 } from "lucide-react";
import { StatusBadge } from "./Dashboard";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function ProductList() {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");

  const { data: products = [], isLoading, isError } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch("/api/core?resource=products");
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
  });

  const categories = Array.from(new Set(products.map((p: any) => p.category))).filter(Boolean);

  const filtered = (products || [])
    .filter((p: any) => catFilter === "all" || p.category === catFilter)
    .filter((p: any) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
      (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()))
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
            {categories.map((c: any) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <Button variant="outline" size="sm" className="h-9 gap-1"><Upload className="h-3.5 w-3.5" />Bulk Import</Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto min-h-[200px] flex flex-col">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : isError ? (
              <div className="flex-1 flex items-center justify-center p-8 text-destructive">Failed to load products</div>
            ) : (
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {["SKU", "Product Name", "Category", "Brand", "Sell Price", "Purchase", "Stock", "Unit", "Rack", "Status", ""].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p: any) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{p.sku || "—"}</td>
                      <td className="px-4 py-2.5 font-medium">{p.name}</td>
                      <td className="px-4 py-2.5"><Badge variant="outline" className="text-xs">{p.category}</Badge></td>
                      <td className="px-4 py-2.5 text-muted-foreground">{p.brand}</td>
                      <td className="px-4 py-2.5 tabular-nums font-semibold">₹{p.sellPrice}</td>
                      <td className="px-4 py-2.5 tabular-nums text-muted-foreground">₹{p.purchasePrice}</td>
                      <td className={`px-4 py-2.5 tabular-nums font-semibold ${p.stock === 0 ? "text-destructive" : p.stock < p.minStock ? "text-yellow-600" : "text-primary"
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
            )}
          </div>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">{filtered.length} products</p>
    </div>
  );
}

function CreateProductModal({ trigger, title, tabName, products }: { trigger: React.ReactNode; title: string, tabName: string, products: any[] }) {
  const [open, setOpen] = useState(false);
  const categories = Array.from(new Set(products.map((p: any) => p.category))).filter(Boolean);
  const brands = Array.from(new Set(products.map((p: any) => p.brand))).filter(Boolean);

  const getFields = () => {
    switch (tabName) {
      case "products":
        return [
          { label: "SKU", span: false }, { label: "Product Name", span: true },
          { label: "Category", span: false, isCategory: true }, { label: "Brand", span: false, isBrand: true },
          { label: "Sell Price (₹)", span: false }, { label: "Purchase Price (₹)", span: false },
          { label: "Min Stock", span: false }, { label: "Unit", span: false },
          { label: "Rack/Location", span: false }, { label: "Barcode", span: false },
          { label: "Description", span: true, type: "textarea" },
        ];
      default: return [];
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
              {f.isCategory ? (
                <Select>
                  <SelectTrigger className="mt-1 h-9">
                    <SelectValue placeholder={`Select ${f.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c: any) => <SelectItem key={c} value={c}>{String(c)}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : f.isBrand ? (
                <Select>
                  <SelectTrigger className="mt-1 h-9">
                    <SelectValue placeholder={`Select ${f.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((b: any) => <SelectItem key={b} value={b}>{String(b)}</SelectItem>)}
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
            <Button size="sm" onClick={() => setOpen(false)}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Products() {
  const [activeTab, setActiveTab] = useState("products");
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: () => fetch("/api/core?resource=products").then(res => res.json()) });

  const getNewButtonLabel = (tab: string) => {
    switch (tab) {
      case "products": return "Add New Product";
      case "categories": return "Add New Category";
      case "brands": return "Add New Brand";
      default: return "Add New";
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Products</h1>
        <p className="text-sm text-muted-foreground">Product master, categories, and brands</p>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="products">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <TabsList className="h-12 flex-wrap bg-transparent gap-2 px-1">
            {[
              { id: "products", label: "Products" },
              { id: "categories", label: "Categories" },
              { id: "brands", label: "Brands" },
              { id: "pricelists", label: "Price Lists" }
            ].map(t => (
              <TabsTrigger key={t.id} value={t.id} className="text-xs px-5 h-10 font-black uppercase tracking-tight data-[state=active]:bg-primary/10 data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary transition-all">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <CreateProductModal
            tabName={activeTab}
            products={products}
            title={getNewButtonLabel(activeTab)}
            trigger={
              <Button size="sm" className="h-9 gap-1 shadow-lg shadow-primary/20">
                <Plus className="h-3.5 w-3.5" />
                {getNewButtonLabel(activeTab)}
              </Button>
            }
          />
        </div>

        <TabsContent value="products" className="mt-4"><ProductList /></TabsContent>
        <TabsContent value="categories" className="mt-4">
          <div className="p-20 text-center text-muted-foreground border-2 border-dashed border-zinc-800 rounded-xl">Product category classification and sub-groups</div>
        </TabsContent>
        <TabsContent value="brands" className="mt-4">
          <div className="p-20 text-center text-muted-foreground border-2 border-dashed border-zinc-800 rounded-xl">Brand master and manufacturer tracking</div>
        </TabsContent>
        <TabsContent value="pricelists" className="mt-4">
          <div className="p-20 text-center text-muted-foreground border-2 border-dashed border-zinc-800 rounded-xl">Custom price lists for retail and wholesale contracts</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
