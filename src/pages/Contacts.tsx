import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Plus, Loader2, Save, UserPlus, Edit2 } from "lucide-react";
import { StatusBadge } from "./Dashboard";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Filter, Check } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

type ContactType = "B2B" | "B2C" | "Supplier";

interface Contact {
  id: number;
  name: string;
  type: string;
  mobile: string;
  whatsapp: string;
  gst: string;
  email: string;
  status: string;
  approval: string;
  city: string;
  balance: string;
}

function ColumnFilter({ label, column, filters, setFilters, options }: any) {
  const [open, setOpen] = useState(false);
  const currentFilter = filters[column] || "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("h-5 w-5 ml-auto p-0 hover:bg-muted-foreground/10", currentFilter && "text-primary bg-primary/5")}>
          <Filter className={cn("h-2.5 w-2.5", currentFilter && "fill-current")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3 shadow-xl border-primary/10 z-[110]" align="end">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Filter {label}</p>
            {currentFilter && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-5 px-1.5 text-[9px] font-bold text-destructive hover:text-destructive hover:bg-destructive/5"
                onClick={() => {
                  const newFilters = { ...filters };
                  delete newFilters[column];
                  setFilters(newFilters);
                  setOpen(false);
                }}
              >
                Clear
              </Button>
            )}
          </div>
          {options ? (
             <Select value={currentFilter} onValueChange={(v) => { 
                if (v === "all") {
                  const newFilters = { ...filters };
                  delete newFilters[column];
                  setFilters(newFilters);
                } else {
                  setFilters({...filters, [column]: v}); 
                }
                setOpen(false); 
             }}>
               <SelectTrigger className="h-8 text-xs">
                 <SelectValue placeholder={`Select ${label}...`} />
               </SelectTrigger>
               <SelectContent className="z-[120]">
                 <SelectItem value="all">All {label}s</SelectItem>
                 {options.map((opt: any) => (
                   <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
          ) : (
             <Input 
               placeholder={`Search ${label}...`} 
               value={currentFilter} 
               onChange={(e) => setFilters({...filters, [column]: e.target.value})}
               className="h-8 text-xs font-medium focus-visible:ring-primary/20"
               autoFocus
             />
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ContactTable({ type, tabName }: { type: ContactType | ContactType[], tabName: string }) {
  const [search, setSearch] = useState("");
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<any>({});
  const [showInactive, setShowInactive] = useState(false);
  const [sameAsMobile, setSameAsMobile] = useState(true);
  const [noGst, setNoGst] = useState(false);
  
  const resetForm = () => {
    setFormData({});
    setSameAsMobile(true);
    setNoGst(false);
  };
  
  const { data: contacts = [], isLoading, isError } = useQuery<Contact[]>({
    queryKey: ["contacts"],
    queryFn: async () => {
      const res = await fetch("/api/core?resource=contacts");
      if (!res.ok) throw new Error("Failed to fetch contacts");
      return res.json();
    },
  });

  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "add") {
      setOpen(true);
      // Clean up the URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("action");
      setSearchParams(newParams, { replace: true });
    }
  }, []);

  const types = Array.isArray(type) ? type : [type];
  const allContactsInTab = Array.isArray(contacts) ? contacts.filter(c => types.includes(c.type as ContactType)) : [];
  const activeCount = allContactsInTab.filter(c => c.status !== "Inactive").length;
  const inactiveCount = allContactsInTab.filter(c => c.status === "Inactive").length;

  const filtered = allContactsInTab
    .filter(c => {
      if (!showInactive && c.status === "Inactive") return false;
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.mobile && c.mobile.includes(search)) ||
        (c.gst && c.gst.toLowerCase().includes(search.toLowerCase()));
      
      const matchesColumnFilters = Object.entries(columnFilters).every(([col, val]) => {
        if (!val) return true;
        const rowValue = (c as any)[col.toLowerCase()] || (c as any)[col];
        if (col.toLowerCase() === "status" || col.toLowerCase() === "type") {
          return String(rowValue).toLowerCase() === val.toLowerCase();
        }
        return String(rowValue).toLowerCase().includes(val.toLowerCase());
      });

      return matchesSearch && matchesColumnFilters;
    });

  const clearFilters = () => {
    setSearch("");
    setColumnFilters({});
  };

  const addButtonLabel = tabName === "B2B" ? "Add B2B Customer" :
    tabName === "B2C" ? "Add B2C Customer" : "Add Supplier";
  const dialogTitle = formData.id ? `Edit ${tabName === "B2B" ? "B2B Customer" : tabName === "B2C" ? "B2C Customer" : "Supplier"}` :
    (tabName === "B2B" ? "Add New B2B Customer" : tabName === "B2C" ? "Add New B2C Customer" : "Add New Supplier");
  const saveButtonLabel = formData.id ? "Update Details" : (tabName === "B2B" ? "Save B2B Customer" :
    tabName === "B2C" ? "Save B2C Customer" : "Save Supplier");

  const getFormFields = () => {
    switch (tabName) {
      case "B2B":
        return [
          { key: "name", name: "Company Name", placeholder: "Enter company name", required: true },
          { key: "contactPerson", name: "Contact Person", placeholder: "Enter contact person name", required: false },
          { key: "mobile", name: "Mobile", placeholder: "Enter mobile number" },
          { key: "whatsapp", name: "WhatsApp", placeholder: "Enter WhatsApp number" },
          { key: "email", name: "Email", placeholder: "Enter email address" },
          { key: "gst", name: "GST Number", placeholder: "Enter GST number" },
          { key: "city", name: "City", placeholder: "Enter city" },
          { key: "address", name: "Billing Address", placeholder: "Enter billing address", type: "textarea" },
          { key: "status", name: "Status", placeholder: "Select status", isStatus: true },
        ];
      case "B2C":
        return [
          { key: "name", name: "Full Name", placeholder: "Enter full name", required: true },
          { key: "mobile", name: "Mobile", placeholder: "Enter mobile number", required: true },
          { key: "whatsapp", name: "WhatsApp", placeholder: "Enter WhatsApp number" },
          { key: "email", name: "Email", placeholder: "Enter email address" },
          { key: "city", name: "City", placeholder: "Enter city", required: true },
          { key: "address", name: "Address", placeholder: "Enter address", required: true, type: "textarea" },
          { key: "status", name: "Status", placeholder: "Select status", isStatus: true },
        ];
      case "Supplier":
        return [
          { key: "name", name: "Company Name", placeholder: "Enter company name", required: true },
          { key: "contactPerson", name: "Contact Person", placeholder: "Enter contact person name", required: false },
          { key: "mobile", name: "Mobile", placeholder: "Enter mobile number", required: true },
          { key: "whatsapp", name: "WhatsApp", placeholder: "Enter WhatsApp number" },
          { key: "email", name: "Email", placeholder: "Enter email address", required: true },
          { key: "gst", name: "GST Number", placeholder: "Enter GST number" },
          { key: "city", name: "City", placeholder: "Enter city", required: true },
          { key: "address", name: "Billing Address", placeholder: "Enter billing address", required: true, type: "textarea" },
          { key: "paymentTerms", name: "Payment Terms", placeholder: "e.g., 30 days credit" },
          { key: "status", name: "Status", placeholder: "Select status", isStatus: true },
        ];
      default:
        return [];
    }
  };

  const formFields = getFormFields();
  
  const handleSave = async (stayOpen: boolean = false) => {
    // Validation
    const missing = formFields.filter(f => f.required && !formData[f.key]);
    
    // Custom GST Logic
    const isCompany = tabName === "B2B" || tabName === "Supplier";
    const gstMissing = isCompany && !formData.gst && !noGst && formData.gst !== "-";

    if (missing.length > 0 || gstMissing) {
      let desc = missing.map(m => m.name).join(", ");
      if (gstMissing) desc = desc ? `${desc}, GST Number` : "GST Number (or check 'No GST')";
      
      toast({ 
        variant: "destructive", 
        title: "Required Fields", 
        description: `Please fill in: ${desc}` 
      });
      return;
    }

    if (formData.mobile && !/^\d{10}$/.test(formData.mobile)) {
      toast({ variant: "destructive", title: "Invalid Input", description: "Mobile number must be exactly 10 digits." });
      return;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({ variant: "destructive", title: "Invalid Input", description: "Please enter a valid email address." });
      return;
    }

    // Duplicate Check - Now respects Type
    const currentType = Array.isArray(type) ? type[0] : type;
    const existing = contacts.find(c => 
      c.name.trim().toLowerCase() === formData.name?.trim().toLowerCase() && 
      c.type === currentType &&
      c.id !== formData.id
    );
    if (existing) {
      toast({ 
        title: "Duplicate Record Found", 
        description: `Contact "${existing.name}" already exists in ${currentType}. Highlighting existing record.` 
      });
      setFormData(existing);
      setNoGst(existing.gst === "-");
      return;
    }

    setLoading(true);
    try {
      const payload = { ...formData, type: Array.isArray(type) ? type[0] : type };
      // Sanitize payload to prevent Date serialization issues on backend
      const { createdAt, ...saveData } = payload;
      
      const res = await fetch("/api/core?resource=contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saveData)
      });
      if (!res.ok) throw new Error("Failed to save contact");
      
      toast({ 
        title: "Success", 
        description: `${formData.name || 'Contact'} ${formData.id ? 'updated' : 'added'} successfully` 
      });
      
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      
      if (stayOpen) {
        resetForm();
      } else {
        setOpen(false);
        resetForm();
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setLoading(false);
    }
  };
  
  const handleEdit = (contact: Contact) => {
    setFormData(contact);
    setOpen(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search contacts..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {(search || Object.keys(columnFilters).length > 0 || showInactive) && (
          <Button variant="ghost" size="sm" onClick={() => { clearFilters(); setShowInactive(false); }} className="h-8 text-xs font-bold text-muted-foreground hover:text-primary">
            Clear Filters
          </Button>
        )}
        <div className="flex items-center gap-2 bg-muted/50 px-3 py-1 rounded-full border border-border h-9">
          <input 
            type="checkbox" 
            id="show-inactive" 
            checked={showInactive} 
            onChange={(e) => setShowInactive(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="show-inactive" className="text-[10px] font-black uppercase cursor-pointer select-none text-muted-foreground mr-1">
            Show Inactive
          </label>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if(!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-9 gap-1" onClick={() => resetForm()}><Plus className="h-3.5 w-3.5" />{addButtonLabel}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg overflow-y-auto max-h-[90vh]">
            <DialogHeader><DialogTitle>{dialogTitle}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3 py-2">
              {formFields.map((field) => (
                <div key={field.name} className={field.type === "textarea" ? "col-span-2" : ""}>
                  <Label className="text-xs font-medium text-muted-foreground">
                    {field.name} {field.required && <span className="text-destructive">*</span>}
                  </Label>
                  {field.key === "name" && !formData.id ? (
                    <Popover open={!!(formData?.name && contacts?.filter(c => c.type === (Array.isArray(type) ? type[0] : type) && c.status !== "Inactive" && c.name?.toLowerCase().includes(formData.name.toLowerCase())).length > 0)}>
                      <PopoverAnchor asChild>
                        <Input 
                          className="mt-1 h-9" 
                          placeholder={field.placeholder} 
                          value={formData[field.key!] || ""}
                          autoComplete="off"
                          onChange={e => {
                            const val = e.target.value;
                            setFormData({ ...formData, [field.key!]: val });
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              if (field.required && !formData.name) {
                                e.preventDefault();
                                toast({ variant: "destructive", title: "Required Field", description: `${field.name} is mandatory.` });
                                return;
                              }
                              const currentTypeName = Array.isArray(type) ? type[0] : type;
                              const matches = contacts?.filter(c => c.type === currentTypeName && c.status !== "Inactive" && c.name?.toLowerCase().includes(formData.name?.toLowerCase() || ""));
                              if (matches && matches.length > 0) {
                                e.preventDefault();
                                const firstMatch = matches[0];
                                toast({ title: "Contact Selected", description: `Loaded details for existing ${currentTypeName}: ${firstMatch.name}` });
                                setFormData(firstMatch);
                                setNoGst(firstMatch.gst === "-");
                              }
                              // Move to next field regardless
                              const form = e.currentTarget.closest('[role="dialog"]');
                              if (form) {
                                const inputs = Array.from(form.querySelectorAll('input:not([tabindex="-1"]), select:not([tabindex="-1"]), textarea:not([tabindex="-1"]), button:not([tabindex="-1"])')) as HTMLElement[];
                                const index = inputs.indexOf(e.currentTarget);
                                if (index > -1 && index < inputs.length - 1) {
                                  inputs[index + 1].focus();
                                }
                              }
                            }
                          }}
                          onBlur={e => {
                            const val = e.target.value;
                            if (val) {
                              const currentTypeName = Array.isArray(type) ? type[0] : type;
                              const existing = contacts.find(c => c.type === currentTypeName && c.name?.trim().toLowerCase() === val.trim().toLowerCase());
                              if (existing) {
                                toast({ 
                                  title: "Match Found", 
                                  description: `Loading details for existing ${currentTypeName}: "${existing.name}"` 
                                });
                                setFormData(existing);
                                setNoGst(existing.gst === "-");
                              }
                            }
                          }}
                        />
                      </PopoverAnchor>
                      <PopoverContent 
                        className="p-0 w-[var(--radix-popover-trigger-width)]" 
                        align="start"
                        onOpenAutoFocus={(e) => e.preventDefault()}
                      >
                        <Command>
                          <CommandList>
                            <CommandGroup heading="Existing Contacts">
                              {contacts
                                ?.filter(c => c.type === (Array.isArray(type) ? type[0] : type) && c.status !== "Inactive" && c.name?.toLowerCase().includes(formData.name?.toLowerCase() || ""))
                                .slice(0, 5)
                                .map(c => (
                                  <CommandItem
                                    key={c.id}
                                    value={c.name}
                                    onSelect={() => {
                                      toast({ title: "Contact Selected", description: `Loaded details for ${c.name}` });
                                      setFormData(c);
                                      setNoGst(c.gst === "-");
                                    }}
                                  >
                                    <Check className="mr-2 h-4 w-4 opacity-0" />
                                    <div className="flex flex-col">
                                      <span className="font-bold text-xs">{c.name}</span>
                                      <span className="text-[9px] text-muted-foreground">{c.type} • {c.mobile || 'No Mobile'}</span>
                                    </div>
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  ) : field.type === "textarea" ? (
                    <Textarea 
                      className="mt-1 h-20" 
                      placeholder={field.placeholder} 
                      value={formData[field.key!] || ""}
                      onChange={e => setFormData({ ...formData, [field.key!]: e.target.value })}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          const form = e.currentTarget.closest('[role="dialog"]');
                          if (form) {
                            const inputs = Array.from(form.querySelectorAll('input:not([tabindex="-1"]), select:not([tabindex="-1"]), textarea:not([tabindex="-1"]), button:not([tabindex="-1"])')) as HTMLElement[];
                            const index = inputs.indexOf(e.currentTarget);
                            if (index > -1 && index < inputs.length - 1) inputs[index + 1].focus();
                          }
                        }
                      }}
                    />
                  ) : field.isStatus ? (
                    <Select 
                      value={formData[field.key!] || "Active"} 
                      onValueChange={v => setFormData({ ...formData, [field.key!]: v })}
                    >
                      <SelectTrigger 
                        className="mt-1 h-9"
                        onKeyDown={e => {
                          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                            e.preventDefault();
                            const currentStatus = formData.status || "Active";
                            setFormData({ ...formData, status: currentStatus === "Active" ? "Inactive" : "Active" });
                          }
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const form = e.currentTarget.closest('[role="dialog"]');
                            if (form) {
                              const inputs = Array.from(form.querySelectorAll('input:not([tabindex="-1"]), select:not([tabindex="-1"]), textarea:not([tabindex="-1"]), button:not([tabindex="-1"]), [role="combobox"]')) as HTMLElement[];
                              const index = inputs.indexOf(e.currentTarget);
                              if (index > -1 && index < inputs.length - 1) {
                                inputs[index + 1].focus();
                              }
                            }
                          }
                        }}
                      >
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input 
                      className="mt-1 h-9" 
                      placeholder={field.placeholder} 
                      type={field.type || "text"} 
                      value={formData[field.key!] || ""}
                      onChange={e => {
                        const val = e.target.value;
                        const newData = { ...formData, [field.key!]: val };
                        if (field.key === "mobile" && sameAsMobile) {
                          newData.whatsapp = val;
                        }
                        setFormData(newData);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const form = e.currentTarget.closest('[role="dialog"]');
                          if (form) {
                            const inputs = Array.from(form.querySelectorAll('input:not([tabindex="-1"]), select:not([tabindex="-1"]), textarea:not([tabindex="-1"]), button:not([tabindex="-1"]), [role="combobox"]')) as HTMLElement[];
                            const index = inputs.indexOf(e.currentTarget);
                            if (index > -1 && index < inputs.length - 1) inputs[index + 1].focus();
                          }
                        }
                      }}
                      tabIndex={field.key === "whatsapp" ? -1 : undefined}
                    />
                  )}
                  {field.key === "whatsapp" && (
                    <div className="flex items-center gap-1.5 mt-1 ml-1">
                      <input 
                        type="checkbox" 
                        id="same-as-mobile" 
                        tabIndex={-1}
                        checked={sameAsMobile}
                        onChange={(e) => {
                          setSameAsMobile(e.target.checked);
                          if (e.target.checked) {
                            setFormData({ ...formData, whatsapp: formData.mobile || "" });
                          }
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const form = e.currentTarget.closest('[role="dialog"]');
                            if (form) {
                              const inputs = Array.from(form.querySelectorAll('input:not([tabindex="-1"]), select:not([tabindex="-1"]), textarea:not([tabindex="-1"]), button:not([tabindex="-1"]), [role="combobox"]')) as HTMLElement[];
                              const index = inputs.indexOf(e.currentTarget);
                              if (index > -1 && index < inputs.length - 1) inputs[index + 1].focus();
                            }
                          }
                        }}
                        className="h-3 w-3 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label htmlFor="same-as-mobile" className="text-[9px] font-bold uppercase text-muted-foreground cursor-pointer">
                        Same as Mobile Number
                      </label>
                    </div>
                  )}
                  {field.key === "gst" && (tabName === "B2B" || tabName === "Supplier") && (
                    <div className="flex items-center gap-1.5 mt-1 ml-1">
                      <input 
                        type="checkbox" 
                        id="no-gst" 
                        checked={noGst}
                        onChange={(e) => {
                          setNoGst(e.target.checked);
                          if (e.target.checked) {
                            setFormData({ ...formData, gst: "-" });
                          } else if (formData.gst === "-") {
                            setFormData({ ...formData, gst: "" });
                          }
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const form = e.currentTarget.closest('[role="dialog"]');
                            if (form) {
                              const inputs = Array.from(form.querySelectorAll('input:not([tabindex="-1"]), select:not([tabindex="-1"]), textarea:not([tabindex="-1"]), button:not([tabindex="-1"]), [role="combobox"]')) as HTMLElement[];
                              const index = inputs.indexOf(e.currentTarget);
                              if (index > -1 && index < inputs.length - 1) inputs[index + 1].focus();
                            }
                          }
                        }}
                        className="h-3 w-3 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label htmlFor="no-gst" className="text-[9px] font-bold uppercase text-muted-foreground cursor-pointer">
                        No GST (Use '-')
                      </label>
                    </div>
                  )}
                </div>
              ))}
              <div className="col-span-2 flex flex-col sm:flex-row justify-end gap-2 pt-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={loading} tabIndex={-1}>Cancel</Button>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => handleSave(true)} disabled={loading} className="gap-1" tabIndex={-1}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                    Save & Add Another
                  </Button>
                  <Button size="sm" onClick={() => handleSave(false)} disabled={loading} className="gap-1">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    {saveButtonLabel}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto min-h-[200px] flex flex-col">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : isError ? (
              <div className="flex-1 flex items-center justify-center p-8 text-destructive">
                Failed to load contacts.
              </div>
            ) : (
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {[
                      { label: "ID", key: "id" },
                      { label: "Name", key: "name" },
                      { label: "Type", key: "type" },
                      { label: "Mobile", key: "mobile" },
                      { label: "WhatsApp", key: "whatsapp" },
                      { label: "GST No.", key: "gst" },
                      { label: "City", key: "city" },
                      { label: "Status", key: "status" },
                      { label: "Approval", key: "approval" },
                      { label: "Balance", key: "balance" }
                    ].map(h => (
                      <th key={h.key} className="px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center group">
                          <span className="uppercase tracking-widest font-black text-[9px]">{h.label}</span>
                          <ColumnFilter 
                            label={h.label} 
                            column={h.key} 
                            filters={columnFilters} 
                            setFilters={setColumnFilters}
                            options={h.key === "status" ? [
                              { label: "Active", value: "Active" },
                              { label: "Inactive", value: "Inactive" }
                            ] : h.key === "type" ? [
                              { label: "B2B", value: "B2B" },
                              { label: "B2C", value: "B2C" },
                              { label: "Supplier", value: "Supplier" }
                            ] : undefined}
                          />
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{c.id}</td>
                      <td className="px-4 py-2.5 font-semibold whitespace-nowrap">{c.name}</td>
                      <td className="px-4 py-2.5"><Badge variant="outline" className="text-xs">{c.type}</Badge></td>
                      <td className="px-4 py-2.5 text-muted-foreground">{c.mobile}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{c.whatsapp}</td>
                      <td className="px-4 py-2.5 font-mono text-xs">{c.gst || "—"}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{c.city}</td>
                      <td className="px-4 py-2.5"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-2.5"><StatusBadge status={c.approval} /></td>
                      <td className={`px-4 py-2.5 font-semibold tabular-nums ${parseFloat(c.balance) > 0 ? "text-primary" : parseFloat(c.balance) < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                        ₹{Math.abs(parseFloat(c.balance)).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(c)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">No contacts found</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
        Active: <span className="text-primary font-black">{activeCount}</span> {inactiveCount > 0 && <> | Inactive: <span className="text-orange-500 font-black">{inactiveCount}</span></>}
      </p>
    </div>
  );
}

export default function Contacts() {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "b2b";

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Contacts</h1>
        <p className="text-sm text-muted-foreground">Manage B2B/B2C customers and supplier partnerships</p>
      </div>
      <Tabs defaultValue={defaultTab}>
        <TabsList className="h-12 flex-wrap bg-transparent gap-2 px-1 mb-2">
          <TabsTrigger value="b2b" className="text-xs px-5 h-10 font-black uppercase tracking-tight data-[state=active]:bg-primary/10 data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary transition-all">B2B Customers</TabsTrigger>
          <TabsTrigger value="b2c" className="text-xs px-5 h-10 font-black uppercase tracking-tight data-[state=active]:bg-primary/10 data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary transition-all">B2C Customers</TabsTrigger>
          <TabsTrigger value="suppliers" className="text-xs px-5 h-10 font-black uppercase tracking-tight data-[state=active]:bg-primary/10 data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary transition-all">Suppliers</TabsTrigger>
        </TabsList>
        <TabsContent value="b2b" className="mt-4">
          <ContactTable type="B2B" tabName="B2B" />
        </TabsContent>
        <TabsContent value="b2c" className="mt-4">
          <ContactTable type="B2C" tabName="B2C" />
        </TabsContent>
        <TabsContent value="suppliers" className="mt-4">
          <ContactTable type="Supplier" tabName="Supplier" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
