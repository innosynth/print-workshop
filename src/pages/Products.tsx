import { useState, useRef, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Check, ChevronsUpDown, Search, Plus, Upload, Edit2, UserPlus, Loader2, Calendar, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./Dashboard";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";


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

function ProductList({ products, isLoading, isError }: { products: any[], isLoading: boolean, isError: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [showInactive, setShowInactive] = useState(false);

  const inactiveCount = (products || []).filter((p: any) => p.status === "Inactive").length;

  const categories = Array.isArray(products) 
    ? Array.from(new Set(products.map((p: any) => p.category))).filter(Boolean)
    : [];

  const filtered = (products || [])
    .filter((p: any) => {
      const matchesCategory = catFilter === "all" || p.category === catFilter;
      const matchesStatus = showInactive || p.status === "Active" || !p.status;
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
        (p.brand && p.brand.toLowerCase().includes(search.toLowerCase())) ||
        (p.hsnCode && p.hsnCode.toLowerCase().includes(search.toLowerCase()));
      return matchesCategory && matchesStatus && matchesSearch;
    });

  const toggleStatus = async (product: any) => {
    const newStatus = product.status === "Active" ? "Inactive" : "Active";
    try {
      const res = await fetch("/api/core?resource=products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...product, status: newStatus })
      });
      if (!res.ok) throw new Error("Failed to toggle status");
      toast({ title: "Status Updated", description: `"${product.name}" is now ${newStatus}` });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search SKU, name, brand..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <FormCombobox 
            label="Category" 
            value={catFilter === "all" ? "" : catFilter} 
            options={categories} 
            onSelect={(v) => setCatFilter(v)} 
          />
          {catFilter !== 'all' && (
            <Button variant="ghost" size="sm" onClick={() => setCatFilter('all')} className="h-9 text-xs">Clear</Button>
          )}
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 rounded-lg border border-muted-foreground/10">
          <Checkbox 
            id="show-inactive" 
            checked={showInactive} 
            onCheckedChange={(v) => setShowInactive(!!v)}
            className="h-4 w-4 border-muted-foreground/30 data-[state=checked]:bg-primary"
          />
          <Label htmlFor="show-inactive" className="text-[0.625rem] font-bold uppercase tracking-widest text-muted-foreground cursor-pointer select-none">Show Inactive</Label>
        </div>

        <div className="flex items-center gap-4 text-[0.625rem] font-black uppercase tracking-widest text-muted-foreground bg-muted/20 px-4 h-9 rounded-lg border border-muted-foreground/10">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1 h-1 rounded-full bg-gray-400" />
            <span className="opacity-70">Total:</span> {products.length}
          </div>
          <div className="flex items-center gap-1.5 text-primary whitespace-nowrap">
            <span className="w-1 h-1 rounded-full bg-primary" />
            <span className="opacity-70">Active:</span> {products.filter((p: any) => p.status === "Active" || !p.status).length}
          </div>
          <div className="flex items-center gap-1.5 text-orange-600 whitespace-nowrap">
            <span className="w-1 h-1 rounded-full bg-orange-600" />
            <span className="opacity-70">Inactive:</span> {inactiveCount}
          </div>
        </div>

        <div className="ml-auto">
          <BulkImportModal 
            trigger={<Button variant="outline" size="sm" className="h-9 gap-1"><Upload className="h-3.5 w-3.5" />Bulk Import</Button>}
          />
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto border rounded-lg h-[calc(100vh-280px)] relative bg-white shadow-inner">
            {isLoading ? (
              <div className="h-full flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : isError ? (
              <div className="h-full flex items-center justify-center p-8 text-destructive">Failed to load products</div>
            ) : (
              <table className="w-full text-sm min-w-[1700px] border-collapse">
                <thead className="sticky top-0 z-20 bg-white shadow-sm">
                  <tr className="border-b bg-muted/40 font-bold">
                    {["SKU", "Product Name", "Category", "Sub Category", "Stock", "GST %", "Selling Price", "Brand Name", "Purchase Price", "HSN", "Rack", "Part No.", "Barcode", "Status", "Type", ""].map(h => (
                      <th key={h} className="text-left px-4 py-4 text-[0.6875rem] uppercase tracking-wider font-black text-muted-foreground whitespace-nowrap border-b-2 border-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted/50">
                  {filtered.map((p: any) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors whitespace-nowrap group">
                      <td className="px-4 py-3">
                        <CreateProductModal 
                           tabName="products" 
                           products={products}
                           initialData={p}
                           title="Edit Product"
                           trigger={
                             <button className="font-mono text-xs text-primary font-bold hover:underline underline-offset-4 decoration-primary/30">
                               {p.sku || "EDIT"}
                             </button>
                           }
                        />
                      </td>
                      <td className="px-4 py-3">
                        <CreateProductModal 
                           tabName="products" 
                           products={products}
                           initialData={p}
                           title="Edit Product"
                           trigger={
                             <button className="font-medium text-primary hover:underline underline-offset-4 decoration-primary/30">
                               {p.name}
                             </button>
                           }
                        />
                      </td>
                      <td className="px-4 py-3"><Badge variant="outline" className="text-[0.625rem] font-bold uppercase">{p.category}</Badge></td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{p.subCategory || "—"}</td>
                      <td className={`px-4 py-3 tabular-nums font-bold ${p.stock === 0 ? "text-destructive" : parseFloat(p.stock) < parseFloat(p.minStock) ? "text-yellow-600" : "text-primary"
                        }`}>{p.stock}</td>
                      <td className="px-4 py-3 tabular-nums font-bold text-orange-600">{p.gstRate ? `${p.gstRate}%` : "—"}</td>
                      <td className="px-4 py-3 tabular-nums font-black text-gray-900">₹{p.sellPrice}</td>
                      <td className="px-4 py-3 text-muted-foreground font-medium">{p.brand || "—"}</td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">₹{p.purchasePrice}</td>
                      <td className="px-4 py-3 font-mono text-xs text-primary font-bold">{p.hsnCode || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs">{p.rack || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.partNo || "—"}</td>
                      <td className="px-4 py-3 font-mono text-[0.625rem] text-muted-foreground">{p.barcode || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={p.status === "Active" || !p.status} 
                            onCheckedChange={() => toggleStatus(p)}
                            className="scale-75 data-[state=checked]:bg-primary"
                          />
                          <StatusBadge status={p.status || "Active"} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">{p.type || "PRODUCT"}</td>
                      <td className="px-4 py-3 text-right">
                        <CreateProductModal 
                          tabName="products" 
                          products={products}
                          initialData={p}
                          title="Edit Product"
                          trigger={
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-primary/10 hover:text-primary transition-all text-muted-foreground/50">
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                          }
                        />
                      </td>
                    </tr>
                  ))}
                  {isLoading ? (
                    <tr><td colSpan={16} className="px-4 py-8 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading products...</td></tr>
                  ) : filtered.length === 0 && (
                    <tr><td colSpan={16} className="px-4 py-12 text-center text-muted-foreground italic">No products found in the catalog</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
      {filtered.length !== products.length && (
        <p className="text-[0.5625rem] font-medium text-muted-foreground/60 italic lowercase ml-1">
          Showing {filtered.length} products matching filters
        </p>
      )}
    </div>
  );
}

function CategoryList({ products, dbCategories }: { products: any[], dbCategories: any[] }) {
  const [search, setSearch] = useState("");
  const catNamesFromProducts = Array.isArray(products) 
    ? Array.from(new Set(products.map((p: any) => p.category))).filter(Boolean)
    : [];
  
  const allCategoryNames = Array.from(new Set([...catNamesFromProducts, ...dbCategories.map(c => c.name)]))
    .filter(cat => cat.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search categories..." 
          className="pl-9 h-10 shadow-sm transition-all focus:ring-primary/20" 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
      </div>
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
                  {dbCat?.description && <p className="text-[0.625rem] text-gray-400 italic line-clamp-1">{dbCat.description}</p>}
                </div>
                <div className="text-right">
                  <p className="text-[0.5625rem] font-black text-gray-400 uppercase tracking-[0.2em]">Total Stock</p>
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
           <div className="col-span-full p-20 text-center text-muted-foreground border-2 border-dashed border-zinc-500 rounded-xl bg-gray-50/30 font-medium italic">No categories found matching your search</div>
        )}
      </div>
    </div>
  );
}

function BrandList({ products, dbBrands }: { products: any[], dbBrands: any[] }) {
  const [search, setSearch] = useState("");
  const brandNamesFromProducts = Array.isArray(products) 
    ? Array.from(new Set(products.map((p: any) => p.brand))).filter(Boolean)
    : [];
  
  const allBrandNames = Array.from(new Set([...brandNamesFromProducts, ...dbBrands.map(b => b.name)]))
    .filter(brand => brand.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search brands..." 
          className="pl-9 h-10 shadow-sm transition-all focus:ring-primary/20" 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
      </div>
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
                  {dbBrand?.description && <p className="text-[0.625rem] text-gray-400 italic line-clamp-1">{dbBrand.description}</p>}
                </div>
                <div className="text-right">
                  <p className="text-[0.5625rem] font-black text-gray-400 uppercase tracking-[0.2em]">Total Stock</p>
                  <div className="flex items-center justify-end gap-1.5 mt-1">
                     <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                     <p className="text-xl font-black text-gray-900 leading-none">{totalStock}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {allBrandNames.length === 0 && (
           <div className="col-span-full p-20 text-center text-muted-foreground border-2 border-dashed border-zinc-500 rounded-xl bg-gray-50/30 font-medium italic">No brands found matching your search</div>
        )}
      </div>
    </div>
  );
}

function PriceListRatesModal({ priceList, products, trigger }: { priceList: any, products: any[], trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  
  const { data: rates = [], isLoading } = useQuery({
    queryKey: ["pricelistitems", priceList.id],
    queryFn: () => fetch(`/api/core?resource=pricelistitems&priceListId=${priceList.id}`).then(res => res.json()),
    enabled: open
  });

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const updateRate = async (productId: number, newPrice: string) => {
    const existingRate = rates.find((r: any) => r.productId === productId);
    try {
      const res = await fetch(`/api/core?resource=pricelistitems`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: existingRate?.id,
          priceListId: priceList.id,
          productId,
          customPrice: newPrice
        })
      });
      if (!res.ok) throw new Error("Failed to update rate");
      queryClient.invalidateQueries({ queryKey: ["pricelistitems", priceList.id] });
      toast({ title: "Rate Updated", description: "The custom price has been saved." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update Failed", description: err.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl h-[58rem] max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 border-b">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Rates for {priceList.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-4 border-b bg-gray-50/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search products to set rates..." 
              className="pl-9 h-9 bg-white" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-0">
          <table className="w-full text-sm text-left">
            <thead className="text-[0.625rem] uppercase font-bold text-muted-foreground bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3">Product Name</th>
                <th className="px-6 py-3">Standard Price</th>
                <th className="px-6 py-3 w-[200px]">Custom Rate (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProducts.map(p => {
                const rate = rates.find((r: any) => r.productId === p.id);
                return (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{p.name}</p>
                      <p className="text-[0.625rem] text-muted-foreground">{p.sku}</p>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-medium">₹{p.sellPrice}</td>
                    <td className="px-6 py-4">
                      <Input 
                        type="number" 
                        defaultValue={rate?.customPrice || p.sellPrice} 
                        className={`h-8 font-bold ${rate ? 'border-primary/50 bg-primary/5' : ''}`}
                        onBlur={(e) => {
                          if (e.target.value !== (rate?.customPrice || p.sellPrice)) {
                            updateRate(p.id, e.target.value);
                          }
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t flex justify-end">
          <Button onClick={() => setOpen(false)}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PriceListView({ pricelists, isLoading, products }: { pricelists: any[], isLoading: boolean, products: any[] }) {
  const [search, setSearch] = useState("");
  
  const filtered = (pricelists || []).filter((p: any) => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search price lists..." 
          className="pl-9 h-10 shadow-sm" 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((pl: any) => (
          <Card key={pl.id} className="overflow-hidden hover:border-primary/30 transition-all cursor-pointer group shadow-sm">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-primary/5 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <StatusBadge status={pl.status} />
              </div>
              <div className="space-y-3">
                <h3 className="font-bold text-base text-gray-900 group-hover:text-primary transition-colors">{pl.name}</h3>
                {pl.description && <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{pl.description}</p>}
                
                <div className="pt-3 border-t flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span className="text-[0.625rem] font-medium">Starts: {pl.effectiveFrom ? new Date(pl.effectiveFrom).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <PriceListRatesModal 
                    priceList={pl} 
                    products={products}
                    trigger={<Button variant="ghost" size="sm" className="h-7 text-[0.625rem] uppercase font-bold tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">View Rates</Button>}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {isLoading ? (
           <div className="col-span-full p-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
        ) : filtered.length === 0 && (
           <div className="col-span-full p-20 text-center text-muted-foreground border-2 border-dashed border-zinc-500 rounded-xl bg-gray-50/30 font-medium">No price lists found matching your search</div>
        )}
      </div>
    </div>
  );
}

function FormCombobox({ label, value, options, onSelect, triggerRef, onKeyDown, openOnFocus }: { label: string, value: string, options: string[], onSelect: (v: string) => void, triggerRef?: any, onKeyDown?: (e: React.KeyboardEvent) => void, openOnFocus?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          ref={triggerRef}
          variant="outline" 
          role="combobox" 
          className="w-full mt-1 h-9 justify-between font-normal"
          onKeyDown={onKeyDown}
          onFocus={() => openOnFocus && setOpen(true)}
        >
          {value || `Select ${label.toLowerCase()}`}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 z-[100]">
        <Command>
          <CommandInput placeholder={`Search ${label.toLowerCase()}...`} className="h-9" />
          <CommandList>
            <CommandEmpty>No {label.toLowerCase()} found.</CommandEmpty>
            <CommandGroup>
              {Array.from(new Set(options)).map((opt: string) => (
                <CommandItem
                  key={opt}
                  value={opt}
                  onSelect={() => {
                    onSelect(opt);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === opt ? "opacity-100" : "opacity-0")} />
                  {String(opt)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function CreateProductModal({ trigger, title, tabName, products, initialData }: { trigger: React.ReactNode; title: string, tabName: string, products: any[], initialData?: any }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const defaultValues = {
    sku: `SKU-${Date.now().toString().slice(-4)}`,
    name: "",
    category: "",
    subCategory: "",
    brand: "",
    type: "SERVICE",
    sellPrice: "0",
    purchasePrice: "0",
    stock: "0",
    minStock: "10",
    unit: "Nos.",
    rack: "",
    partNo: "",
    barcode: "",
    hsnCode: "",
    gstRate: "18",
    description: "",
    status: "Active"
  };

  const [formData, setFormData] = useState<any>(initialData?.id ? initialData : { ...defaultValues, ...initialData });
  const fieldRefs = useRef<Record<string, any>>({});
  const saveBtnRef = useRef<HTMLButtonElement>(null);

  const handleEnter = (e: React.KeyboardEvent, nextKey?: string, isLast?: boolean) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (isLast) {
        saveBtnRef.current?.focus();
      } else if (nextKey) {
        fieldRefs.current[nextKey]?.focus();
        if (fieldRefs.current[nextKey] instanceof HTMLInputElement) {
          fieldRefs.current[nextKey]?.select();
        }
      }
    }
  };

  const resetForm = () => setFormData(initialData?.id ? initialData : { ...defaultValues, ...initialData });

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
      const resource = tabName === 'categories' ? 'categories' : tabName === 'brands' ? 'brands' : tabName === 'pricelists' ? 'pricelists' : 'products';
      const res = await fetch(`/api/core?resource=${resource}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saveData)
      });
      if (!res.ok) throw new Error(`Failed to save ${resource}`);
      toast({ title: "Success", description: `${title} saved successfully` });
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      await queryClient.invalidateQueries({ queryKey: ["brands"] });
      await queryClient.invalidateQueries({ queryKey: ["pricelists"] });
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
          { label: "Sub Category", key: "subCategory", span: false },
          { label: "Brand", key: "brand", span: false, isBrand: true },
          { label: "Stock", key: "stock", span: false, type: "number" },
          { label: "Sell Price (₹)", key: "sellPrice", span: false, type: "number" }, 
          { label: "Purchase Price (₹)", key: "purchasePrice", span: false, type: "number" },
          { label: "HSN Code", key: "hsnCode", span: false },
          { label: "GST Rate (%)", key: "gstRate", span: false, type: "number" },
          { label: "Min Stock", key: "minStock", span: false, type: "number" }, 
          { label: "Unit", key: "unit", span: false },
          { label: "Rack/Location", key: "rack", span: false }, 
          { label: "Part No.", key: "partNo", span: false },
          { label: "Barcode", key: "barcode", span: false },
          { label: "Type", key: "type", span: false, isToggle: true, options: ["PRODUCT", "SERVICE"] }, 
          { label: "Status", key: "status", span: false, isToggle: true, options: ["Active", "Inactive"] }, 
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
      case "pricelists":
        return [
          { label: "List Name", key: "name", span: true },
          { label: "Effective From", key: "effectiveFrom", span: false, type: "date" },
          { label: "Status", key: "status", span: false, isToggle: true, options: ["Active", "Inactive"] },
          { label: "Description", key: "description", span: true, type: "textarea" },
        ];
      default: return [];
    }
  };

  const fields = getFields();

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if(!v) resetForm(); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[45rem] overflow-y-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
          {fields.map((f, i) => (
            <div key={f.label} className={f.span ? "col-span-2" : ""}>
              <Label className="text-xs font-medium text-muted-foreground">{f.label}</Label>
              {f.isCategory ? (
                <FormCombobox 
                  triggerRef={(el: any) => fieldRefs.current[f.key as string] = el}
                  onKeyDown={(e) => handleEnter(e, fields[i + 1]?.key as string, i === fields.length - 1)}
                  openOnFocus
                  label={f.label} 
                  value={formData.category} 
                  options={categories} 
                  onSelect={(v) => {
                    setFormData({ ...formData, category: v });
                    setTimeout(() => fieldRefs.current[fields[i+1]?.key as string]?.focus(), 100);
                  }} 
                />
              ) : f.isBrand ? (
                <FormCombobox 
                  triggerRef={(el: any) => fieldRefs.current[f.key as string] = el}
                  onKeyDown={(e) => handleEnter(e, fields[i + 1]?.key as string, i === fields.length - 1)}
                  openOnFocus
                  label={f.label} 
                  value={formData.brand} 
                  options={brands} 
                  onSelect={(v) => {
                    setFormData({ ...formData, brand: v });
                    setTimeout(() => fieldRefs.current[fields[i+1]?.key as string]?.focus(), 100);
                  }} 
                />
              ) : f.isToggle ? (
                <ToggleGroup 
                  ref={(el: any) => fieldRefs.current[f.key as string] = el}
                  type="single" 
                  className="justify-start mt-1 gap-0 border rounded-lg w-fit overflow-hidden h-9" 
                  value={formData[f.key as string]} 
                  onValueChange={(v) => v && setFormData({ ...formData, [f.key as string]: v })}
                  onKeyDown={(e) => handleEnter(e, fields[i + 1]?.key as string, i === fields.length - 1)}
                >
                  {f.options?.map((opt: string) => (
                    <ToggleGroupItem 
                      key={opt} 
                      value={opt} 
                      className="px-4 text-[0.625rem] font-bold uppercase tracking-tight rounded-none border-r last:border-0 data-[state=on]:bg-primary data-[state=on]:text-white h-full"
                    >
                      {opt}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              ) : f.type === "textarea" ? (
                <Textarea 
                  ref={(el: any) => fieldRefs.current[f.key as string] = el}
                  className="mt-1 h-20" 
                  placeholder={f.label} 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  onKeyDown={(e) => handleEnter(e, fields[i + 1]?.key as string, i === fields.length - 1)}
                />
              ) : (
                <Input 
                  ref={(el: any) => fieldRefs.current[f.key as string] = el}
                  className="mt-1 h-9" 
                  placeholder={f.label} 
                  type={f.type || "text"} 
                  value={formData[f.key as string]} 
                  onChange={e => setFormData({...formData, [f.key as string]: e.target.value})} 
                  onKeyDown={(e) => handleEnter(e, fields[i + 1]?.key as string, i === fields.length - 1)}
                />
              )}
            </div>
          ))}
          <div className="col-span-2 flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button ref={saveBtnRef} size="sm" onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {formData.id ? `Update ${title.split(' ').pop()}` : `Save ${title.split(' ').pop()}`}
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
  const { data: products = [], isLoading: productsLoading, isError: productsError } = useQuery({ 
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

  const { data: pricelists = [], isLoading: pricelistsLoading } = useQuery({ 
    queryKey: ["pricelists"], 
    queryFn: () => fetch("/api/core?resource=pricelists").then(res => res.ok ? res.json() : []) 
  });

  const getNewButtonLabel = (tab: string) => {
    switch (tab) {
      case "products": return "Add New Product";
      case "categories": return "Add New Category";
      case "brands": return "Add New Brand";
      case "pricelists": return "Add New Price List";
      default: return "Add New";
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold">My Items</h1>
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

        <TabsContent value="products" className="mt-4"><ProductList products={products} isLoading={productsLoading} isError={productsError} /></TabsContent>
        <TabsContent value="categories" className="mt-4"><CategoryList products={products} dbCategories={dbCategories} /></TabsContent>
        <TabsContent value="brands" className="mt-4"><BrandList products={products} dbBrands={dbBrands} /></TabsContent>
        <TabsContent value="pricelists" className="mt-4">
          <PriceListView pricelists={pricelists} isLoading={pricelistsLoading} products={products} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
