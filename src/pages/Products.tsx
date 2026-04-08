import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";


function BulkImportModal({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({ queryKey: ["products"] });
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

  const categories = Array.isArray(products) 
    ? Array.from(new Set(products.map((p: any) => p.category))).filter(Boolean)
    : [];

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

function CategoryList({ products, dbCategories }: { products: any[], dbCategories: any[] }) {
  // Merge categories from products and the dedicated categories table for a complete view
  const catNamesFromProducts = Array.isArray(products) 
    ? Array.from(new Set(products.map((p: any) => p.category))).filter(Boolean)
    : [];
  
  const allCategoryNames = Array.from(new Set([...catNamesFromProducts, ...dbCategories.map(c => c.name)]));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {allCategoryNames.map(cat => {
        const prodCount = products.filter(p => p.category === cat).length;
        const totalStock = products.filter(p => p.category === cat).reduce((sum, p) => sum + (parseFloat(p.stock || 0)), 0);
        const dbCat = dbCategories.find(c => c.name === cat);
        return (
          <Card key={cat} className="overflow-hidden hover:border-primary/30 transition-colors cursor-pointer group">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-bold uppercase tracking-tight text-sm text-gray-900 group-hover:text-primary transition-colors">{cat}</h3>
                <p className="text-xs text-muted-foreground font-medium">{prodCount} Products</p>
                {dbCat?.description && <p className="text-[10px] text-gray-400 italic line-clamp-1">{dbCat.description}</p>}
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Total Stock</p>
                <div className="flex items-center justify-end gap-1.5 mt-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                   <p className="text-xl font-black text-gray-900 leading-none">{totalStock}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      {allCategoryNames.length === 0 && (
         <div className="col-span-full p-20 text-center text-muted-foreground border-2 border-dashed border-zinc-500 rounded-xl bg-gray-50/30">No categories found in product master</div>
      )}
    </div>
  );
}

function BrandList({ products, dbBrands }: { products: any[], dbBrands: any[] }) {
  const brandNamesFromProducts = Array.isArray(products) 
    ? Array.from(new Set(products.map((p: any) => p.brand))).filter(Boolean)
    : [];
    
  const allBrandNames = Array.from(new Set([...brandNamesFromProducts, ...dbBrands.map(b => b.name)]));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {allBrandNames.map(brand => {
        const prodCount = products.filter(p => p.brand === brand).length;
        const totalStock = products.filter(p => p.brand === brand).reduce((sum, p) => sum + (parseFloat(p.stock || 0)), 0);
        const dbBrand = dbBrands.find(b => b.name === brand);
        return (
          <Card key={brand} className="overflow-hidden hover:border-primary/30 transition-colors cursor-pointer group">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-bold uppercase tracking-tight text-sm text-gray-900 group-hover:text-primary transition-colors">{brand}</h3>
                <p className="text-xs text-muted-foreground font-medium">{prodCount} Products</p>
                {dbBrand?.description && <p className="text-[10px] text-gray-400 italic line-clamp-1">{dbBrand.description}</p>}
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Inventory</p>
                <div className="flex items-center justify-end gap-1.5 mt-1">
                   <p className="text-xl font-black text-gray-900 leading-none">{totalStock}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      {allBrandNames.length === 0 && (
         <div className="col-span-full p-20 text-center text-muted-foreground border-2 border-dashed border-zinc-500 rounded-xl bg-gray-50/30">No brand data recorded yet</div>
      )}
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

  const categories = Array.isArray(products) 
    ? Array.from(new Set([
        ...products.map((p: any) => p.category), 
        ...(Array.isArray(initialData?.dbCategories) ? initialData.dbCategories : []).map((c: any) => c.name)
      ])).filter(Boolean)
    : [];
  const brands = Array.isArray(products)
    ? Array.from(new Set([
        ...products.map((p: any) => p.brand), 
        ...(Array.isArray(initialData?.dbBrands) ? initialData.dbBrands : []).map((b: any) => b.name)
      ])).filter(Boolean)
    : [];

  const handleSave = async () => {
    if (!formData.name) {
      toast({ variant: "destructive", title: "Missing Name", description: "Product name is required" });
      return;
    }
    setLoading(true);
    try {
      const { createdAt, ...saveData } = formData;
      const resource = tabName === 'categories' ? 'categories' : tabName === 'brands' ? 'brands' : 'products';
      const res = await fetch(`/api/core?resource=${resource}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saveData)
      });
      if (!res.ok) throw new Error(`Failed to save ${resource}`);
      toast({ title: "Success", description: `${title} saved successfully` });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: [resource] });
      setOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
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
      case "categories":
        return [
          { label: "Category Name", key: "name", span: true },
          { label: "Description", key: "description", span: true, type: "textarea" },
        ];
      case "brands":
        return [
          { label: "Brand Name", key: "name", span: true },
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
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "products";
  const setActiveTab = (v: string) => setSearchParams({ tab: v });
  const { data: products = [] } = useQuery({ 
    queryKey: ["products"], 
    queryFn: () => fetch("/api/core?resource=products").then(res => {
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    }) 
  });

  const { data: dbCategories = [] } = useQuery({ 
    queryKey: ["categories"], 
    queryFn: () => fetch("/api/core?resource=categories").then(res => res.ok ? res.json() : []) 
  });

  const { data: dbBrands = [] } = useQuery({ 
    queryKey: ["brands"], 
    queryFn: () => fetch("/api/core?resource=brands").then(res => res.ok ? res.json() : []) 
  });

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
            initialData={{ dbCategories, dbBrands }}
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
        <TabsContent value="categories" className="mt-4"><CategoryList products={products} dbCategories={dbCategories} /></TabsContent>
        <TabsContent value="brands" className="mt-4"><BrandList products={products} dbBrands={dbBrands} /></TabsContent>
        <TabsContent value="pricelists" className="mt-4">
          <div className="p-20 text-center text-muted-foreground border-2 border-dashed border-zinc-800 rounded-xl">Custom price lists for retail and wholesale contracts</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
