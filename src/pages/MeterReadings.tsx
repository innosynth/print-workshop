import { useState, Fragment } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Loader2, Gauge, Save, History, TrendingDown, LayoutPanelLeft, Edit2, Download, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as XLSX from 'xlsx';

export default function MeterReadings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeRange = searchParams.get("range") || "Month";
  const setActiveRange = (v: string) => setSearchParams({ range: v });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [newMachineMode, setNewMachineMode] = useState(false);
  const [newMachineName, setNewMachineName] = useState("");
  
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30); // Default to last 30 days to ensure March data shows
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  
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
    openingReading: "0",
    closingReading: "0"
  });

  const { data: readingsData, isLoading } = useQuery({
    queryKey: ["meter_readings"],
    queryFn: () => fetch("/api/system?resource=meter_readings").then(res => {
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    })
  });

  const { data: machinesList = [] } = useQuery({ 
    queryKey: ["machines"], 
    queryFn: () => fetch("/api/system?resource=machines").then(res => res.json()) 
  });

  const readings = Array.isArray(readingsData) ? readingsData : [];

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/system?resource=meter_readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meter_readings"] });
      setOpen(false);
      resetForm();
      toast({ title: "Success", description: "Meter reading saved successfully." });
    }
  });

  const machineMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/system?resource=machines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["machines"] });
      toast({ title: "Success", description: "New machine added." });
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
      openingReading: "0",
      closingReading: "0"
    });
    setNewMachineMode(false);
    setNewMachineName("");
  };

  const handleRangeChange = (range: string) => {
    setActiveRange(range);
    const today = new Date();
    const to = today.toISOString().split('T')[0];
    let from = dateTo;

    if (range === "Today") {
      from = to;
    } else if (range === "Week") {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      from = d.toISOString().split('T')[0];
    } else if (range === "Month") {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      from = d.toISOString().split('T')[0];
    } else if (range === "Year") {
      const d = new Date();
      d.setMonth(0, 1);
      from = d.toISOString().split('T')[0];
    }

    setDateFrom(from);
    setDateTo(to);
  };

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(filtered.map(r => ({
      'Machine Name': r.machineName,
      'Date': r.date,
      'BW Large': r.bwLarge,
      'BW Small': r.bwSmall,
      'Color Large': r.colorLarge,
      'Color Small': r.colorSmall,
      'LS Color': r.lsColor,
      'LS Mono': r.lsMono,
      'Opening': r.openingReading,
      'Closing': r.closingReading,
      'Total Usage': r.totalUsage
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Meter Readings");
    XLSX.writeFile(workbook, `Meter_Readings_${dateFrom}_to_${dateTo}.xlsx`);
  };

  const filtered = readings.filter((r: any) => {
    const matchesSearch = r.machineName?.toLowerCase().includes(search.toLowerCase());
    const matchesDate = r.date >= dateFrom && r.date <= dateTo;
    return matchesSearch && matchesDate;
  });

  return (
    <div className="p-6 space-y-6 bg-white min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3 uppercase tracking-tighter text-gray-900 leading-none">
            <div className="p-2 bg-primary/10 rounded-xl"><Gauge className="h-8 w-8 text-primary" /></div>
            Meter Reading Audit
          </h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-2 ml-14">High-Precision Machine Consumption Logs</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleExport} variant="outline" className="h-11 px-6 gap-2 font-black uppercase text-[10px] tracking-widest border-2 border-gray-100 rounded-xl hover:bg-gray-50 flex shadow-sm">
            <Download className="h-4 w-4" /> Export Report
          </Button>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if(!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="h-11 gap-2 font-black uppercase tracking-widest px-8 shadow-xl shadow-primary/20 bg-primary rounded-xl hover:scale-105 transition-all text-[11px]">
                <Plus className="h-4 w-4" /> Start New Shift
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white border-none shadow-2xl rounded-2xl overflow-hidden">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black uppercase tracking-tight">Log Daily Meter Reading</DialogTitle>
                <DialogDescription className="font-medium text-gray-400">Record closing counter values to track machine performance.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-8 py-6">
                <div className="space-y-6">
                   <div className="space-y-2">
                     <Label className="font-black uppercase text-[10px] tracking-widest text-gray-400">Target Machine</Label>
                     {newMachineMode ? (
                        <div className="flex gap-2">
                           <Input value={newMachineName} onChange={e => setNewMachineName(e.target.value)} placeholder="New machine name..." className="h-11 font-bold border-primary/20" />
                           <Button size="icon" className="h-11 w-11 shrink-0 shadow-lg shadow-primary/10" onClick={async () => {
                             if (newMachineName) {
                               await machineMutation.mutateAsync(newMachineName);
                               setFormData(prev => ({ ...prev, machineName: newMachineName }));
                               setNewMachineMode(false);
                             }
                           }}><Plus className="h-4 w-4" /></Button>
                           <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0 text-gray-300" onClick={() => setNewMachineMode(false)}>✕</Button>
                        </div>
                     ) : (
                        <div className="flex gap-2">
                          <Select value={formData.machineName} onValueChange={(v) => setFormData(prev => ({ ...prev, machineName: v }))}>
                            <SelectTrigger className="h-11 bg-gray-50 border-gray-100 font-bold uppercase text-[11px] tracking-widest">
                              <SelectValue placeholder="CHOOSE MACHINE" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-gray-100">
                              {machinesList.map((m: any) => (
                                <SelectItem key={m.id} value={m.name} className="font-bold uppercase text-[10px] tracking-widest">{m.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 border-gray-100 text-gray-300 hover:text-primary transition-colors" onClick={() => setNewMachineMode(true)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                     )}
                   </div>
                   <div className="space-y-1.5">
                     <Label className="font-bold uppercase text-[10px] text-gray-500">Date</Label>
                     <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="font-bold" />
                   </div>
                   <div className="space-y-4">
                     <div className="space-y-1.5 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                        <Label className="font-black uppercase text-[10px] text-emerald-700 tracking-widest">Opening Reading (Shift Start)</Label>
                        <Input type="number" value={formData.openingReading} onChange={e => setFormData({...formData, openingReading: e.target.value})} className="text-2xl font-black border-none bg-transparent h-auto p-0 focus-visible:ring-0 shadow-none" />
                     </div>
                     <div className="space-y-1.5 p-4 bg-primary/5 rounded-xl border border-primary/10">
                        <Label className="font-black uppercase text-[10px] text-primary tracking-widest">Closing Reading (Shift End)</Label>
                        <Input type="number" value={formData.closingReading || ""} onChange={e => setFormData({...formData, closingReading: e.target.value})} placeholder="0" className="text-2xl font-black border-none bg-transparent h-auto p-0 focus-visible:ring-0 shadow-none" />
                        <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase italic tracking-tighter">Enter manually or use machine counters &darr;</p>
                     </div>
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

      <div className="flex flex-col md:flex-row md:items-center gap-6 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search machine or model..." className="pl-10 h-11 bg-white border-gray-200 font-bold text-gray-700 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-gray-100">
           {["Today", "Week", "Month", "Year"].map(range => (
             <Button 
               key={range}
               variant={activeRange === range ? "default" : "ghost"}
               onClick={() => handleRangeChange(range)}
               className={`h-9 px-4 font-black uppercase text-[10px] tracking-widest rounded-lg transition-all ${activeRange === range ? "bg-primary shadow-lg shadow-primary/20" : "text-gray-400 hover:text-primary hover:bg-primary/5"}`}
             >
               {range}
             </Button>
           ))}
        </div>

        <div className="flex items-center gap-2">
           <div className="flex items-center gap-2 bg-white px-3 h-11 border border-gray-200 rounded-xl focus-within:border-primary transition-colors">
              <Calendar className="h-4 w-4 text-gray-400" />
              <Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setActiveRange("Custom"); }} className="border-none bg-transparent p-0 h-auto font-black text-[11px] uppercase focus-visible:ring-0 shadow-none w-28" />
              <span className="text-gray-300 font-black">&rarr;</span>
              <Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setActiveRange("Custom"); }} className="border-none bg-transparent p-0 h-auto font-black text-[11px] uppercase focus-visible:ring-0 shadow-none w-28" />
           </div>
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
              <th className="border-r border-white/20 px-4 py-2.5 text-right bg-blue-700" rowSpan={2}>Total Usage</th>
              <th className="px-4 py-2.5 text-center" rowSpan={2}>Audit</th>
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
              <tr><td colSpan={11} className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={11} className="py-20 text-center font-bold text-gray-400">NO METER READINGS RECORDED FOR THIS PERIOD</td></tr>
            ) : (
              filtered.map((r: any) => (
                <Fragment key={r.id}>
                  <tr className="bg-orange-50/50">
                    <td className="px-4 py-2 font-black uppercase text-sm border-r border-gray-100" colSpan={11}>{r.machineName}</td>
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
                    <td className="px-2 py-2.5 text-center border-r border-gray-100 tabular-nums font-bold text-green-600">
                       {parseFloat(r.closingReading || 0) === 0 ? (
                         <span className="text-[10px] bg-yellow-100 px-2 py-1 rounded text-yellow-700 animate-pulse font-black">PENDING...</span>
                       ) : parseFloat(r.closingReading || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right font-black text-sm bg-gray-50 border-r tabular-nums">{parseFloat(r.totalUsage || 0).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-center">
                       <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/20 hover:text-primary transition-all rounded-full" onClick={() => {
                          setFormData({
                            id: r.id,
                            machineName: r.machineName,
                            date: r.date,
                            bwLarge: r.bwLarge || "0",
                            bwSmall: r.bwSmall || "0",
                            colorLarge: r.colorLarge || "0",
                            colorSmall: r.colorSmall || "0",
                            lsColor: r.lsColor || "0",
                            lsMono: r.lsMono || "0",
                            openingReading: r.openingReading || "0",
                            closingReading: r.closingReading || "0"
                          });
                          setOpen(true);
                       }}>
                         <Edit2 className="h-4 w-4" />
                       </Button>
                    </td>
                  </tr>
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

