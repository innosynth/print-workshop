import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { warehouses } from "@/lib/mockData";
import { Building2, Users, Tag, Package, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();
  const [company, setCompany] = useState({
    name: "CloudZoo 360 Print Workshop",
    address: "Unit 4, Industrial Estate, Andheri East, Mumbai – 400 093",
    gst: "27AABCC1234D1Z8",
    phone: "022-28349876",
    email: "info@cloudzoo360.in",
    website: "www.cloudzoo360.in",
    pan: "AABCC1234D",
    state: "Maharashtra",
    pincode: "400093",
  });

  const handleSave = () => {
    toast({ title: "Settings saved", description: "Company profile updated successfully." });
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure company profile, agents, and system settings</p>
      </div>

      <Tabs defaultValue="company">
        <TabsList className="h-9">
          <TabsTrigger value="company" className="text-xs px-3 gap-1.5"><Building2 className="h-3.5 w-3.5" />Company</TabsTrigger>
          <TabsTrigger value="agents" className="text-xs px-3 gap-1.5"><Users className="h-3.5 w-3.5" />Agents</TabsTrigger>
          <TabsTrigger value="hsn" className="text-xs px-3 gap-1.5"><Tag className="h-3.5 w-3.5" />HSN Config</TabsTrigger>
          <TabsTrigger value="warehouses" className="text-xs px-3 gap-1.5"><Package className="h-3.5 w-3.5" />Warehouses</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="mt-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Company Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-6">
                <div className="h-20 w-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="text-center">
                    <Building2 className="h-6 w-6 text-muted-foreground mx-auto" />
                    <p className="text-[10px] text-muted-foreground mt-1">Upload Logo</p>
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">Company Name</label>
                    <Input className="mt-1 h-9" value={company.name}
                      onChange={e => setCompany(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  {[
                    { key: "gst", label: "GST Number" }, { key: "pan", label: "PAN Number" },
                    { key: "phone", label: "Phone" }, { key: "email", label: "Email" },
                    { key: "website", label: "Website" }, { key: "state", label: "State" },
                    { key: "pincode", label: "Pincode" },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-xs font-medium text-muted-foreground">{f.label}</label>
                      <Input className="mt-1 h-9" value={(company as any)[f.key]}
                        onChange={e => setCompany(p => ({ ...p, [f.key]: e.target.value }))} />
                    </div>
                  ))}
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">Registered Address</label>
                    <Input className="mt-1 h-9" value={company.address}
                      onChange={e => setCompany(p => ({ ...p, address: e.target.value }))} />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button size="sm" className="gap-1.5" onClick={handleSave}><Save className="h-3.5 w-3.5" />Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Sales Agents</CardTitle>
                <Button size="sm" className="h-8 text-xs">Add Agent</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {["Name","Mobile","Email","Commission %","Active"].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "Arjun Kumar", mobile: "9823456789", email: "arjun.k@cloudzoo360.com", commission: 3, active: true },
                    { name: "Priya Singh", mobile: "9834567890", email: "priya.s@cloudzoo360.com", commission: 2.5, active: true },
                  ].map((a, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-semibold">{a.name}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{a.mobile}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{a.email}</td>
                      <td className="px-4 py-2.5 font-semibold text-primary">{a.commission}%</td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold bg-primary/10 text-primary border-primary/20">Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hsn" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">HSN / SAC Configuration</CardTitle>
                <Button size="sm" className="h-8 text-xs">Add HSN</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {["HSN Code","Description","GST Rate","Category"].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { hsn: "3921", desc: "Flex banners & plastic sheets", gst: "18%", cat: "Flex & Vinyl" },
                    { hsn: "3919", desc: "Self-adhesive vinyl & films", gst: "18%", cat: "Flex & Vinyl" },
                    { hsn: "4810", desc: "Photo & art paper", gst: "12%", cat: "Paper & Board" },
                    { hsn: "3215", desc: "Printing inks & chemicals", gst: "18%", cat: "Inks & Chemicals" },
                    { hsn: "3920", desc: "Laminate films", gst: "18%", cat: "Laminates" },
                    { hsn: "8443", desc: "Printer parts & hardware", gst: "18%", cat: "Hardware & Spares" },
                    { hsn: "5407", desc: "Polyester fabric media", gst: "12%", cat: "Fabric Media" },
                    { hsn: "4823", desc: "Dye sub transfer paper", gst: "12%", cat: "Fabric Media" },
                  ].map((h, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-mono text-xs font-semibold text-primary">{h.hsn}</td>
                      <td className="px-4 py-2.5 font-medium">{h.desc}</td>
                      <td className="px-4 py-2.5 font-semibold">{h.gst}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{h.cat}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="warehouses" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Warehouses & Locations</CardTitle>
                <Button size="sm" className="h-8 text-xs">Add Warehouse</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {["ID","Name","Location","Capacity","Incharge","Action"].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {warehouses.map(w => (
                    <tr key={w.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-mono text-xs">{w.id}</td>
                      <td className="px-4 py-2.5 font-semibold">{w.name}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{w.location}</td>
                      <td className="px-4 py-2.5 tabular-nums">{w.capacity.toLocaleString("en-IN")} sqft</td>
                      <td className="px-4 py-2.5">{w.incharge}</td>
                      <td className="px-4 py-2.5">
                        <Button variant="ghost" size="sm" className="h-7 text-xs">Edit</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
