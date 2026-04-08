import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

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

function ContactTable({ type, tabName }: { type: ContactType | ContactType[], tabName: string }) {
  const [search, setSearch] = useState("");
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

  const types = Array.isArray(type) ? type : [type];
  const filtered = (contacts || [])
    .filter(c => types.includes(c.type as ContactType))
    .filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.mobile && c.mobile.includes(search)) ||
      (c.gst && c.gst.toLowerCase().includes(search.toLowerCase()))
    );

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
      const res = await fetch("/api/core?resource=contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, type: Array.isArray(type) ? type[0] : type })
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
                    {["ID", "Name", "Type", "Mobile", "WhatsApp", "GST No.", "City", "Status", "Approval", "Balance", ""].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
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
      <p className="text-xs text-muted-foreground">{filtered.length} records found</p>
    </div>
  );
}

export default function Contacts() {
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Contacts</h1>
        <p className="text-sm text-muted-foreground">Manage B2B/B2C customers and supplier partnerships</p>
      </div>
      <Tabs defaultValue="b2b">
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
