import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, Loader2, Trash2, RefreshCw, Check, ChevronsUpDown, Calendar, FileText, Save, Edit, RefreshCcw } from "lucide-react";
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


function FormCombobox({ label, value, options, onSelect, action, triggerRef, onKeyDown, autoOpenTrigger, openOnFocus, includeBlank, allowCustom, className }: { label: string, value: string, options: string[], onSelect: (v: string) => void, action?: React.ReactNode, triggerRef?: any, onKeyDown?: (e: React.KeyboardEvent) => void, autoOpenTrigger?: number, openOnFocus?: boolean, includeBlank?: boolean, allowCustom?: boolean, className?: string }) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState("");
  const [search, setSearch] = useState("");
  const justClosed = useRef(false);

  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (autoOpenTrigger && autoOpenTrigger > 0) {
      const timer = setTimeout(() => {
        setOpen(true);
        justClosed.current = false;
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [autoOpenTrigger]);

  useEffect(() => {
    if (open) {
      setHighlighted("___hidden_default___");
      setSearch("");
      const timer = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        justClosed.current = false;
      }, 150);
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
          className={cn("w-full mt-1 h-8 justify-between font-normal text-[0.75rem] px-2", className)}
          title={value || `Select ${label.toLowerCase()}`}
          onFocus={(e) => {
            if (openOnFocus && !open && !justClosed.current) {
              setTimeout(() => setOpen(true), 100);
            }
            justClosed.current = false;
          }}
          onKeyDown={onKeyDown}
        >
          <span className="truncate" title={value || `Select ${label.toLowerCase()}`}>{value || `Select ${label.toLowerCase()}`}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 z-[100]" align="start">
        <Command value={highlighted} onValueChange={setHighlighted}>
          <CommandInput
            ref={inputRef}
            placeholder={`Search ${label.toLowerCase()}...`}
            className="h-7 text-xs"
            onValueChange={setSearch}
            onKeyDown={(e) => {
               if (onKeyDown && e.shiftKey && (e.key === 'Tab' || e.key === 'Enter')) {
                setOpen(false);
                setTimeout(() => onKeyDown(e), 100);
                return;
              }
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
                  title={opt}
                  onSelect={() => {
                    justClosed.current = true;
                    onSelect(opt);
                    setOpen(false);
                  }}
                  className="cursor-default text-xs"
                >
                  <Check className={cn("mr-2 h-3 w-3", value === opt ? "opacity-100" : "opacity-0")} />
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

function CreatePurchaseModal({ trigger, title, type, open: controlledOpen, onOpenChange: controlledOnOpenChange }: { trigger: React.ReactNode; title: string, type: string, open?: boolean, onOpenChange?: (open: boolean) => void }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange !== undefined ? controlledOnOpenChange : setInternalOpen;
  
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
  const [gstEnabled, setGstEnabled] = useState(true);

  const [items, setItems] = useState<any[]>([]);
  const [pendingItem, setPendingItem] = useState({
    category: "", subCategory: "", sku: "", name: "", qty: 1, rate: 0, amount: 0, hsn: "", packing: "", 
    gstRate: "18", disPct: 0, unit: "Nos" 
  });

  const [focusNextItemTrigger, setFocusNextItemTrigger] = useState(0);
  const [productTrigger, setProductTrigger] = useState(0);
  const [subCategoryTrigger, setSubCategoryTrigger] = useState(0);

  // Navigation Refs
  const supplierRef = useRef<HTMLButtonElement>(null);
  const invNoRef = useRef<HTMLInputElement>(null);
  const createDateRef = useRef<HTMLInputElement>(null);
  const dueDateRef = useRef<HTMLInputElement>(null);
  const orderRef = useRef<HTMLInputElement>(null);
  const poRef = useRef<HTMLInputElement>(null);
  const dcRef = useRef<HTMLInputElement>(null);
  const saveBtnRef = useRef<HTMLButtonElement>(null);
  
  const pendingCategoryRef = useRef<HTMLButtonElement>(null);
  const pendingSubCategoryRef = useRef<HTMLButtonElement>(null);
  const pendingProductRef = useRef<HTMLButtonElement>(null);
  const pendingQtyRef = useRef<HTMLInputElement>(null);
  const pendingRateRef = useRef<HTMLInputElement>(null);
  const pendingGstRef = useRef<HTMLInputElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  const handleEnter = (e: React.KeyboardEvent, nextRef: any, prevRef?: any) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      setTimeout(() => {
        if (nextRef && 'current' in nextRef) {
          nextRef.current?.focus();
        } else if (nextRef) {
          nextRef?.focus();
        }
      }, 50);
    } else if (e.shiftKey && (e.key === "Tab" || e.key === "Enter")) {
      if (prevRef) {
        e.preventDefault();
        setTimeout(() => {
          if (prevRef && 'current' in prevRef) {
            prevRef.current?.focus();
          } else if (prevRef) {
            prevRef?.focus();
          }
        }, 50);
      }
    }
  };

  useEffect(() => {
    if (open) {
      setTimeout(() => supplierRef.current?.focus(), 150);
    } else {
       setItems([]);
       setSupplierId("");
       setInvNo("");
       setOrderNo("");
       setOurPoNo("");
       setOurDcNo("");
       setReceivedAmount("0");
       setGstEnabled(true);
       setPendingItem({
          category: "", subCategory: "", sku: "", name: "", qty: 1, rate: 0, amount: 0, hsn: "", packing: "", 
          gstRate: "18", disPct: 0, unit: "Nos" 
       });
       setFocusNextItemTrigger(0);
       setProductTrigger(0);
       setSubCategoryTrigger(0);
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

  const addPendingItem = () => {
    if (!pendingItem.category) {
      toast({ variant: "destructive", title: "Error", description: "Please select a category first" });
      return;
    }
    if (!pendingItem.name) {
      toast({ variant: "destructive", title: "Error", description: "Please select a product first" });
      return;
    }
    if (pendingItem.qty <= 0) {
      toast({ variant: "destructive", title: "Error", description: "Quantity cannot be zero" });
      return;
    }
    if (pendingItem.rate <= 0) {
      toast({ variant: "destructive", title: "Error", description: "Rate cannot be zero" });
      return;
    }
    
    const itemToAdd = {
      ...pendingItem,
      amount: pendingItem.qty * pendingItem.rate * (1 - (pendingItem.disPct / 100))
    };
    setItems([...items, itemToAdd]);
    setPendingItem({
      category: "", subCategory: "", sku: "", name: "", qty: 1, rate: 0, amount: 0, hsn: "", packing: "", 
      gstRate: "18", disPct: 0, unit: "Nos" 
    });
    setFocusNextItemTrigger(prev => prev + 1);
  };

  useEffect(() => {
    if (focusNextItemTrigger > 0 && open) {
      const timer = setTimeout(() => {
        pendingCategoryRef.current?.focus();
        if (scrollViewportRef.current) {
          scrollViewportRef.current.scrollTo({
            top: scrollViewportRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [focusNextItemTrigger, open]);

  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const updateItem = (index: number, field: string, value: any) => {
    setItems(prev => {
      const newItems = [...prev];
      if (!newItems[index]) return prev;
      newItems[index] = { ...newItems[index], [field]: value };
      const item = newItems[index];
      const qty = Number(item.qty || 0);
      const rate = Number(item.rate || 0);
      const disPct = Number(item.disPct || 0);
      const baseAmount = qty * rate;
      const discount = (baseAmount * (disPct / 100));
      item.amount = baseAmount - discount;
      return newItems;
    });
  };

  const updatePendingItem = (fieldOrUpdates: string | Record<string, any>, value?: any) => {
    setPendingItem(prev => {
      let updated: any;
      if (typeof fieldOrUpdates === 'string') {
        updated = { ...prev, [fieldOrUpdates]: value };
      } else {
        updated = { ...prev, ...fieldOrUpdates };
      }

      if (fieldOrUpdates === "category") {
        updated.name = "";
        updated.subCategory = "";
        updated.sku = "";
      } else if (fieldOrUpdates === "name") {
        updated.subCategory = "";
        updated.sku = "";
      }

      const qty = Number(updated.qty || 0);
      const rate = Number(updated.rate || 0);
      const disPct = Number(updated.disPct || 0);
      const baseAmount = qty * rate;
      const discount = (baseAmount * (disPct / 100));
      updated.amount = baseAmount - discount;
      
      return updated;
    });
  };

  const calculateTotals = () => {
    const subTotal = items.reduce((sum, item) => sum + item.amount, 0);
    const totalTax = gstEnabled ? items.reduce((sum, item) => sum + (item.amount * (parseFloat(item.gstRate) / 100)), 0) : 0;
    const total = subTotal + totalTax;
    const cgst = isIgst ? 0 : totalTax / 2;
    const sgst = isIgst ? 0 : totalTax / 2;
    const igst = isIgst ? totalTax : 0;
    return { subTotal, totalTax, total, cgst, sgst, igst };
  };

  const { subTotal, totalTax, total } = calculateTotals();

  const handleSave = async (stayOpen: boolean = false) => {
    if (!supplierId) {
      toast({ variant: "destructive", title: "Error", description: "Please select a supplier" });
      return;
    }
    if (total <= 0) {
      toast({ variant: "destructive", title: "Invalid Bill Value", description: "0 bill value is not allowed to store. Add any items and try again." });
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
      
      if (stayOpen) {
        setItems([]);
        setInvNo("");
        setOrderNo("");
        setOurPoNo("");
        setOurDcNo("");
      } else {
        setOpen(false);
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-[88.3rem] w-[98vw] h-[58rem] max-h-[92vh] p-0 flex flex-col overflow-hidden transition-all duration-300">
        <div className="flex flex-col h-full bg-white relative">
          <DialogHeader className="p-2.5 px-4 border-b flex flex-row items-center justify-between space-y-0 pr-12 shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" /> {title}
            </DialogTitle>
            {items.length > 0 && (
              <div className="flex items-center gap-6 animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="text-right">
                  <p className="text-[0.5625rem] font-black text-muted-foreground uppercase opacity-70 leading-none">Subtotal</p>
                  <p className="text-xs font-bold tabular-nums">₹{subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="text-right">
                  <p className="text-[0.5625rem] font-black text-muted-foreground uppercase opacity-70 leading-none">{isIgst ? 'IGST' : 'CGST + SGST'}</p>
                  <p className="text-xs font-bold tabular-nums text-orange-600">₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="h-8 w-px bg-border mx-1" />
                <div className="text-right bg-green-50 px-3 py-1 rounded-lg border border-green-200">
                  <p className="text-[0.5625rem] font-black text-green-800 uppercase leading-none">Grand Total</p>
                  <p className="text-sm font-black text-green-600 tabular-nums">₹{Math.round(total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            )}
          </DialogHeader>

          <div className="flex-1 flex flex-col min-h-0 relative">
            <div className="p-3 md:p-4 pb-2 space-y-2 shrink-0">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
                <div className="col-span-2 space-y-0.5">
                  <Label className="text-[0.6875rem] font-bold text-muted-foreground">Supplier (From)*</Label>
                  <FormCombobox
                    triggerRef={supplierRef}
                    openOnFocus
                    onKeyDown={(e) => handleEnter(e, invNoRef, null)}
                    label="Supplier"
                    value={suppliers.find((s: any) => s.id.toString() === supplierId)?.name || ""}
                    options={suppliers.map((s: any) => s.name)}
                    onSelect={(v) => {
                      const s = suppliers.find((s: any) => s.name === v);
                      if (s) setSupplierId(s.id.toString());
                    }}
                    action={
                      <Button variant="ghost" className="w-full justify-start text-primary h-8 px-2 text-xs gap-2 hover:bg-primary/5" onClick={() => navigate("/contacts?tab=suppliers&action=add")}>
                        <Plus className="h-3 w-3" /> Add New Supplier
                      </Button>
                    }
                  />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-[0.6875rem] font-bold text-muted-foreground">Invoice No.</Label>
                  <Input ref={invNoRef} value={invNo} onChange={e => setInvNo(e.target.value)} onKeyDown={e => handleEnter(e, createDateRef, supplierRef)} placeholder="INV-XXX" className="h-8 text-xs" />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-[0.6875rem] font-bold text-muted-foreground">Date</Label>
                  <Input ref={createDateRef} type="date" value={createDate} onChange={e => setCreateDate(e.target.value)} onKeyDown={e => handleEnter(e, dueDateRef, invNoRef)} className="h-8 text-xs px-2" />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-[0.6875rem] font-bold text-muted-foreground">Due Date</Label>
                  <Input ref={dueDateRef} type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} onKeyDown={e => handleEnter(e, orderRef, createDateRef)} className="h-8 text-xs px-2" />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-[0.6875rem] font-bold text-muted-foreground">Order No.</Label>
                  <Input ref={orderRef} value={orderNo} onChange={e => setOrderNo(e.target.value)} onKeyDown={e => handleEnter(e, poRef, dueDateRef)} placeholder="PO-XXX" className="h-8 text-xs" />
                </div>
                <div className="space-y-0.5">
                   <Label className="text-[0.6875rem] font-bold text-muted-foreground">Our PO #</Label>
                   <Input ref={poRef} value={ourPoNo} onChange={e => setOurPoNo(e.target.value)} onKeyDown={e => handleEnter(e, pendingCategoryRef.current, orderRef)} className="h-8 text-xs" />
                </div>
              </div>
              <Separator />

              {/* Quick Add Section */}
              <div className="bg-muted/30 p-2.5 rounded-lg border border-primary/10 space-y-2">
                <div className="flex justify-between items-center px-1">
                  <Label className="text-[0.6875rem] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <Plus className="h-3 w-3" /> Quick Add Item
                  </Label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="use-igst" checked={isIgst} onCheckedChange={(checked) => setIsIgst(checked as boolean)} className="h-3.5 w-3.5" />
                      <label htmlFor="use-igst" className="text-[0.625rem] font-bold uppercase cursor-pointer text-muted-foreground">IGST</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="enable-gst" checked={gstEnabled} onCheckedChange={(checked) => setGstEnabled(checked as boolean)} className="h-3.5 w-3.5" />
                      <label htmlFor="enable-gst" className="text-[0.625rem] font-bold uppercase cursor-pointer text-muted-foreground">GST</label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-2 space-y-0.5">
                    <Label className="text-[0.5625rem] uppercase font-black text-muted-foreground ml-1">Category</Label>
                    <FormCombobox
                      triggerRef={pendingCategoryRef}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !pendingItem.category && items.length > 0) {
                          saveBtnRef.current?.focus();
                        } else {
                          handleEnter(e, pendingProductRef.current, poRef.current);
                        }
                      }}
                      openOnFocus
                      autoOpenTrigger={focusNextItemTrigger}
                      label="Category"
                      value={pendingItem.category}
                      options={Array.from(new Set(products.map((p: any) => p.category))).filter(Boolean) as string[]}
                      onSelect={(v) => {
                        updatePendingItem("category", v);
                        if (v) {
                          setProductTrigger(prev => prev + 1);
                          setTimeout(() => pendingProductRef.current?.focus(), 250);
                        }
                      }}
                    />
                  </div>
                  <div className="col-span-3 space-y-0.5">
                    <Label className="text-[0.5625rem] uppercase font-black text-muted-foreground ml-1">Product</Label>
                    <FormCombobox
                      triggerRef={pendingProductRef}
                      onKeyDown={(e) => handleEnter(e, pendingSubCategoryRef.current, pendingCategoryRef.current)}
                      openOnFocus
                      label="Product"
                      value={pendingItem.name}
                      autoOpenTrigger={productTrigger}
                      options={Array.from(new Set(products.filter((p: any) => !pendingItem.category || p.category === pendingItem.category).map((p: any) => p.name))).filter(Boolean) as string[]}
                      onSelect={(v) => {
                        updatePendingItem("name", v);
                        setSubCategoryTrigger(prev => prev + 1);
                        setTimeout(() => pendingSubCategoryRef.current?.focus(), 250);
                      }}
                    />
                  </div>
                  <div className="col-span-2 space-y-0.5">
                    <Label className="text-[0.5625rem] uppercase font-black text-muted-foreground ml-1">Sub Category</Label>
                    <FormCombobox
                      triggerRef={pendingSubCategoryRef}
                      onKeyDown={(e) => handleEnter(e, pendingQtyRef.current, pendingProductRef.current)}
                      openOnFocus
                      label="Sub Category"
                      value={pendingItem.subCategory}
                      autoOpenTrigger={subCategoryTrigger}
                      options={Array.from(new Set(products.filter((p: any) =>
                        (!pendingItem.category || p.category === pendingItem.category) &&
                        (!pendingItem.name || p.name === pendingItem.name)
                      ).map((p: any) => p.subCategory))).filter(Boolean) as string[]}
                      onSelect={(v) => {
                         const exactProd = products.find((p: any) => 
                           p.name === pendingItem.name && p.subCategory === v &&
                           (!pendingItem.category || p.category === pendingItem.category)
                         );
                         if (exactProd) {
                           updatePendingItem({
                             subCategory: v,
                             sku: exactProd.sku || "",
                             rate: parseFloat(exactProd.purchasePrice || 0),
                             hsn: exactProd.hsnCode || "",
                             gstRate: exactProd.gstRate || "18",
                             unit: exactProd.unit || "Nos",
                             category: exactProd.category || pendingItem.category
                           });
                         } else {
                           updatePendingItem("subCategory", v);
                         }
                         setTimeout(() => pendingQtyRef.current?.focus(), 250);
                      }}
                    />
                  </div>
                  <div className="col-span-1 space-y-0.5">
                    <Label className="text-[0.5625rem] uppercase font-black text-muted-foreground text-center block">Qty</Label>
                    <Input ref={pendingQtyRef} type="number" min="0" value={pendingItem.qty} className="h-8 font-bold text-center text-xs" onKeyDown={(e) => handleEnter(e, pendingRateRef.current, pendingSubCategoryRef.current)} onChange={e => updatePendingItem("qty", parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="col-span-1 space-y-0.5">
                    <Label className="text-[0.5625rem] uppercase font-black text-muted-foreground ml-1">Rate</Label>
                    <Input ref={pendingRateRef} type="number" min="0" value={pendingItem.rate} className="h-8 font-bold text-xs text-center" onKeyDown={(e) => handleEnter(e, pendingGstRef.current, pendingQtyRef.current)} onChange={e => updatePendingItem("rate", parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="col-span-1 space-y-0.5">
                    <Label className="text-[0.5625rem] uppercase font-black text-muted-foreground text-center block">GST%</Label>
                    <Input ref={pendingGstRef} type="number" value={pendingItem.gstRate} className="h-8 font-bold text-xs text-center" onChange={e => updatePendingItem("gstRate", e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) addPendingItem(); else handleEnter(e, null, pendingRateRef.current); }} />
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <Button onClick={addPendingItem} size="sm" className="h-8 w-full gap-1.5 shadow-sm">
                      <Plus className="h-3 w-3" /> Add Item
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div ref={scrollViewportRef} className="flex-1 overflow-auto border-t bg-muted/5">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead className="sticky top-0 bg-white border-b z-10 shadow-sm">
                  <tr>
                    <th className="p-1.5 pl-4 text-[0.625rem] font-black uppercase text-muted-foreground tracking-widest w-[15%]">Category</th>
                    <th className="p-1.5 text-[0.625rem] font-black uppercase text-muted-foreground tracking-widest w-[15%]">Sub Category</th>
                    <th className="p-1.5 text-[0.625rem] font-black uppercase text-muted-foreground tracking-widest w-[25%]">Product</th>
                    <th className="p-1.5 text-[0.625rem] font-black uppercase text-muted-foreground tracking-widest text-center w-20">Qty</th>
                    <th className="p-1.5 text-[0.625rem] font-black uppercase text-muted-foreground tracking-widest w-28 text-center">Rate</th>
                    <th className="p-1.5 text-[0.625rem] font-black uppercase text-muted-foreground tracking-widest text-center w-20">GST</th>
                    <th className="p-1.5 pr-4 text-[0.625rem] font-black uppercase text-muted-foreground tracking-widest text-right w-32">Total</th>
                    <th className="p-1.5 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y bg-white">
                  {items.map((item, index) => (
                    <tr key={index} className="hover:bg-muted/20 transition-colors group">
                      <td className="p-1.5 pl-4 text-[0.6875rem] font-black text-muted-foreground/70 uppercase truncate">{item.category}</td>
                      <td className="p-1.5 text-[0.6875rem] font-bold text-muted-foreground uppercase truncate">{item.subCategory}</td>
                      <td className="p-1.5 text-xs font-black text-primary uppercase truncate">{item.name}</td>
                      <td className="p-1.5 text-center">
                        <Input type="number" min="0" value={item.qty} className="h-8 font-bold text-center text-xs bg-transparent border-transparent hover:bg-muted/30 focus:bg-white" onChange={e => updateItem(index, "qty", parseFloat(e.target.value) || 0)} />
                      </td>
                      <td className="p-1.5 text-center">
                        <Input type="number" min="0" value={item.rate} className="h-8 font-bold text-center text-xs bg-transparent border-transparent hover:bg-muted/30 focus:bg-white" onChange={e => updateItem(index, "rate", parseFloat(e.target.value) || 0)} />
                      </td>
                      <td className="p-1.5 text-center">
                        <div className="text-[0.6875rem] font-black text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">{item.gstRate}%</div>
                      </td>
                      <td className="p-1.5 pr-4 text-right text-xs font-black text-primary tabular-nums">₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="p-1.5 text-center">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/40 hover:text-destructive opacity-0 group-hover:opacity-100" onClick={() => removeItem(index)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 md:p-4 pt-1 shrink-0 space-y-2">
              <Separator />
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1 w-full sm:max-w-xs space-y-2">
                   <div className="space-y-1">
                      <Label className="text-[0.625rem] uppercase font-black text-muted-foreground tracking-widest">Our DC #</Label>
                      <Input ref={dcRef} value={ourDcNo} onChange={e => setOurDcNo(e.target.value)} onKeyDown={e => handleEnter(e, pendingCategoryRef.current, poRef)} className="h-8 text-xs" />
                   </div>
                   <div className="space-y-1">
                      <Label className="text-[0.625rem] uppercase font-black text-muted-foreground tracking-widest">Received Amount</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₹</span>
                        <Input type="number" value={receivedAmount} onChange={e => setReceivedAmount(e.target.value)} className="pl-7 h-8 text-xs font-bold" />
                      </div>
                   </div>
                </div>
                <div className="w-full sm:w-[320px] bg-muted/20 p-2.5 rounded-lg space-y-1 border shadow-inner">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-medium uppercase tracking-tighter">Subtotal</span>
                    <span className="font-bold tabular-nums">₹{subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-medium uppercase tracking-tighter">{isIgst ? 'IGST' : 'CGST + SGST'}</span>
                    <span className="font-bold tabular-nums text-orange-600">₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <Separator className="bg-muted-foreground/20" />
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-black text-[0.625rem] uppercase tracking-widest text-muted-foreground">Grand Total</span>
                    <span className="font-black text-lg text-green-600 tabular-nums">₹{Math.round(total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-2.5 px-4 border-t bg-muted/30 flex justify-end gap-3 shrink-0">
            <Button variant="outline" size="lg" className="px-8 h-10 text-xs font-bold uppercase tracking-widest" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="secondary" size="lg" className="px-4 gap-2 border-primary/10 h-10 text-xs font-bold uppercase tracking-widest" onClick={() => handleSave(true)} disabled={loading}>
              <RefreshCw className="h-4 w-4" /> Save & Create Another
            </Button>
            <Button ref={saveBtnRef} size="lg" className="px-8 shadow-lg shadow-primary/20 gap-2 h-10 text-xs font-black uppercase tracking-widest" onClick={() => handleSave(false)} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Purchase Record
            </Button>
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
