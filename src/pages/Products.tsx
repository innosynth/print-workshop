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
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";


function BulkImportModal({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleUpload = async () => {
    toast({ title: "Importing...", description: "Processing your product catalogue" });
    try {
      const mockData = [
        { sku: "ART-300", name: "Art Paper 300gsm", category: "Paper", sellPrice: "25", stock: "100" },
        { sku: "VIN-GLO", name: "Vinyl Glossy", category: "Vinyl", sellPrice: "45", stock: "50" },
      ];
      const res = await fetch("/api/core?resource=products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mockData)
      });
      if (!res.ok) throw new Error("Import failed");
      setOpen(false);
      toast({ title: "Success", description: "Successfully imported 2 products" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Bulk Import Products</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="border-2 border-dashed border-muted rounded-xl p-8 text-center space-y-2">
            <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium">Drag and drop your Excel/CSV file here</p>
            <p className="text-xs text-muted-foreground">Download the <span className="text-primary cursor-pointer hover:underline">template file</span> before uploading</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleUpload}>Start Import</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
        <BulkImportModal 
          trigger={<Button variant="outline" size="sm" className="h-9 gap-1"><Upload className="h-3.5 w-3.5" />Bulk Import</Button>}
        />
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
                      <td className="px-4 py-2.5 text-right">
                        <CreateProductModal 
                          tabName="products" 
                          products={products}
                          initialData={p}
                          title="Edit Product"
                          trigger={
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                          }
                        />
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

function CreateProductModal({ trigger, title, tabName, products, initialData }: { trigger: React.ReactNode; title: string, tabName: string, products: any[], initialData?: any }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<any>(initialData || {
    sku: `SKU-${Date.now().toString().slice(-4)}`,
    name: "",
    category: "",
    brand: "",
    sellPrice: "0",
    purchasePrice: "0",
    stock: "0",
    minStock: "10",
    unit: "PCS",
    rack: "",
    barcode: "",
    description: ""
  });

  const resetForm = () => setFormData(initialData || {
    sku: `SKU-${Date.now().toString().slice(-4)}`,
    name: "",
    category: "",
    brand: "",
    sellPrice: "0",
    purchasePrice: "0",
    stock: "0",
    minStock: "10",
    unit: "PCS",
    rack: "",
    barcode: "",
    description: ""
  });

  const categories = Array.from(new Set(products.map((p: any) => p.category))).filter(Boolean);
  const brands = Array.from(new Set(products.map((p: any) => p.brand))).filter(Boolean);

  const handleSave = async () => {
    if (!formData.name) {
      toast({ variant: "destructive", title: "Missing Name", description: "Product name is required" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/core?resource=products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error("Failed to save product");
      toast({ title: "Success", description: `Product ${formData.id ? 'updated' : 'created'} successfully` });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setOpen(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  const getFields = () => {
    switch (tabName) {
      case "products":
        return [
          { label: "SKU", key: "sku", span: false }, 
          { label: "Product Name", key: "name", span: true },
          { label: "Category", key: "category", span: false, isCategory: true }, 
          { label: "Brand", key: "brand", span: false, isBrand: true },
          { label: "Sell Price (₹)", key: "sellPrice", span: false, type: "number" }, 
          { label: "Purchase Price (₹)", key: "purchasePrice", span: false, type: "number" },
          { label: "Stock", key: "stock", span: false, type: "number" },
          { label: "Min Stock", key: "minStock", span: false, type: "number" }, 
          { label: "Unit", key: "unit", span: false },
          { label: "Rack/Location", key: "rack", span: false }, 
          { label: "Barcode", key: "barcode", span: false },
          { label: "Description", key: "description", span: true, type: "textarea" },
        ];
      default: return [];
    }
  };

  const fields = getFields();

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if(!v) resetForm(); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          {fields.map(f => (
            <div key={f.label} className={f.span ? "col-span-2" : ""}>
              <Label className="text-xs font-medium text-muted-foreground">{f.label}</Label>
              {f.isCategory ? (
                <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                  <SelectTrigger className="mt-1 h-9">
                    <SelectValue placeholder={`Select ${f.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c: any) => <SelectItem key={c} value={c}>{String(c)}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : f.isBrand ? (
                <Select value={formData.brand} onValueChange={(v) => setFormData({...formData, brand: v})}>
                  <SelectTrigger className="mt-1 h-9">
                    <SelectValue placeholder={`Select ${f.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((b: any) => <SelectItem key={b} value={b}>{String(b)}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : f.type === "textarea" ? (
                <Textarea className="mt-1 h-20" placeholder={f.label} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              ) : (
                <Input className="mt-1 h-9" placeholder={f.label} type={f.type || "text"} value={formData[f.key as string]} onChange={e => setFormData({...formData, [f.key as string]: e.target.value})} />
              )}
            </div>
          ))}
          <div className="col-span-2 flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {formData.id ? "Update Product" : "Save Product"}
            </Button>
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
