import { useState } from "react";
import { contacts, type ContactType } from "@/lib/mockData";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Plus, Phone, Mail, MapPin, FileText } from "lucide-react";
import { StatusBadge } from "./Dashboard";

function ContactTable({ type }: { type: ContactType | ContactType[] }) {
  const [search, setSearch] = useState("");
  const types = Array.isArray(type) ? type : [type];
  const filtered = contacts
    .filter(c => types.includes(c.type))
    .filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.mobile.includes(search) ||
      c.gst.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search contacts..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="h-9 gap-1"><Plus className="h-3.5 w-3.5" />Add Contact</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add New Contact</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3 py-2">
              {["Full Name","Company","Mobile","WhatsApp","Email","GST Number","City","Billing Address"].map(f => (
                <div key={f} className={f === "Billing Address" ? "col-span-2" : ""}>
                  <label className="text-xs font-medium text-muted-foreground">{f}</label>
                  <Input className="mt-1 h-9" placeholder={f} />
                </div>
              ))}
              <div className="col-span-2 flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm">Cancel</Button>
                <Button size="sm">Save Contact</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b bg-muted/40">
                  {["ID","Name","Type","Mobile","WhatsApp","GST No.","City","Status","Approval","Balance"].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer">
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{c.id}</td>
                    <td className="px-4 py-2.5 font-semibold whitespace-nowrap">{c.name}</td>
                    <td className="px-4 py-2.5"><Badge variant="outline" className="text-xs">{c.type}</Badge></td>
                    <td className="px-4 py-2.5 text-muted-foreground">{c.mobile}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{c.whatsapp}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{c.gst || "—"}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{c.city}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-2.5"><StatusBadge status={c.approval} /></td>
                    <td className={`px-4 py-2.5 font-semibold tabular-nums ${c.balance > 0 ? "text-primary" : c.balance < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                      ₹{Math.abs(c.balance).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">No contacts found</td></tr>
                )}
              </tbody>
            </table>
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
        <p className="text-sm text-muted-foreground">Manage customers, suppliers and employees</p>
      </div>
      <Tabs defaultValue="customers">
        <TabsList className="h-9">
          <TabsTrigger value="customers" className="text-xs px-4">Customers (B2B / B2C)</TabsTrigger>
          <TabsTrigger value="suppliers" className="text-xs px-4">Suppliers</TabsTrigger>
          <TabsTrigger value="employees" className="text-xs px-4">Employees</TabsTrigger>
        </TabsList>
        <TabsContent value="customers" className="mt-4">
          <ContactTable type={["B2B","B2C"]} />
        </TabsContent>
        <TabsContent value="suppliers" className="mt-4">
          <ContactTable type="Supplier" />
        </TabsContent>
        <TabsContent value="employees" className="mt-4">
          <ContactTable type="Employee" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
