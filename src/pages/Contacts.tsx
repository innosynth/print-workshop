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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Filter } from "lucide-react";

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
  
  const resetForm = () => setFormData({});
  
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
          { key: "contactPerson", name: "Contact Person", placeholder: "Enter contact person name", required: true },
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
        ];
      case "Supplier":
        return [
          { key: "name", name: "Company Name", placeholder: "Enter company name", required: true },
          { key: "contactPerson", name: "Contact Person", placeholder: "Enter contact person name", required: true },
          { key: "mobile", name: "Mobile", placeholder: "Enter mobile number", required: true },
          { key: "whatsapp", name: "WhatsApp", placeholder: "Enter WhatsApp number" },
          { key: "email", name: "Email", placeholder: "Enter email address", required: true },
          { key: "gst", name: "GST Number", placeholder: "Enter GST number" },
          { key: "city", name: "City", placeholder: "Enter city", required: true },
          { key: "address", name: "Billing Address", placeholder: "Enter billing address", required: true, type: "textarea" },
          { key: "paymentTerms", name: "Payment Terms", placeholder: "e.g., 30 days credit" },
        ];
      default:
        return [];
    }
  };

  const formFields = getFormFields();
  
  const handleSave = async (stayOpen: boolean = false) => {
    // Validation
    const missing = formFields.filter(f => f.required && !formData[f.key]);
    if (missing.length > 0) {
      toast({ 
        variant: "destructive", 
        title: "Required Fields", 
        description: `Please fill in: ${missing.map(m => m.name).join(", ")}` 
      });
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
        {(search || Object.keys(columnFilters).length > 0) && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs font-bold text-muted-foreground hover:text-primary">
            Clear Filters
          </Button>
        )}
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
                  {field.type === "textarea" ? (
                    <Textarea 
                      className="mt-1 h-20" 
                      placeholder={field.placeholder} 
                      value={formData[field.key!] || ""}
                      onChange={e => setFormData({ ...formData, [field.key!]: e.target.value })}
                    />
                  ) : field.isStatus ? (
                    <Select 
                      value={formData[field.key!] || "Active"} 
                      onValueChange={v => setFormData({ ...formData, [field.key!]: v })}
                    >
                      <SelectTrigger className="mt-1 h-9">
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
                      onChange={e => setFormData({ ...formData, [field.key!]: e.target.value })}
                    />
                  )}
                </div>
              ))}
              <div className="col-span-2 flex flex-col sm:flex-row justify-end gap-2 pt-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => handleSave(true)} disabled={loading} className="gap-1">
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
