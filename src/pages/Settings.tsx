import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { warehouses } from "@/lib/mockData";
import { Building2, Users, Tag, Package, Save, Printer, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePrintSettings } from "@/lib/print-settings-context";
import { Textarea } from "@/components/ui/textarea";

function AddAgentModal() {
  const [open, setOpen] = useState(false);
  const [agentForm, setAgentForm] = useState({ name: "", mobile: "", email: "", commission: 0, active: true });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 text-xs gap-1"><Plus className="h-3.5 w-3.5" />Add Agent</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add New Sales Agent</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs">Agent Name *</Label>
            <Input className="mt-1 h-9" value={agentForm.name} onChange={e => setAgentForm({ ...agentForm, name: e.target.value })} placeholder="Enter agent name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Mobile *</Label>
              <Input className="mt-1 h-9" value={agentForm.mobile} onChange={e => setAgentForm({ ...agentForm, mobile: e.target.value })} placeholder="Mobile number" />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input className="mt-1 h-9" value={agentForm.email} onChange={e => setAgentForm({ ...agentForm, email: e.target.value })} placeholder="Email address" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Commission (%)</Label>
            <Input type="number" className="mt-1 h-9" value={agentForm.commission} onChange={e => setAgentForm({ ...agentForm, commission: parseFloat(e.target.value) || 0 })} placeholder="Commission percentage" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => { console.log("Adding agent:", agentForm); setOpen(false); }}>Add Agent</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddHSNModal() {
  const [open, setOpen] = useState(false);
  const [hsnForm, setHsnForm] = useState({ hsn: "", description: "", gstRate: "18", category: "" });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 text-xs gap-1"><Plus className="h-3.5 w-3.5" />Add HSN</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add HSN/SAC Code</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">HSN/SAC Code *</Label>
              <Input className="mt-1 h-9" value={hsnForm.hsn} onChange={e => setHsnForm({ ...hsnForm, hsn: e.target.value })} placeholder="e.g., 3921" />
            </div>
            <div>
              <Label className="text-xs">GST Rate (%)</Label>
              <Select value={hsnForm.gstRate} onValueChange={(v) => setHsnForm({ ...hsnForm, gstRate: v })}>
                <SelectTrigger className="mt-1 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0%</SelectItem>
                  <SelectItem value="5">5%</SelectItem>
                  <SelectItem value="12">12%</SelectItem>
                  <SelectItem value="18">18%</SelectItem>
                  <SelectItem value="28">28%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Description *</Label>
            <Input className="mt-1 h-9" value={hsnForm.description} onChange={e => setHsnForm({ ...hsnForm, description: e.target.value })} placeholder="Description of goods/services" />
          </div>
          <div>
            <Label className="text-xs">Category</Label>
            <Input className="mt-1 h-9" value={hsnForm.category} onChange={e => setHsnForm({ ...hsnForm, category: e.target.value })} placeholder="Category name" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => { console.log("Adding HSN:", hsnForm); setOpen(false); }}>Add HSN</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddWarehouseModal() {
  const [open, setOpen] = useState(false);
  const [warehouseForm, setWarehouseForm] = useState({ id: "", name: "", location: "", capacity: 0, incharge: "", phone: "", email: "" });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 text-xs gap-1"><Plus className="h-3.5 w-3.5" />Add Warehouse</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add New Warehouse</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Warehouse ID *</Label>
              <Input className="mt-1 h-9" value={warehouseForm.id} onChange={e => setWarehouseForm({ ...warehouseForm, id: e.target.value })} placeholder="e.g., WH001" />
            </div>
            <div>
              <Label className="text-xs">Warehouse Name *</Label>
              <Input className="mt-1 h-9" value={warehouseForm.name} onChange={e => setWarehouseForm({ ...warehouseForm, name: e.target.value })} placeholder="Warehouse name" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Location *</Label>
            <Input className="mt-1 h-9" value={warehouseForm.location} onChange={e => setWarehouseForm({ ...warehouseForm, location: e.target.value })} placeholder="Full address" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Capacity (sqft)</Label>
              <Input type="number" className="mt-1 h-9" value={warehouseForm.capacity} onChange={e => setWarehouseForm({ ...warehouseForm, capacity: parseInt(e.target.value) || 0 })} placeholder="Capacity in sqft" />
            </div>
            <div>
              <Label className="text-xs">Incharge Person</Label>
              <Input className="mt-1 h-9" value={warehouseForm.incharge} onChange={e => setWarehouseForm({ ...warehouseForm, incharge: e.target.value })} placeholder="Person in charge" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Phone</Label>
              <Input className="mt-1 h-9" value={warehouseForm.phone} onChange={e => setWarehouseForm({ ...warehouseForm, phone: e.target.value })} placeholder="Contact phone" />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input className="mt-1 h-9" value={warehouseForm.email} onChange={e => setWarehouseForm({ ...warehouseForm, email: e.target.value })} placeholder="Contact email" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => { console.log("Adding warehouse:", warehouseForm); setOpen(false); }}>Add Warehouse</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Settings() {
  const { settings: printSettings, setSettings: setPrintSettings } = usePrintSettings();
  const { toast } = useToast();
  const [company, setCompany] = useState({
    name: "InnoSynth Print Workshop",
    address: "Unit 4, Industrial Estate, Andheri East, Mumbai – 400 093",
    gst: "27AABCC1234D1Z8",
    phone: "022-28349876",
    email: "info@innosynth.org",
    website: "www.innosynth.org",
    pan: "AABCC1234D",
    state: "Maharashtra",
    pincode: "400093",
  });

  const handleSave = () => {
    toast({ title: "Settings saved", description: "Company profile updated successfully." });
  };

  const handlePrintSettingsSave = () => {
    toast({ title: "Print settings saved", description: "Print configuration updated successfully." });
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
          <TabsTrigger value="print" className="text-xs px-3 gap-1.5"><Printer className="h-3.5 w-3.5" />Print Config</TabsTrigger>
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

        <TabsContent value="print" className="mt-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Print Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Default Paper Size */}
              <div>
                <Label className="text-sm font-medium">Default Paper Size</Label>
                <Select value={printSettings.defaultPaperSize} onValueChange={(v) => setPrintSettings({ ...printSettings, defaultPaperSize: v as "A4" | "thermal" })}>
                  <SelectTrigger className="mt-1 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4 (210mm x 297mm)</SelectItem>
                    <SelectItem value="thermal">Thermal (80mm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* A4 Settings */}
              <div className="space-y-4">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Printer className="h-4 w-4" />A4 Paper Settings
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Page Margin (mm)</Label>
                    <Input type="number" className="mt-1 h-9" value={printSettings.a4Margin}
                      onChange={e => setPrintSettings({ ...printSettings, a4Margin: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Font Size (px)</Label>
                    <Input type="number" className="mt-1 h-9" value={printSettings.a4FontSize}
                      onChange={e => setPrintSettings({ ...printSettings, a4FontSize: e.target.value })} />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Thermal Settings */}
              <div className="space-y-4">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Printer className="h-4 w-4" />Thermal Paper Settings
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Paper Width (mm)</Label>
                    <Select value={printSettings.thermalWidth} onValueChange={(v) => setPrintSettings({ ...printSettings, thermalWidth: v })}>
                      <SelectTrigger className="mt-1 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="57">57mm</SelectItem>
                        <SelectItem value="58">58mm</SelectItem>
                        <SelectItem value="80">80mm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Paper Height (mm)</Label>
                    <Input type="number" className="mt-1 h-9" value={printSettings.thermalHeight}
                      onChange={e => setPrintSettings({ ...printSettings, thermalHeight: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Page Margin (mm)</Label>
                    <Input type="number" className="mt-1 h-9" value={printSettings.thermalMargin}
                      onChange={e => setPrintSettings({ ...printSettings, thermalMargin: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Font Size (px)</Label>
                    <Input type="number" className="mt-1 h-9" value={printSettings.thermalFontSize}
                      onChange={e => setPrintSettings({ ...printSettings, thermalFontSize: e.target.value })} />
                  </div>
                </div>
              </div>

              <Separator />
              <div className="flex justify-end">
                <Button size="sm" className="gap-1.5" onClick={handlePrintSettingsSave}><Save className="h-3.5 w-3.5" />Save Print Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Sales Agents</CardTitle>
                <AddAgentModal />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {["Name", "Mobile", "Email", "Commission %", "Active"].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "Arjun Kumar", mobile: "9823456789", email: "arjun.k@innosynth.org", commission: 3, active: true },
                    { name: "Priya Singh", mobile: "9834567890", email: "priya.s@innosynth.org", commission: 2.5, active: true },
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
                <AddHSNModal />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {["HSN Code", "Description", "GST Rate", "Category"].map(h => (
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
                <AddWarehouseModal />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {["ID", "Name", "Location", "Capacity", "Incharge", "Action"].map(h => (
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
