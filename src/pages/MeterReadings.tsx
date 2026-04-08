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
  const [formData, setFormData] = useState({ id: null as number | null, machineName: "", startReading: "", endReading: "", date: new Date().toISOString().split('T')[0] });

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
      setFormData({ id: null, machineName: "", startReading: "", endReading: "", date: new Date().toISOString().split('T')[0] });
      toast({ title: "Success", description: "Meter reading saved successfully." });
    }
  });

  const filtered = readings.filter((r: any) => 
    r.machineName.toLowerCase().includes(search.toLowerCase()) || 
    r.userName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" /> Machine Meter Readings
          </h1>
          <p className="text-sm text-muted-foreground">Track daily machine consumption and counters</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search machine or user..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 gap-1.5 shadow-lg shadow-primary/20">
                <Plus className="h-3.5 w-3.5" /> Log Reading
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-zinc-950 border-zinc-800">
              <DialogHeader>
                <DialogTitle>{formData.id ? 'End of Day Reading' : 'Start Reading'}</DialogTitle>
                <DialogDescription>Record the current meter value for the machine.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Machine Name</Label>
                  <Input 
                    placeholder="e.g. Roland 700 / Plotter 1" 
                    value={formData.machineName} 
                    onChange={e => setFormData({ ...formData, machineName: e.target.value })}
                    disabled={!!formData.id}
                    className="bg-zinc-900/50 border-zinc-800"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input 
                      type="date" 
                      value={formData.date} 
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                      disabled={!!formData.id}
                      className="bg-zinc-900/50 border-zinc-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Start Reading</Label>
                    <Input 
                      type="number" 
                      placeholder="Initial count" 
                      value={formData.startReading} 
                      onChange={e => setFormData({ ...formData, startReading: e.target.value })}
                      disabled={!!formData.id}
                      className="bg-zinc-900/50 border-zinc-800"
                    />
                  </div>
                </div>
                {formData.id && (
                  <div className="space-y-2 bg-primary/5 p-4 rounded-lg border border-primary/20 animate-in fade-in zoom-in duration-300">
                    <Label className="text-primary">Closing Reading (End of Day)</Label>
                    <Input 
                      type="number" 
                      placeholder="Current count" 
                      value={formData.endReading} 
                      onChange={e => setFormData({ ...formData, endReading: e.target.value })}
                      className="bg-zinc-900/50 border-primary/30 focus:border-primary h-11 text-lg font-bold"
                      autoFocus
                    />
                  </div>
                )}
                <Button 
                  className="w-full h-11 font-bold" 
                  onClick={() => mutation.mutate({ ...formData, userId: user?.id })}
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  {formData.id ? 'Save Closing Reading' : 'Log Start Reading'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <div className="xl:col-span-3">
          <Card className="border-zinc-800 bg-zinc-900/20 backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="overflow-auto min-h-[400px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-900/50 text-muted-foreground">
                        <th className="text-left px-6 py-4 font-semibold uppercase text-[10px] tracking-wider">Date</th>
                        <th className="text-left px-6 py-4 font-semibold uppercase text-[10px] tracking-wider">Machine</th>
                        <th className="px-4 py-4 font-semibold uppercase text-[10px] tracking-wider">Opening</th>
                        <th className="px-4 py-4 font-semibold uppercase text-[10px] tracking-wider">Closing</th>
                        <th className="px-4 py-4 font-semibold uppercase text-[10px] tracking-wider">Consumption</th>
                        <th className="text-left px-6 py-4 font-semibold uppercase text-[10px] tracking-wider">Logged By</th>
                        <th className="text-right px-6 py-4 font-semibold uppercase text-[10px] tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {filtered.map((r: any) => (
                        <tr key={r.id} className="hover:bg-zinc-800/20 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap text-zinc-400 font-medium">{r.date}</td>
                          <td className="px-6 py-4 font-bold text-zinc-100">{r.machineName}</td>
                          <td className="px-4 py-4 text-center font-mono text-zinc-400 tracking-tight">{parseFloat(r.startReading).toLocaleString()}</td>
                          <td className="px-4 py-4 text-center font-mono text-zinc-100 font-semibold">
                            {r.endReading ? parseFloat(r.endReading).toLocaleString() : <span className="text-orange-500 animate-pulse font-medium text-[10px] uppercase">Running...</span>}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {r.diff ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs ring-1 ring-primary/20">
                                <TrendingDown className="h-3 w-3" /> {parseFloat(r.diff).toLocaleString()}
                              </div>
                            ) : "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-zinc-400">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                                {r.userName?.substring(0, 2).toUpperCase()}
                              </div>
                              {r.userName}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {!r.endReading && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-7 text-xs border-primary/20 hover:border-primary/50 text-primary"
                                onClick={() => {
                                  setFormData({ id: r.id, machineName: r.machineName, startReading: r.startReading, endReading: "", date: r.date });
                                  setOpen(true);
                                }}
                              >
                                End Day
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-zinc-800 bg-zinc-900/40">
            <CardHeader>
              <CardTitle className="text-sm">Usage Overview</CardTitle>
              <CardDescription className="text-[10px]">Total consumption today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Active Jobs</span>
                  </div>
                  <span className="text-lg font-bold">{readings.filter((r: any) => !r.endReading).length}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Consumption Trend</span>
                    <span className="text-primary font-bold">Standard</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[65%]" />
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-2 text-primary mb-1">
                    <LayoutPanelLeft className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Efficiency Tip</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">
                    Closing readings should be logged before midnight to ensure accurate daily performance reports.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
