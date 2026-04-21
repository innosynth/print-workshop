import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, Loader2, Trash2, RefreshCw, Check, ChevronsUpDown, Calendar } from "lucide-react";
import { StatusBadge } from "./Dashboard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";


function FormCombobox({ label, value, options, onSelect, action, triggerRef, onKeyDown, autoOpen, openOnFocus, includeBlank, allowCustom, className }: { label: string, value: string, options: string[], onSelect: (v: string) => void, action?: React.ReactNode, triggerRef?: any, onKeyDown?: (e: React.KeyboardEvent) => void, autoOpen?: boolean, openOnFocus?: boolean, includeBlank?: boolean, allowCustom?: boolean, className?: string }) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState("");
  const [search, setSearch] = useState("");
  const justClosed = useRef(false);

  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (autoOpen) {
      const timer = setTimeout(() => setOpen(true), 150);
      return () => clearTimeout(timer);
    }
  }, [autoOpen]);

  useEffect(() => {
    if (open) {
      setHighlighted("___hidden_default___");
      setSearch("");
      const timer = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          className={cn("w-full mt-1 h-10 justify-between font-normal", className)}
          onFocus={() => {
            if (openOnFocus && !justClosed.current) {
              setOpen(true);
            }
            justClosed.current = false;
          }}
          onKeyDown={onKeyDown}
        >
          <span className="truncate">{value || `Select ${label.toLowerCase()}`}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 z-[100]" align="start">
        <Command value={highlighted} onValueChange={setHighlighted}>
          <CommandInput
            ref={inputRef}
            placeholder={`Search ${label.toLowerCase()}...`}
            className="h-9"
            onValueChange={setSearch}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const hasMatches = options.some(opt => opt.toLowerCase().includes(search.toLowerCase()));
                if (!hasMatches && allowCustom && search) {
                  justClosed.current = true;
                  onSelect(search);
                  setOpen(false);
                  if (onKeyDown) setTimeout(() => onKeyDown(e), 100);
                  return;
                }
                if (onKeyDown && (search || highlighted)) {
                  setTimeout(() => onKeyDown(e), 100);
                }
              }
            }}
          />
          <CommandList>
            <CommandEmpty className="p-0 text-xs p-4 text-center">No {label.toLowerCase()} found.</CommandEmpty>
            <CommandGroup className="p-0 h-0 overflow-hidden">
              <CommandItem value="___hidden_default___" onSelect={() => { justClosed.current = true; setOpen(false); onSelect(""); }} />
            </CommandGroup>
            <CommandGroup>
              {Array.from(new Set(options)).map((opt: string) => (
                <CommandItem
                  key={opt}
                  value={opt}
                  onSelect={() => {
                    justClosed.current = true;
                    onSelect(opt);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === opt ? "opacity-100" : "opacity-0")} />
                  {opt}
                </CommandItem>
              ))}
            </CommandGroup>
            {action && (
              <>
                <Separator />
                <div className="p-1">{action}</div>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function CreatePurchaseModal({ trigger, title, type }: { trigger: React.ReactNode; title: string, type: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Form States
  const [supplierId, setSupplierId] = useState("");
  const [isIgst, setIsIgst] = useState(false);
  const [orderNo, setOrderNo] = useState("");
  const [invNo, setInvNo] = useState("");
  const [createDate, setCreateDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [ourPoNo, setOurPoNo] = useState("");
  const [ourDcNo, setOurDcNo] = useState("");
  const [receivedAmount, setReceivedAmount] = useState("0");

  const [items, setItems] = useState<any[]>([{ 
    category: "", subCategory: "", sku: "", name: "", qty: 1, rate: 0, amount: 0, hsn: "", packing: "", 
    gstRate: "18", disPct: 0, unit: "Nos" 
  }]);

  // Navigation Refs
  const supplierRef = useRef<HTMLButtonElement>(null);
  const createDateRef = useRef<HTMLInputElement>(null);
  const dueDateRef = useRef<HTMLInputElement>(null);
  const invNoRef = useRef<HTMLInputElement>(null);
  const orderRef = useRef<HTMLInputElement>(null);
  const poRef = useRef<HTMLInputElement>(null);
  const dcRef = useRef<HTMLInputElement>(null);
  const saveBtnRef = useRef<HTMLButtonElement>(null);
  
  const categoryRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const subCategoryRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const itemProductRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const itemQtyRefs = useRef<(HTMLInputElement | null)[]>([]);
  const itemRateRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleEnter = (e: React.KeyboardEvent, nextRef: any) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (nextRef?.current) nextRef.current.focus();
      else if (nextRef?.focus) nextRef.focus();
    }
  };

  useEffect(() => {
    if (open) {
      setTimeout(() => supplierRef.current?.focus(), 150);
    }
  }, [open]);

  const { data: contacts = [] } = useQuery({ 
    queryKey: ["contacts-suppliers"], 
    queryFn: () => fetch("/api/core?resource=contacts").then(res => res.json()) 
  });
  const { data: allProducts = [] } = useQuery({ 
    queryKey: ["products"], 
    queryFn: () => fetch("/api/core?resource=products").then(res => res.json()) 
  });

  const suppliers = contacts.filter((c: any) => c.type === "Supplier" && c.status !== "Inactive");
  const products = allProducts.filter((p: any) => p.status === "Active" || !p.status);

  const addItem = () => setItems([...items, { 
    category: "", subCategory: "", sku: "", name: "", qty: 1, rate: 0, amount: 0, hsn: "", packing: "", 
    gstRate: "18", disPct: 0, unit: "Nos" 
  }]);

  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const updateItem = (index: number, field: string, value: any) => {
    setItems(prev => {
      const newItems = [...prev];
      if (!newItems[index]) return prev;

      newItems[index] = { ...newItems[index], [field]: value };
      
      const item = newItems[index];
      if (field === "category") {
        item.subCategory = "";
        item.name = "";
        item.sku = "";
      } else if (field === "subCategory") {
        item.name = "";
        item.sku = "";
      } else if (field === "name") {
        const match = products.find((p: any) => p.name === value);
        if (match) {
          item.sku = match.sku || "";
          item.category = match.category || item.category;
          item.subCategory = match.subCategory || item.subCategory;
          item.rate = parseFloat(match.purchasePrice) || 0;
          item.gstRate = match.gstRate || "18";
          item.hsn = match.hsnCode || "";
          item.unit = match.unit || "Nos";
        }
      }

      const qty = Number(item.qty || 0);
      const rate = Number(item.rate || 0);
      const disPct = Number(item.disPct || 0);
      
      const baseAmount = qty * rate;
      const discount = (baseAmount * (disPct / 100));
      item.amount = baseAmount - discount;
      
      return newItems;
    });
  };

  const calculateTotals = () => {
    const subTotal = items.reduce((sum, item) => sum + item.amount, 0);
    const totalTax = items.reduce((sum, item) => sum + (item.amount * (parseFloat(item.gstRate) / 100)), 0);
    const total = subTotal + totalTax;
    
    const cgst = isIgst ? 0 : totalTax / 2;
    const sgst = isIgst ? 0 : totalTax / 2;
    const igst = isIgst ? totalTax : 0;

    return { subTotal, totalTax, total, cgst, sgst, igst };
  };

  const { subTotal, totalTax, total, cgst, sgst, igst } = calculateTotals();

  const handleSave = async () => {
    if (!supplierId) {
      toast({ variant: "destructive", title: "Error", description: "Please select a supplier" });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        supplierId: parseInt(supplierId),
        date: createDate,
        dueDate: dueDate,
        invNo: invNo,
        orderNo: orderNo,
        ourPoNo: ourPoNo,
        ourDcNo: ourDcNo,
        isIgst: isIgst,
        amount: subTotal.toString(),
        tax: totalTax.toString(),
        total: Math.round(total).toString(),
        receivedAmount: receivedAmount,
        items: items.filter(i => i.name.trim() !== "")
      };

      const res = await fetch(`/api/sales?resource=purchases&type=${type === 'expenses' ? 'expenses' : type === 'entry' ? 'entries' : type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to save");
      toast({ title: "Success", description: `${title} created successfully` });
      queryClient.invalidateQueries({ queryKey: ["purchase-entries"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      setOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if(!v) { 
      setItems([{ category: "", subCategory: "", sku: "", name: "", qty: 1, rate: 0, amount: 0, hsn: "", packing: "", gstRate: "18", disPct: 0, unit: "Nos" }]);
      setSupplierId(""); setInvNo(""); setOrderNo(""); setOurPoNo(""); setOurDcNo("");
    }}}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden flex flex-col transition-all duration-300">
        <DialogHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0 pr-12">
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" /> {title}
          </DialogTitle>
          <div className="flex gap-4">
             <div className="text-right">
                <p className="text-[0.625rem] font-black text-muted-foreground uppercase opacity-70 leading-none">Grand Total</p>
                <p className="text-sm font-black text-green-600 tabular-nums">₹{Math.round(total).toLocaleString()}</p>
             </div>
          </div>
        </DialogHeader>

        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Header Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-2 space-y-2">
              <Label className="text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground">Supplier (From)*</Label>
              <FormCombobox
                triggerRef={supplierRef}
                autoOpen={true}
                openOnFocus={true}
                onKeyDown={(e) => handleEnter(e, invNoRef)}
                label="Supplier"
                value={suppliers.find((s: any) => s.id.toString() === supplierId)?.name || ""}
                options={suppliers.map((s: any) => s.name)}
                onSelect={(v) => {
                   const s = suppliers.find((s: any) => s.name === v);
                   if (s) setSupplierId(s.id.toString());
                }}
                action={
                  <Button variant="ghost" className="w-full justify-start text-xs font-bold text-primary gap-2 h-9 px-2 hover:bg-primary/5 border-b rounded-none" onClick={() => { setOpen(false); navigate("/contacts?tab=suppliers&action=add"); }}>
                    <Plus className="h-3 w-3" /> ADD NEW SUPPLIER
                  </Button>
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground">Invoice No.</Label>
              <Input 
                ref={invNoRef}
                value={invNo} 
                onChange={e => setInvNo(e.target.value)} 
                onKeyDown={e => handleEnter(e, createDateRef)}
                placeholder="INV-XXX"
                className="h-10 border-muted-foreground/20 focus-visible:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground">Date</Label>
              <Input 
                ref={createDateRef}
                type="date" 
                value={createDate} 
                onChange={e => setCreateDate(e.target.value)} 
                onKeyDown={e => handleEnter(e, dueDateRef)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground">Due Date</Label>
              <Input 
                ref={dueDateRef}
                type="date" 
                value={dueDate} 
                onChange={e => setDueDate(e.target.value)} 
                onKeyDown={e => handleEnter(e, orderRef)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground">Order No.</Label>
              <Input 
                ref={orderRef}
                value={orderNo} 
                onChange={e => setOrderNo(e.target.value)} 
                onKeyDown={e => handleEnter(e, poRef)}
                placeholder="PO-XXX"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground">Our PO #</Label>
              <Input 
                ref={poRef}
                value={ourPoNo} 
                onChange={e => setOurPoNo(e.target.value)} 
                onKeyDown={e => handleEnter(e, dcRef)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground">Our DC #</Label>
              <Input 
                ref={dcRef}
                value={ourDcNo} 
                onChange={e => setOurDcNo(e.target.value)} 
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    categoryRefs.current[0]?.focus();
                  }
                }}
                className="h-10"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Checkbox id="isIgst" checked={isIgst} onCheckedChange={(v) => setIsIgst(!!v)} />
              <Label htmlFor="isIgst" className="text-xs font-black uppercase tracking-tighter">IGST (Interstate)</Label>
            </div>
          </div>

          <Separator />
          
          {/* Items Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-[0.625rem] font-black uppercase tracking-widest text-muted-foreground">Items & Procurement Details</Label>
              <Button variant="ghost" size="sm" onClick={addItem} className="h-7 text-[0.625rem] font-bold text-primary gap-1 hover:bg-primary/5">
                <Plus className="h-3 w-3" /> Add New Row
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, i) => {
                const categories = Array.from(new Set(products.map((p: any) => p.category))).filter(Boolean) as string[];
                const subCategories = Array.from(new Set(products.filter((p: any) => p.category === item.category).map((p: any) => p.subCategory))).filter(Boolean) as string[];
                const filteredProducts = products.filter((p: any) => 
                  (!item.category || p.category === item.category) && 
                  (!item.subCategory || p.subCategory === item.subCategory)
                );

                return (
                  <div key={i} className="relative p-4 border rounded-xl bg-white shadow-sm hover:shadow-md transition-all group border-muted-foreground/10 bg-muted/5">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                      
                      {/* Category & Sub Category */}
                      <div className="md:col-span-2 space-y-1.5">
                        <Label className="text-[0.625rem] uppercase font-bold text-muted-foreground tracking-tight">Category</Label>
                        <FormCombobox
                          triggerRef={(el: any) => categoryRefs.current[i] = el}
                          openOnFocus={true}
                          label="Category"
                          className="h-9 mt-0 bg-white"
                          value={item.category}
                          options={categories}
                          onSelect={(v) => {
                            updateItem(i, "category", v);
                            setTimeout(() => subCategoryRefs.current[i]?.focus(), 100);
                          }}
                          onKeyDown={(e) => {
                             if (e.key === "Enter" && !item.category) {
                                e.preventDefault();
                                saveBtnRef.current?.focus();
                             } else {
                                handleEnter(e, subCategoryRefs.current[i]);
                             }
                          }}
                        />
                      </div>
                      <div className="md:col-span-2 space-y-1.5">
                        <Label className="text-[0.625rem] uppercase font-bold text-muted-foreground tracking-tight">Sub Category</Label>
                        <FormCombobox
                          triggerRef={(el: any) => subCategoryRefs.current[i] = el}
                          openOnFocus={true}
                          label="Sub Category"
                          className="h-9 mt-0 bg-white"
                          value={item.subCategory}
                          options={subCategories}
                          onSelect={(v) => {
                            updateItem(i, "subCategory", v);
                            setTimeout(() => itemProductRefs.current[i]?.focus(), 100);
                          }}
                          onKeyDown={(e) => handleEnter(e, itemProductRefs.current[i])}
                        />
                      </div>

                      {/* Product */}
                      <div className="md:col-span-3 space-y-1.5">
                        <Label className="text-[0.625rem] uppercase font-bold text-muted-foreground tracking-tight">Product / SKU</Label>
                        <FormCombobox
                          triggerRef={(el: any) => itemProductRefs.current[i] = el}
                          openOnFocus={true}
                          label="Product"
                          className="h-9 mt-0 bg-white"
                          value={item.name}
                          options={filteredProducts.map((p: any) => p.name)}
                          onSelect={(v) => updateItem(i, "name", v)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              if (!item.name) {
                                e.preventDefault();
                                saveBtnRef.current?.focus();
                              } else {
                                handleEnter(e, itemQtyRefs.current[i]);
                              }
                            }
                          }}
                        />
                      </div>

                      {/* Financials: Qty, Rate, GST, Disc */}
                      <div className="md:col-span-4 grid grid-cols-4 gap-2">
                         <div className="space-y-1.5">
                          <Label className="text-[0.625rem] uppercase font-bold text-muted-foreground tracking-tight text-center block">Qty</Label>
                          <Input ref={el => itemQtyRefs.current[i] = el} type="number" value={item.qty} onChange={e => updateItem(i, "qty", e.target.value)} onKeyDown={e => handleEnter(e, itemRateRefs.current[i])} className="h-9 text-xs text-center font-bold bg-white" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[0.625rem] uppercase font-bold text-muted-foreground tracking-tight">Rate</Label>
                          <Input ref={el => itemRateRefs.current[i] = el} type="number" value={item.rate} onChange={e => updateItem(i, "rate", e.target.value)} onKeyDown={e => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              if (i === items.length - 1) {
                                addItem();
                                setTimeout(() => categoryRefs.current[i+1]?.focus(), 100);
                              } else {
                                categoryRefs.current[i+1]?.focus();
                              }
                            }
                          }} className="h-9 text-xs font-bold px-1 bg-white" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[0.625rem] uppercase font-bold text-muted-foreground tracking-tight text-center block">GST%</Label>
                          <Input type="number" value={item.gstRate} onChange={e => updateItem(i, "gstRate", e.target.value)} className="h-9 text-xs text-center px-1 bg-white" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[0.625rem] uppercase font-bold text-muted-foreground tracking-tight text-center block">Disc%</Label>
                          <Input type="number" value={item.disPct} onChange={e => updateItem(i, "disPct", e.target.value)} className="h-9 text-xs text-center px-1 bg-white" placeholder="0" />
                        </div>
                      </div>

                      <div className="md:col-span-1 flex items-center justify-end gap-1">
                         <div className="text-right flex-1 bg-primary/5 p-1 rounded-md border border-primary/10 overflow-hidden">
                            <p className="text-[0.4375rem] font-black text-muted-foreground uppercase opacity-70 leading-tight">Total</p>
                            <p className="text-[0.625rem] font-black text-primary tabular-nums truncate">₹{item.amount.toFixed(0)}</p>
                         </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive shrink-0" onClick={() => removeItem(i)} disabled={items.length === 1}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer with Totals */}
        <div className="p-6 bg-muted/40 border-t mt-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
             <div className="flex gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[0.625rem] font-black uppercase tracking-widest text-muted-foreground">Received Amount</Label>
                  <div className="relative w-40">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₹</span>
                    <Input type="number" value={receivedAmount} onChange={e => setReceivedAmount(e.target.value)} className="pl-7 h-10 font-bold bg-white" />
                  </div>
                </div>
             </div>

             <div className="flex gap-12 text-right">
                <div className="space-y-0.5">
                   <p className="text-[0.625rem] font-black text-muted-foreground uppercase opacity-70">Subtotal</p>
                   <p className="text-sm font-bold tabular-nums">₹{subTotal.toFixed(2)}</p>
                </div>
                <div className="space-y-0.5">
                   <p className="text-[0.625rem] font-black text-muted-foreground uppercase opacity-70">{isIgst ? 'IGST' : 'CGST + SGST'}</p>
                   <p className="text-sm font-bold tabular-nums text-orange-600">₹{totalTax.toFixed(2)}</p>
                </div>
                <div className="space-y-0.5">
                   <p className="text-[0.625rem] font-black text-muted-foreground uppercase opacity-70">Grand Total</p>
                   <p className="text-xl font-black text-primary tabular-nums tracking-tighter">₹{Math.round(total).toLocaleString()}</p>
                </div>
             </div>

             <div className="flex gap-2">
                <Button variant="outline" className="h-11 px-8 font-bold text-xs uppercase tracking-widest" onClick={() => setOpen(false)}>Cancel</Button>
                <Button 
                   ref={saveBtnRef}
                  disabled={loading} 
                  className="h-11 px-10 font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20"
                  onClick={handleSave}
                >
                  {loading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                  Save Purchase Record
                </Button>
             </div>
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
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "entries";
  const setActiveTab = (v: string) => setSearchParams({ tab: v });
  const [showCreateModal, setShowCreateModal] = useState(false);

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
