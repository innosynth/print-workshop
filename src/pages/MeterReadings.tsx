import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Loader2, Gauge, Save, History, TrendingDown, LayoutPanelLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";

export default function MeterReadings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({
    id: null as number | null,
    machineName: "",
    date: new Date().toISOString().split('T')[0],
    bwLarge: "0",
    bwSmall: "0",
    colorLarge: "0",
    colorSmall: "0",
    lsColor: "0",
    lsMono: "0",
    openingReading: "0"
  });

  const { data: readings = [], isLoading } = useQuery({
    queryKey: ["meter_readings"],
    queryFn: () => fetch("/api/system?resource=meter_readings").then(res => res.json())
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/system?resource=meter_readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meter_readings"] });
      setOpen(false);
      resetForm();
      toast({ title: "Success", description: "Meter reading saved successfully." });
    }
  });

  const resetForm = () => {
    setFormData({
      id: null,
      machineName: "",
      date: new Date().toISOString().split('T')[0],
      bwLarge: "0",
      bwSmall: "0",
      colorLarge: "0",
      colorSmall: "0",
      lsColor: "0",
      lsMono: "0",
      openingReading: "0"
    });
  };

  const filtered = readings.filter((r: any) => 
    r.machineName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 bg-white min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2 uppercase tracking-tight">
            <Gauge className="h-6 w-6 text-primary" /> Meter Reading Report
          </h1>
          <p className="text-sm font-bold text-gray-500 uppercase mt-0.5">Report Date From: {new Date().toLocaleDateString()} to {new Date().toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search machine..." className="pl-10 h-10 font-medium" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if(!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="h-10 gap-2 font-bold uppercase tracking-wider px-6 shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4" /> New Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white">
              <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase">Log Daily Meter Reading</DialogTitle>
                <DialogDescription>Enter the closing counter values for the machine.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-6 py-4">
                <div className="space-y-4">
                   <div className="space-y-1.5">
                     <Label className="font-bold uppercase text-[10px] text-gray-500">Machine Name</Label>
                     <Input placeholder="e.g. C 10000" value={formData.machineName} onChange={e => setFormData({...formData, machineName: e.target.value})} className="font-bold" />
                   </div>
                   <div className="space-y-1.5">
                     <Label className="font-bold uppercase text-[10px] text-gray-500">Date</Label>
                     <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="font-bold" />
                   </div>
                   <div className="space-y-1.5 p-4 bg-muted/30 rounded-lg">
                     <Label className="font-black uppercase text-[10px] text-primary">Opening Reading (Shift Start)</Label>
                     <Input type="number" value={formData.openingReading} onChange={e => setFormData({...formData, openingReading: e.target.value})} className="text-lg font-black border-primary/20" />
                   </div>
                </div>
                <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-3 p-3 border rounded-lg bg-blue-50/30">
                     <div className="col-span-2 text-[10px] font-black uppercase text-blue-600">BW Counters</div>
                     <div className="space-y-1">
                        <Label className="text-[9px] font-bold">LARGE</Label>
                        <Input type="number" value={formData.bwLarge} onChange={e => setFormData({...formData, bwLarge: e.target.value})} />
                     </div>
                     <div className="space-y-1">
                        <Label className="text-[9px] font-bold">SMALL</Label>
                        <Input type="number" value={formData.bwSmall} onChange={e => setFormData({...formData, bwSmall: e.target.value})} />
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-3 p-3 border rounded-lg bg-orange-50/30">
                     <div className="col-span-2 text-[10px] font-black uppercase text-orange-600">COLOR Counters</div>
                     <div className="space-y-1">
                        <Label className="text-[9px] font-bold">LARGE</Label>
                        <Input type="number" value={formData.colorLarge} onChange={e => setFormData({...formData, colorLarge: e.target.value})} />
                     </div>
                     <div className="space-y-1">
                        <Label className="text-[9px] font-bold">SMALL</Label>
                        <Input type="number" value={formData.colorSmall} onChange={e => setFormData({...formData, colorSmall: e.target.value})} />
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-3 p-3 border rounded-lg bg-purple-50/30">
                     <div className="col-span-2 text-[10px] font-black uppercase text-purple-600">LS Counters</div>
                     <div className="space-y-1">
                        <Label className="text-[9px] font-bold">COLOR</Label>
                        <Input type="number" value={formData.lsColor} onChange={e => setFormData({...formData, lsColor: e.target.value})} />
                     </div>
                     <div className="space-y-1">
                        <Label className="text-[9px] font-bold">MONO</Label>
                        <Input type="number" value={formData.lsMono} onChange={e => setFormData({...formData, lsMono: e.target.value})} />
                     </div>
                   </div>
                </div>
                <Button 
                  className="col-span-2 h-12 text-lg font-black uppercase tracking-widest shadow-xl" 
                  onClick={() => mutation.mutate({ ...formData, userId: user?.id })}
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-1.5" />}
                  Submit Reading Record
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-primary text-white font-black uppercase tracking-tighter">
              <th className="border-r border-white/20 px-4 py-2.5 text-left w-64" rowSpan={2}>Machine/ Group</th>
              <th className="border-r border-white/20 px-2 py-1 text-center" colSpan={2}>BW</th>
              <th className="border-r border-white/20 px-2 py-1 text-center" colSpan={2}>COLOR</th>
              <th className="border-r border-white/20 px-2 py-1 text-center" colSpan={2}>LS</th>
              <th className="border-r border-white/20 px-2 py-2.5 text-center" rowSpan={2}>Opening Reading</th>
              <th className="border-r border-white/20 px-2 py-2.5 text-center" rowSpan={2}>Closing Reading</th>
              <th className="px-4 py-2.5 text-right bg-blue-700" rowSpan={2}>Total Usage</th>
            </tr>
            <tr className="bg-primary/90 text-white font-bold uppercase text-[9px]">
              <th className="border-r border-white/10 px-2 py-1.5">LARGE</th>
              <th className="border-r border-white/10 px-2 py-1.5">SMALL</th>
              <th className="border-r border-white/10 px-2 py-1.5">LARGE</th>
              <th className="border-r border-white/10 px-2 py-1.5">SMALL</th>
              <th className="border-r border-white/10 px-2 py-1.5">COLOR</th>
              <th className="border-r border-white/10 px-2 py-1.5">MONO</th>
            </tr>
          </thead>
          <tbody className="divide-y font-medium text-gray-800">
            {isLoading ? (
              <tr><td colSpan={10} className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={10} className="py-20 text-center font-bold text-gray-400">NO METER READINGS RECORDED FOR THIS PERIOD</td></tr>
            ) : (
              filtered.map((r: any) => (
                <Fragment key={r.id}>
                  <tr className="bg-orange-50/50">
                    <td className="px-4 py-2 font-black uppercase text-sm border-r border-gray-100" colSpan={10}>{r.machineName}</td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-8 py-2.5 font-bold border-r border-gray-100 text-gray-500 italic">{r.date}</td>
                    <td className="px-2 py-2.5 text-center border-r border-gray-100 tabular-nums">{parseFloat(r.bwLarge || 0).toLocaleString()}</td>
                    <td className="px-2 py-2.5 text-center border-r border-gray-100 tabular-nums">{parseFloat(r.bwSmall || 0).toLocaleString()}</td>
                    <td className="px-2 py-2.5 text-center border-r border-gray-100 tabular-nums">{parseFloat(r.colorLarge || 0).toLocaleString()}</td>
                    <td className="px-2 py-2.5 text-center border-r border-gray-100 tabular-nums">{parseFloat(r.colorSmall || 0).toLocaleString()}</td>
                    <td className="px-2 py-2.5 text-center border-r border-gray-100 tabular-nums">{parseFloat(r.lsColor || 0).toLocaleString()}</td>
                    <td className="px-2 py-2.5 text-center border-r border-gray-100 tabular-nums">{parseFloat(r.lsMono || 0).toLocaleString()}</td>
                    <td className="px-2 py-2.5 text-center border-r border-gray-100 tabular-nums font-bold text-blue-600">{parseFloat(r.openingReading || 0).toLocaleString()}</td>
                    <td className="px-2 py-2.5 text-center border-r border-gray-100 tabular-nums font-bold text-green-600">{parseFloat(r.closingReading || 0).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right font-black text-sm bg-gray-50">{parseFloat(r.totalUsage || 0).toLocaleString()}</td>
                  </tr>
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="flex justify-end pt-4">
        <div className="bg-blue-600 text-white px-8 py-3 rounded-lg shadow-xl flex items-center gap-8">
           <div className="text-right">
             <p className="text-[10px] font-black uppercase opacity-70">Job Efficiency</p>
             <p className="text-sm font-bold">100% Verified</p>
           </div>
           <div className="text-right">
             <p className="text-[10px] font-black uppercase opacity-70">Audit Status</p>
             <p className="text-sm font-bold">Cleared</p>
           </div>
        </div>
      </div>
    </div>
  );
}

import { Fragment } from "react";
