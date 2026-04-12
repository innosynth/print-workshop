import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, Save, Printer, Users, ShieldCheck, Loader2, Plus, Trash2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

type Permission = {
  module: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  fullAccess: boolean;
};

const MODULES = [
  "Dashboard", "Contacts", "Products", "Sales", "Purchase", "Accounting", "Inventory", "Meter Readings", "Reports", "Settings"
];

const INITIAL_PERMISSIONS: Permission[] = MODULES.map(m => ({
  module: m, view: true, create: false, edit: false, delete: false, fullAccess: false
}));

function RolesManager() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [roleName, setRoleName] = useState("");
  const [permissions, setPermissions] = useState<Permission[]>(INITIAL_PERMISSIONS);

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: () => fetch("/api/core?resource=roles").then(res => res.json())
  });

  const createRoleMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/core?resource=roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setRoleName("");
      setPermissions(INITIAL_PERMISSIONS);
      toast({ title: "Role created", description: "The new role has been added." });
    }
  });

  const handlePermissionChange = (moduleIndex: number, field: keyof Permission, value: boolean) => {
    const newPerms = [...permissions];
    const target = { ...newPerms[moduleIndex] };
    
    if (field === 'fullAccess') {
      target.fullAccess = value;
      target.view = value;
      target.create = value;
      target.edit = value;
      target.delete = value;
    } else {
      (target as any)[field] = value;
      if (!value) target.fullAccess = false;
      if (target.view && target.create && target.edit && target.delete) {
        target.fullAccess = true;
      }
    }
    newPerms[moduleIndex] = target;
    setPermissions(newPerms);
  };

  if (isLoading) return (
    <div className="py-20 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-sm font-bold flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Existing Roles</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((r: any) => (
            <Card key={r.id} className="border-border bg-muted/20 shadow-sm">
              <CardHeader className="p-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold">{r.name}</CardTitle>
                  <CardDescription className="text-[10px] uppercase font-semibold">Created {new Date(r.createdAt || Date.now()).toLocaleDateString()}</CardDescription>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
              </CardHeader>
            </Card>
          ))}
          {roles.length === 0 && (
            <div className="col-span-full py-8 text-center border-2 border-dashed border-muted rounded-xl text-muted-foreground text-sm italic">
              No roles configured yet. Create one below.
            </div>
          )}
        </div>
      </div>

      <Separator className="bg-muted" />

      <div className="flex items-end gap-4 bg-muted/30 p-4 rounded-lg border border-border">
        <div className="flex-1 space-y-1.5">
          <Label>Role Name</Label>
          <Input placeholder="e.g. Sales Manager" value={roleName} onChange={e => setRoleName(e.target.value)} className="h-9" />
        </div>
        <Button size="sm" onClick={() => createRoleMutation.mutate({ name: roleName, permissions })} disabled={!roleName || createRoleMutation.isPending}>
          {createRoleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          Create New Role
        </Button>
      </div>

      <Card className="border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" /> Permission Matrix
          </CardTitle>
          <CardDescription>Configure access levels for each system module</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 uppercase text-[10px] tracking-wider font-bold text-muted-foreground">
                  <th className="text-left px-6 py-3">Module Name</th>
                  <th className="px-4 py-3">Full Access</th>
                  <th className="px-4 py-3">View</th>
                  <th className="px-4 py-3">Create</th>
                  <th className="px-4 py-3">Edit</th>
                  <th className="px-4 py-3">Delete</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map((p, i) => (
                  <tr key={p.module} className="border-b last:border-0 hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4 font-bold text-gray-400 group-hover:text-primary transition-colors text-xs">{p.module}</td>
                    <td className="px-4 py-4 text-center">
                      <Checkbox checked={p.fullAccess} onCheckedChange={(v) => handlePermissionChange(i, 'fullAccess', !!v)} className="data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Checkbox checked={p.view} onCheckedChange={(v) => handlePermissionChange(i, 'view', !!v)} className="data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Checkbox checked={p.create} onCheckedChange={(v) => handlePermissionChange(i, 'create', !!v)} className="data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Checkbox checked={p.edit} onCheckedChange={(v) => handlePermissionChange(i, 'edit', !!v)} className="data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Checkbox checked={p.delete} onCheckedChange={(v) => handlePermissionChange(i, 'delete', !!v)} className="data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EmployeesManager() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", roleId: "" });

  const { data: employees = [], isLoading: empLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: () => fetch("/api/core?resource=users").then(res => res.json())
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: () => fetch("/api/core?resource=roles").then(res => res.json())
  });

  const createEmpMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/core?resource=users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, roleId: data.roleId ? parseInt(data.roleId) : null }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setFormData({ name: "", email: "", password: "", roleId: "" });
      setOpen(false);
      toast({ title: "Employee added", description: "The employee profile has been created." });
    }
  });

  if (empLoading) return (
    <div className="py-20 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Workshop Staff</h3>
          <p className="text-sm text-muted-foreground">Manage user accounts and assign roles</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Employee
        </Button>
      </div>

      {open && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input placeholder="Employee Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="email@company.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Assigned Role</Label>
                <Select value={formData.roleId} onValueChange={v => setFormData({ ...formData, roleId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
                  <SelectContent>
                    {roles.map((r: any) => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
                <Button size="sm" onClick={() => createEmpMutation.mutate(formData)} disabled={createEmpMutation.isPending}>
                  {createEmpMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Employee
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground">
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(employees) ? employees : []).map((emp: any) => (
                <tr key={emp.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{emp.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{emp.email}</td>
                  <td className="px-4 py-3">
                    {roles.find((r: any) => r.id === emp.roleId)?.name || <span className="text-muted-foreground italic text-xs">Unassigned</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">{emp.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && !empLoading && (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground italic">No employees found.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function PaymentQrManager() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [qrName, setQrName] = useState("");
  const [qrImage, setQrImage] = useState("");

  const { data: qrs = [], isLoading } = useQuery({
    queryKey: ["payment_qrs"],
    queryFn: () => fetch("/api/core?resource=payment_qrs").then(res => res.json())
  });

  const createQrMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/core?resource=payment_qrs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment_qrs"] });
      setQrName("");
      setQrImage("");
      toast({ title: "QR added", description: "Payment QR has been added." });
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/core?resource=payment_qrs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment_qrs"] });
      toast({ title: "Updated", description: "QR status updated." });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/core?resource=payment_qrs&id=${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment_qrs"] });
      toast({ title: "Deleted", description: "QR removed." });
    }
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setQrImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) return (
    <div className="py-20 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Payment QR Codes</h3>
          <p className="text-sm text-muted-foreground">Manage QR images for invoice and estimate payments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-primary/20 bg-primary/5 h-fit">
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label>QR Name / Label</Label>
              <Input placeholder="e.g. PhonePe - General" value={qrName} onChange={e => setQrName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>QR Image</Label>
              <div className="border-2 border-dashed border-primary/20 rounded-lg p-4 text-center hover:bg-primary/10 transition-all cursor-pointer relative">
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleFileUpload} />
                {qrImage ? (
                  <img src={qrImage} className="h-32 mx-auto rounded shadow-lg" alt="Preview" />
                ) : (
                  <div className="py-4">
                    <Plus className="h-8 w-8 mx-auto text-primary/50 mb-2" />
                    <p className="text-xs text-primary/70 font-medium">Click to upload QR image</p>
                  </div>
                )}
              </div>
            </div>
            <Button className="w-full" onClick={() => createQrMutation.mutate({ name: qrName, imageUrl: qrImage })} disabled={!qrName || !qrImage || createQrMutation.isPending}>
              {createQrMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save QR Code
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-3 px-1 overflow-y-auto max-h-[500px]">
          {qrs.map((qr: any) => (
            <QrCard key={qr.id} qr={qr} toggleMutation={toggleMutation} deleteMutation={deleteMutation} />
          ))}
          {qrs.length === 0 && !isLoading && (
            <div className="h-40 flex items-center justify-center border border-dashed rounded-lg text-muted-foreground text-sm italic">
              No QR codes uploaded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function QrCard({ qr, toggleMutation, deleteMutation }: any) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <Card className="border-border bg-white shadow-sm overflow-hidden group">
      <CardContent className="p-4 flex gap-4">
        <div className="relative h-20 w-20 shrink-0 bg-muted/20 rounded-lg flex items-center justify-center overflow-hidden">
          {!imgLoaded && <Loader2 className="absolute h-5 w-5 animate-spin text-primary/30" />}
          <img 
            src={qr.imageUrl} 
            className={`h-full w-full rounded-lg border border-border p-1 bg-white transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`} 
            alt={qr.name} 
            onLoad={() => setImgLoaded(true)}
          />
          <div className={`absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg ${imgLoaded ? 'block' : 'hidden'}`}>
            <Printer className="h-5 w-5 text-white" />
          </div>
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex justify-between items-start">
            <h4 className="font-bold text-sm text-foreground">{qr.name}</h4>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => deleteMutation.mutate(qr.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between bg-muted/40 p-2 px-3 rounded-lg border border-border/50">
              <label htmlFor={`inv-${qr.id}`} className="text-[9px] uppercase font-black text-muted-foreground cursor-pointer leading-tight">For Invoice</label>
              {toggleMutation.isPending && (toggleMutation.variables as any)?.id === qr.id && (toggleMutation.variables as any).isActiveForInvoice !== undefined ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              ) : (
                <Switch id={`inv-${qr.id}`} checked={qr.isActiveForInvoice} onCheckedChange={(v) => toggleMutation.mutate({ id: qr.id, isActiveForInvoice: !!v })} />
              )}
            </div>
            <div className="flex items-center justify-between bg-muted/40 p-2 px-3 rounded-lg border border-border/50">
              <label htmlFor={`est-${qr.id}`} className="text-[9px] uppercase font-black text-muted-foreground cursor-pointer leading-tight">For Estimate</label>
              {toggleMutation.isPending && (toggleMutation.variables as any)?.id === qr.id && (toggleMutation.variables as any).isActiveForEstimate !== undefined ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              ) : (
                <Switch id={`est-${qr.id}`} checked={qr.isActiveForEstimate} onCheckedChange={(v) => toggleMutation.mutate({ id: qr.id, isActiveForEstimate: !!v })} />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "company";
  const setActiveTab = (v: string) => setSearchParams({ tab: v });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showBankDetails, setShowBankDetails] = useState(false);

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/core?resource=settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
  });

  const [company, setCompany] = useState<any>({
    name: "", slogan: "", address: "", gst: "", phone: "", email: "", website: "", pan: "", state: "", pincode: "",
    bankName: "", bankBranch: "", accountNumber: "", ifscCode: "", accountName: "",
  });

  const [printConfig, setPrintConfig] = useState<any>({
    defaultPaperSize: "A4", a4Margin: 10, a4FontSize: 12, thermalWidth: "80", thermalHeight: "297", thermalMargin: 2, thermalFontSize: 10,
  });

  useEffect(() => {
    if (settingsData) {
      if (settingsData.profile) setCompany(settingsData.profile);
      if (settingsData.settings) setPrintConfig(settingsData.settings);
    }
  }, [settingsData]);

  const saveMutation = useMutation({
    mutationFn: async (data: { type: string, payload: any }) => {
      const res = await fetch("/api/core?resource=settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: data.type, ...data.payload }),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast({ title: "Settings saved", description: "Changes updated successfully." });
    },
  });

  const handleSave = () => saveMutation.mutate({ type: "profile", payload: company });
  const handlePrintSettingsSave = () => saveMutation.mutate({ type: "print", payload: printConfig });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCompany((p: any) => ({ ...p, logoUrl: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="p-6 space-y-4 bg-background">
      <div>
        <h1 className="text-xl font-bold font-heading">Settings & Workshop Management</h1>
        <p className="text-sm text-muted-foreground">Configure profile, users, roles and system behavior</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="company" className="w-full">
        <TabsList className="h-12 mb-6 bg-transparent gap-2 px-1">
          <TabsTrigger value="company" className="text-sm px-5 gap-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm border-b-2 border-transparent data-[state=active]:border-primary h-11 transition-all font-black uppercase tracking-tight"><Building2 className="h-4 w-4" />Workshop Profile</TabsTrigger>
          <TabsTrigger value="employees" className="text-sm px-5 gap-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm border-b-2 border-transparent data-[state=active]:border-primary h-11 transition-all font-black uppercase tracking-tight"><Users className="h-4 w-4" />Staff Members</TabsTrigger>
          <TabsTrigger value="roles" className="text-sm px-5 gap-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm border-b-2 border-transparent data-[state=active]:border-primary h-11 transition-all font-black uppercase tracking-tight"><ShieldCheck className="h-4 w-4" />RBAC Roles</TabsTrigger>
          <TabsTrigger value="qrs" className="text-sm px-5 gap-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm border-b-2 border-transparent data-[state=active]:border-primary h-11 transition-all font-black uppercase tracking-tight"><Save className="h-4 w-4" />Payment QRs</TabsTrigger>
          <TabsTrigger value="print" className="text-sm px-5 gap-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm border-b-2 border-transparent data-[state=active]:border-primary h-11 transition-all font-black uppercase tracking-tight"><Printer className="h-4 w-4" />Print Config</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-4">
          <Card className="bg-white border-border shadow-sm">
            <CardHeader className="pb-4 border-b border-muted/50 mb-4 bg-muted/5 rounded-t-xl">
              <CardTitle className="text-base font-bold">Workshop Identity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex flex-col lg:flex-row items-start gap-8">
                <div 
                  className="h-28 w-28 shrink-0 rounded-2xl border-2 border-dashed border-border flex items-center justify-center bg-muted/20 cursor-pointer hover:border-primary/50 transition-all group overflow-hidden shadow-inner relative"
                  onClick={() => document.getElementById('logo-upload')?.click()}
                >
                  <input type="file" id="logo-upload" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                  {company.logoUrl ? (
                    <div className="relative h-full w-full group/logo flex flex-col items-center justify-center">
                      <img src={company.logoUrl} className="h-full w-full object-contain p-2" alt="Logo" />
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        className="absolute top-1 right-1 h-7 w-7 rounded-full shadow-lg z-20"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCompany((p: any) => ({ ...p, logoUrl: "" }));
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="text-center group-hover:scale-105 transition-transform">
                        <Building2 className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                        <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-widest">UPLOAD LOGO</p>
                      </div>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Plus className="h-6 w-6 text-white" />
                      </div>
                    </>
                  )}
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                  <div className="md:col-span-2 lg:col-span-2">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1 block">Workshop/Company Name</label>
                    <Input className="h-10 bg-muted/30 border-border" value={company.name}
                      onChange={e => setCompany((p: any) => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1 block">Slogan / Tagline</label>
                    <Input className="h-10 bg-muted/30 border-border" value={company.slogan || ""}
                      onChange={e => setCompany((p: any) => ({ ...p, slogan: e.target.value }))} />
                  </div>
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1 block">Full Address</label>
                    <Input className="h-10 bg-muted/30 border-border" value={company.address || ""}
                      onChange={e => setCompany((p: any) => ({ ...p, address: e.target.value }))} />
                  </div>
                  {[
                    { key: "gst", label: "GST Number" }, { key: "pan", label: "PAN Number" },
                    { key: "phone", label: "Phone" }, { key: "email", label: "Email" },
                    { key: "state", label: "State" }, { key: "pincode", label: "Pincode" },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1 block">{f.label}</label>
                      <Input className="h-10 bg-muted/30 border-border" value={company[f.key] || ""}
                        onChange={e => setCompany((p: any) => ({ ...p, [f.key]: e.target.value }))} />
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="bg-muted" />
              
              <div className="space-y-4">
                <h3 className="text-sm font-bold flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> Settlement & Banking Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { key: "bankName", label: "Bank Name" }, { key: "bankBranch", label: "Branch Name" },
                    { key: "accountNumber", label: "Account Number", sensitive: true }, 
                    { key: "ifscCode", label: "IFSC Code", sensitive: true },
                    { key: "accountName", label: "Account Name / Beneficiary" }
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1 block">{f.label}</label>
                      <div className="relative">
                        <Input 
                          type={(f as any).sensitive && !showBankDetails ? "password" : "text"}
                          className="h-10 bg-muted/30 border-border pr-10" 
                          value={company[f.key] || ""}
                          onChange={e => setCompany((p: any) => ({ ...p, [f.key]: e.target.value }))} 
                        />
                        {(f as any).sensitive && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-10 w-10 hover:bg-transparent text-muted-foreground"
                            onClick={() => setShowBankDetails(!showBankDetails)}
                          >
                            {showBankDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="bg-muted" />

              <div className="flex justify-end pt-2">
                <Button size="sm" className="h-10 px-6 font-bold shadow-lg shadow-primary/20" onClick={handleSave} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Update Core Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees">
          <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
            <EmployeesManager />
          </div>
        </TabsContent>

        <TabsContent value="roles">
          <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
            <RolesManager />
          </div>
        </TabsContent>

        <TabsContent value="qrs">
          <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
            <PaymentQrManager />
          </div>
        </TabsContent>

        <TabsContent value="print">
          <Card className="bg-white border-border shadow-sm">
            <CardHeader className="pb-4 border-b border-muted/50 mb-4 bg-muted/5 rounded-t-xl">
              <CardTitle className="text-base font-bold">Print Output Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Default Document Layout</Label>
                  <Select value={printConfig.defaultPaperSize} onValueChange={(v) => setPrintConfig({ ...printConfig, defaultPaperSize: v as "A4" | "thermal" })}>
                    <SelectTrigger className="mt-1 h-11 bg-muted/30 border-border font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4">Standard A4 (Enterprise)</SelectItem>
                      <SelectItem value="thermal">Thermal POS (Small Format)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="space-y-4 p-6 rounded-2xl border border-border bg-muted/10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Printer className="h-12 w-12" />
                  </div>
                  <Label className="text-sm font-black flex items-center gap-2 text-primary uppercase">
                    <Printer className="h-4 w-4" /> A4 Layout Settings
                  </Label>
                  <div className="grid grid-cols-2 gap-6 relative z-10">
                    <div>
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Margins (mm)</Label>
                      <Input type="number" className="mt-1.5 h-10 bg-white border-border shadow-sm" value={printConfig.a4Margin}
                        onChange={e => setPrintConfig({ ...printConfig, a4Margin: parseInt(e.target.value) })} />
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Font Base (px)</Label>
                      <Input type="number" className="mt-1.5 h-10 bg-white border-border shadow-sm" value={printConfig.a4FontSize}
                        onChange={e => setPrintConfig({ ...printConfig, a4FontSize: parseInt(e.target.value) })} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-6 rounded-2xl border border-border bg-orange-50/30 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Printer className="h-12 w-12 text-orange-600" />
                  </div>
                  <Label className="text-sm font-black flex items-center gap-2 text-orange-600 uppercase">
                    <Printer className="h-4 w-4" /> Thermal POS Settings
                  </Label>
                  <div className="grid grid-cols-2 gap-6 relative z-10">
                    <div>
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Width (mm)</Label>
                      <Select value={printConfig.thermalWidth} onValueChange={(v) => setPrintConfig({ ...printConfig, thermalWidth: v })}>
                        <SelectTrigger className="mt-1.5 h-10 bg-white border-border shadow-sm"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="57">57mm</SelectItem><SelectItem value="58">58mm</SelectItem><SelectItem value="80">80mm</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Font Size (px)</Label>
                      <Input type="number" className="mt-1.5 h-10 bg-white border-border shadow-sm" value={printConfig.thermalFontSize}
                        onChange={e => setPrintConfig({ ...printConfig, thermalFontSize: parseInt(e.target.value) })} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-border mt-4">
                <Button size="sm" className="h-11 px-8 font-bold shadow-lg shadow-primary/20" onClick={handlePrintSettingsSave} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Update Print Policy
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="rbac">
          <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
             <RolesManager />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
