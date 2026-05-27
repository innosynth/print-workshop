import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Check, ChevronsUpDown, Search, Plus, Upload, Edit2, UserPlus, Loader2, Calendar, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./Dashboard";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth-context";


// ─── CSV Column → DB Field mapping (the 12 always-filled fields) ──────────────
const CSV_COLUMN_MAP: Record<string, string> = {
  sku: "sku",
  product_name: "name",
  category: "category",
  sub_category: "subCategory",
  stock: "stock",
  selling_price: "sellPrice",
  min_stock: "minStock",
  purchase_price: "purchasePrice",
  hsn: "hsnCode",
  gst_percentage: "gstRate",
  unit: "unit",
  product_type: "type",
};

const TEMPLATE_HEADERS = Object.keys(CSV_COLUMN_MAP);

function downloadTemplate() {
  const header = TEMPLATE_HEADERS.join(",");
  const exampleRow = [
    "A4 PHOTO SHEET-FIRST",
    "A4 PHOTO SHEET",
    "PHOTO SHEET",
    "FIRST",
    "0",
    "30.00",
    "0",
    "0.00",
    "4909",
    "18",
    "Nos",
    "Service",
  ].join(",");
  const csv = `${header}\n${exampleRow}\n`;
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "product_import_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const rawHeaders = lines[0].split(",").map(h => h.replace(/^"|"$/g, "").trim().toLowerCase());
  return lines.slice(1).map(line => {
    // Handle quoted fields with commas inside
    const fields: string[] = [];
    let current = "";
    let inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === "," && !inQuote) { fields.push(current); current = ""; }
      else { current += ch; }
    }
    fields.push(current);
    const row: Record<string, string> = {};
    rawHeaders.forEach((h, i) => { row[h] = (fields[i] || "").trim(); });
    return row;
  }).filter(r => Object.values(r).some(v => v));
}

function mapRowToDb(row: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [csvCol, dbField] of Object.entries(CSV_COLUMN_MAP)) {
    const val = row[csvCol] ?? row[csvCol.replace(/_/g, " ")] ?? "";
    out[dbField] = val.trim();
  }
  return out;
}

type PreviewResult = {
  summary: { total: number; new: number; changed: number; unchanged: number; duplicatesInFile: number };
  newProducts: any[];
  changed: any[];
  unchanged: any[];
  duplicatesInFile: any[];
};

type ImportStep = "upload" | "preview" | "confirming" | "done";

function BulkImportModal({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<ImportStep>("upload");
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [activeTab, setActiveTab] = useState<"new" | "changed" | "unchanged" | "dup">("new");
  const [result, setResult] = useState<{ inserted: number; updated: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const reset = () => {
    setStep("upload");
    setFileName("");
    setPreview(null);
    setResult(null);
    setLoading(false);
    setActiveTab("new");
  };

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast({ variant: "destructive", title: "Invalid file", description: "Please upload a .csv file" });
      return;
    }
    setFileName(file.name);
    setLoading(true);
    try {
      const text = await file.text();
      const rawRows = parseCSV(text);
      if (rawRows.length === 0) throw new Error("No data rows found in the CSV.");
      const mapped = rawRows.map(mapRowToDb);
      const res = await fetch("/api/core?resource=product_bulk_preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mapped),
      });
      if (!res.ok) throw new Error(await res.text());
      const data: PreviewResult = await res.json();
      setPreview(data);
      setActiveTab(data.summary.new > 0 ? "new" : data.summary.changed > 0 ? "changed" : "unchanged");
      setStep("preview");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Parse Error", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!preview) return;
    setStep("confirming");
    setLoading(true);
    try {
      const res = await fetch("/api/core?resource=product_bulk_confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newProducts: preview.newProducts, changed: preview.changed }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResult(data);
      setStep("done");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Import Failed", description: e.message });
      setStep("preview");
    } finally {
      setLoading(false);
    }
  };

  const SummaryCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className={`rounded-xl border-2 p-4 text-center ${color}`}>
      <p className="text-3xl font-black tabular-nums">{value}</p>
      <p className="text-[0.625rem] font-bold uppercase tracking-widest mt-1 opacity-70">{label}</p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); setOpen(v); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-white">
          <div>
            <h2 className="font-black text-lg tracking-tight flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" /> Bulk Import Products
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {step === "upload" && "Upload a CSV file to import or update products"}
              {step === "preview" && `Preview — ${preview?.summary.total} rows from "${fileName}"`}
              {step === "confirming" && "Applying changes to database…"}
              {step === "done" && "Import complete!"}
            </p>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-2 text-[0.6rem] font-black uppercase tracking-widest">
            {(["upload", "preview", "done"] as ImportStep[]).map((s, i) => (
              <div key={s} className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[0.55rem] font-black ${step === s || (step === "confirming" && s === "preview") ? "bg-primary text-white" : (["upload","preview","done"].indexOf(step) > i) ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>{i+1}</div>
                <span className={step === s ? "text-primary" : "text-muted-foreground"}>{s === "upload" ? "Upload" : s === "preview" ? "Review" : "Done"}</span>
                {i < 2 && <span className="text-muted-foreground/40 mx-0.5">→</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Step 1: Upload ─────────────────────────────────────── */}
          {step === "upload" && (
            <div className="p-6 space-y-5">
              {/* Download template */}
              <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-primary">Step 1: Download the Template</p>
                  <p className="text-xs text-muted-foreground mt-0.5">12 columns — sku, product_name, category, sub_category, stock, selling_price, min_stock, purchase_price, hsn, gst_percentage, unit, product_type</p>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5 border-primary/30 text-primary hover:bg-primary/5 shrink-0" onClick={downloadTemplate}>
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 16l-4-4h3V4h2v8h3l-4 4zM4 20h16" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Download Template
                </Button>
              </div>

              {/* Drop zone */}
              <div
                className={`border-2 border-dashed rounded-xl p-12 text-center space-y-3 cursor-pointer transition-all ${dragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-muted hover:border-primary/40 hover:bg-muted/20"}`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                onClick={() => fileInputRef.current?.click()}
              >
                {loading ? (
                  <><Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" /><p className="text-sm font-bold text-primary">Analysing file…</p></>
                ) : (
                  <>
                    <Upload className={`h-10 w-10 mx-auto transition-colors ${dragging ? "text-primary" : "text-muted-foreground"}`} />
                    <div>
                      <p className="text-sm font-bold">{dragging ? "Drop it!" : "Drag & Drop your CSV here"}</p>
                      <p className="text-xs text-muted-foreground mt-1">or click to browse — only .csv files accepted</p>
                    </div>
                  </>
                )}
                <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
              </div>

              <div className="flex justify-between items-center text-xs text-muted-foreground px-1">
                <span>Step 2: Upload your filled CSV file above</span>
                <span>Step 3: Review changes before confirming</span>
              </div>
            </div>
          )}

          {/* ── Step 2: Preview ────────────────────────────────────── */}
          {step === "preview" && preview && (
            <div className="p-6 space-y-5">
              {/* Summary cards */}
              <div className="grid grid-cols-4 gap-3">
                <SummaryCard label="New Products" value={preview.summary.new} color="border-emerald-200 bg-emerald-50 text-emerald-700" />
                <SummaryCard label="Price / GST Changes" value={preview.summary.changed} color="border-amber-200 bg-amber-50 text-amber-700" />
                <SummaryCard label="Unchanged" value={preview.summary.unchanged} color="border-gray-200 bg-gray-50 text-gray-500" />
                <SummaryCard label="File Duplicates" value={preview.summary.duplicatesInFile} color="border-red-200 bg-red-50 text-red-600" />
              </div>

              {/* Tab selector */}
              <div className="flex gap-1 p-1 bg-muted/40 rounded-lg border w-fit">
                {([
                  { key: "new",       label: `New (${preview.summary.new})`,                   color: "text-emerald-700" },
                  { key: "changed",   label: `Changes (${preview.summary.changed})`,           color: "text-amber-700" },
                  { key: "unchanged", label: `Unchanged (${preview.summary.unchanged})`,       color: "text-gray-500" },
                  { key: "dup",       label: `Duplicates (${preview.summary.duplicatesInFile})`,color: "text-red-600" },
                ] as const).map(t => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`px-3 py-1.5 rounded-md text-[0.6875rem] font-bold transition-all ${activeTab === t.key ? `bg-white shadow-sm ${t.color}` : "text-muted-foreground hover:text-foreground"}`}
                  >{t.label}</button>
                ))}
              </div>

              {/* Table */}
              <div className="border rounded-xl overflow-auto max-h-[340px]">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted/60 border-b">
                    <tr>
                      <th className="text-left px-3 py-2.5 font-black uppercase tracking-wider text-[0.6rem] text-muted-foreground whitespace-nowrap">SKU</th>
                      <th className="text-left px-3 py-2.5 font-black uppercase tracking-wider text-[0.6rem] text-muted-foreground">Product Name</th>
                      <th className="text-left px-3 py-2.5 font-black uppercase tracking-wider text-[0.6rem] text-muted-foreground">Category</th>
                      <th className="text-left px-3 py-2.5 font-black uppercase tracking-wider text-[0.6rem] text-muted-foreground">Sub Category</th>
                      <th className="text-right px-3 py-2.5 font-black uppercase tracking-wider text-[0.6rem] text-muted-foreground">Sell Price</th>
                      <th className="text-right px-3 py-2.5 font-black uppercase tracking-wider text-[0.6rem] text-muted-foreground">GST%</th>
                      {activeTab === "changed" && (
                        <th className="text-left px-3 py-2.5 font-black uppercase tracking-wider text-[0.6rem] text-amber-700 whitespace-nowrap">Fields Changed</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(activeTab === "new" ? preview.newProducts :
                      activeTab === "changed" ? preview.changed :
                      activeTab === "unchanged" ? preview.unchanged :
                      preview.duplicatesInFile
                    ).map((row: any, i: number) => {
                      const isChanged = activeTab === "changed";
                      const diff: { field: string; label: string; oldVal: string; newVal: string }[] = row._diff || [];
                      const getDiff = (field: string) => diff.find(d => d.field === field);
                      return (
                        <tr key={i} className={`hover:bg-muted/20 transition-colors align-top ${isChanged ? "bg-amber-50/30" : activeTab === "new" ? "bg-emerald-50/30" : activeTab === "dup" ? "bg-red-50/30" : ""}`}>
                          <td className="px-3 py-2.5 font-mono text-[0.65rem] text-primary font-bold whitespace-nowrap">{row.sku}</td>
                          <td className="px-3 py-2.5 max-w-[160px]">
                            {isChanged && getDiff("name") ? (
                              <div>
                                <span className="line-through text-muted-foreground text-[0.6rem] block">{getDiff("name")!.oldVal || "—"}</span>
                                <span className="font-bold text-amber-700">{getDiff("name")!.newVal}</span>
                              </div>
                            ) : <span className="font-medium">{row.name}</span>}
                          </td>
                          <td className="px-3 py-2.5 max-w-[120px]">
                            {isChanged && getDiff("category") ? (
                              <div>
                                <span className="line-through text-muted-foreground text-[0.6rem] block">{getDiff("category")!.oldVal || "—"}</span>
                                <span className="font-bold text-amber-700">{getDiff("category")!.newVal}</span>
                              </div>
                            ) : <span className="text-muted-foreground">{row.category}</span>}
                          </td>
                          <td className="px-3 py-2.5 max-w-[100px]">
                            {isChanged && getDiff("subCategory") ? (
                              <div>
                                <span className="line-through text-muted-foreground text-[0.6rem] block">{getDiff("subCategory")!.oldVal || "—"}</span>
                                <span className="font-bold text-amber-700">{getDiff("subCategory")!.newVal}</span>
                              </div>
                            ) : <span className="text-muted-foreground">{row.subCategory}</span>}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums font-bold whitespace-nowrap">
                            {isChanged && getDiff("sellPrice") ? (
                              <div>
                                <span className="line-through text-muted-foreground text-[0.6rem] block">₹{getDiff("sellPrice")!.oldVal}</span>
                                <span className="text-amber-700">₹{getDiff("sellPrice")!.newVal}</span>
                              </div>
                            ) : <span>₹{row.sellPrice}</span>}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">
                            {isChanged && getDiff("gstRate") ? (
                              <div>
                                <span className="line-through text-muted-foreground text-[0.6rem] block">{getDiff("gstRate")!.oldVal}%</span>
                                <span className="font-bold text-amber-700">{getDiff("gstRate")!.newVal}%</span>
                              </div>
                            ) : <span className="text-muted-foreground">{row.gstRate}%</span>}
                          </td>
                          {isChanged && (
                            <td className="px-3 py-2.5">
                              <div className="flex flex-wrap gap-1 max-w-[200px]">
                                {diff.map((d, di) => (
                                  <span key={di} className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-amber-100 border border-amber-200 text-[0.6rem] font-black text-amber-800 whitespace-nowrap">
                                    {d.label}
                                  </span>
                                ))}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                    {((activeTab === "new" ? preview.newProducts :
                      activeTab === "changed" ? preview.changed :
                      activeTab === "unchanged" ? preview.unchanged :
                      preview.duplicatesInFile).length === 0) && (
                      <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground italic text-xs">No records in this category</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {preview.summary.duplicatesInFile > 0 && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 9v3m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span><b>{preview.summary.duplicatesInFile} duplicate SKUs</b> were found within your file and will be skipped during import.</span>
                </div>
              )}
            </div>
          )}

          {/* ── Step: Done ─────────────────────────────────────────── */}
          {step === "done" && result && (
            <div className="p-10 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900">Import Complete!</h3>
                <p className="text-sm text-muted-foreground mt-1">Your product catalogue has been updated.</p>
              </div>
              <div className="flex gap-4 justify-center">
                <div className="px-6 py-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <p className="text-2xl font-black text-emerald-700">{result.inserted}</p>
                  <p className="text-[0.625rem] font-bold uppercase tracking-widest text-emerald-600 mt-1">Products Added</p>
                </div>
                <div className="px-6 py-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-2xl font-black text-amber-700">{result.updated}</p>
                  <p className="text-[0.625rem] font-bold uppercase tracking-widest text-amber-600 mt-1">Prices Updated</p>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="text-left max-h-32 overflow-y-auto p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 space-y-1">
                  <p className="font-bold mb-1">⚠ {result.errors.length} errors:</p>
                  {result.errors.map((e, i) => <p key={i}>{e}</p>)}
                </div>
              )}
            </div>
          )}

          {/* Confirming spinner */}
          {step === "confirming" && (
            <div className="p-16 text-center space-y-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
              <p className="font-bold text-sm">Saving to database…</p>
              <p className="text-xs text-muted-foreground">Please don't close this window</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-white flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            {step === "preview" && preview && (
              <span>Will add <b className="text-emerald-700">{preview.summary.new}</b> new & update <b className="text-amber-700">{preview.summary.changed}</b> price/GST changes</span>
            )}
          </div>
          <div className="flex gap-2">
            {step === "upload" && <Button variant="outline" onClick={() => { reset(); setOpen(false); }}>Cancel</Button>}
            {step === "preview" && (
              <>
                <Button variant="outline" onClick={reset}>← Back</Button>
                <Button
                  onClick={handleConfirm}
                  disabled={preview.summary.new === 0 && preview.summary.changed === 0}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  Confirm Import ({preview.summary.new + preview.summary.changed} changes)
                </Button>
              </>
            )}
            {step === "done" && (
              <>
                <Button variant="outline" onClick={reset}>Import Another</Button>
                <Button onClick={() => { reset(); setOpen(false); }}>Done</Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProductList({ products, isLoading, isError, canEdit }: { products: any[], isLoading: boolean, isError: boolean, canEdit: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [showInactive, setShowInactive] = useState(false);

  const inactiveCount = (products || []).filter((p: any) => p.status === "Inactive").length;

  const categories = Array.isArray(products) 
    ? Array.from(new Set(products.map((p: any) => (p.category || "").trim()))).filter(Boolean)
    : [];

  const filtered = (products || [])
    .filter((p: any) => {
      const matchesCategory = catFilter === "all" || p.category === catFilter;
      const matchesStatus = showInactive || p.status === "Active" || !p.status;
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
        (p.brand && p.brand.toLowerCase().includes(search.toLowerCase())) ||
        (p.hsnCode && p.hsnCode.toLowerCase().includes(search.toLowerCase()));
      return matchesCategory && matchesStatus && matchesSearch;
    });

  const toggleStatus = async (product: any) => {
    const newStatus = product.status === "Active" ? "Inactive" : "Active";
    try {
      const res = await fetch("/api/core?resource=products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...product, status: newStatus })
      });
      if (!res.ok) throw new Error("Failed to toggle status");
      toast({ title: "Status Updated", description: `"${product.name}" is now ${newStatus}` });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search SKU, name, brand..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <FormCombobox 
            label="Category" 
            value={catFilter === "all" ? "" : catFilter} 
            options={categories} 
            onSelect={(v) => setCatFilter(v)} 
          />
          {catFilter !== 'all' && (
            <Button variant="ghost" size="sm" onClick={() => setCatFilter('all')} className="h-9 text-xs">Clear</Button>
          )}
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 rounded-lg border border-muted-foreground/10">
          <Checkbox 
            id="show-inactive" 
            checked={showInactive} 
            onCheckedChange={(v) => setShowInactive(!!v)}
            className="h-4 w-4 border-muted-foreground/30 data-[state=checked]:bg-primary"
          />
          <Label htmlFor="show-inactive" className="text-[0.625rem] font-bold uppercase tracking-widest text-muted-foreground cursor-pointer select-none">Show Inactive</Label>
        </div>

        <div className="flex items-center gap-4 text-[0.625rem] font-black uppercase tracking-widest text-muted-foreground bg-muted/20 px-4 h-9 rounded-lg border border-muted-foreground/10">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1 h-1 rounded-full bg-gray-400" />
            <span className="opacity-70">Total:</span> {products.length}
          </div>
          <div className="flex items-center gap-1.5 text-primary whitespace-nowrap">
            <span className="w-1 h-1 rounded-full bg-primary" />
            <span className="opacity-70">Active:</span> {products.filter((p: any) => p.status === "Active" || !p.status).length}
          </div>
          <div className="flex items-center gap-1.5 text-orange-600 whitespace-nowrap">
            <span className="w-1 h-1 rounded-full bg-orange-600" />
            <span className="opacity-70">Inactive:</span> {inactiveCount}
          </div>
        </div>

        <div className="ml-auto">
          <BulkImportModal 
            trigger={<Button variant="outline" size="sm" className="h-9 gap-1"><Upload className="h-3.5 w-3.5" />Bulk Import</Button>}
          />
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto border rounded-lg h-[calc(100vh-280px)] relative bg-white shadow-inner">
            {isLoading ? (
              <div className="h-full flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : isError ? (
              <div className="h-full flex items-center justify-center p-8 text-destructive">Failed to load products</div>
            ) : (
              <table className="w-full text-sm min-w-[1700px] border-collapse">
                <thead className="sticky top-0 z-20 bg-white shadow-sm">
                  <tr className="border-b bg-muted/40 font-bold">
                    {["SKU", "Product Name", "Category", "Sub Category", "Stock", "GST %", "Selling Price", "Brand Name", "Purchase Price", "HSN", "Rack", "Part No.", "Barcode", "Status", "Type", ""].map(h => (
                      <th key={h} className="text-left px-4 py-4 text-[0.6875rem] uppercase tracking-wider font-black text-muted-foreground whitespace-nowrap border-b-2 border-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted/50">
                  {filtered.map((p: any) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors whitespace-nowrap group">
                      <td className="px-4 py-3">
                        {canEdit ? (
                          <CreateProductModal 
                             tabName="products" 
                             products={products}
                             initialData={p}
                             title="Edit Product"
                             trigger={
                               <button className="font-mono text-xs text-primary font-bold hover:underline underline-offset-4 decoration-primary/30">
                                 {p.sku || "EDIT"}
                               </button>
                             }
                          />
                        ) : (
                          <span className="font-mono text-xs text-muted-foreground">{p.sku || "—"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {canEdit ? (
                          <CreateProductModal 
                             tabName="products" 
                             products={products}
                             initialData={p}
                             title="Edit Product"
                             trigger={
                               <button className="font-medium text-primary hover:underline underline-offset-4 decoration-primary/30">
                                 {p.name}
                               </button>
                             }
                          />
                        ) : (
                          <span className="font-medium">{p.name}</span>
                        )}
                      </td>
                      <td className="px-4 py-3"><Badge variant="outline" className="text-[0.625rem] font-bold uppercase">{p.category}</Badge></td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{p.subCategory || "—"}</td>
                      <td className={`px-4 py-3 tabular-nums font-bold ${p.stock === 0 ? "text-destructive" : parseFloat(p.stock) < parseFloat(p.minStock) ? "text-yellow-600" : "text-primary"
                        }`}>{p.stock}</td>
                      <td className="px-4 py-3 tabular-nums font-bold text-orange-600">{p.gstRate ? `${p.gstRate}%` : "—"}</td>
                      <td className="px-4 py-3 tabular-nums font-black text-gray-900">₹{p.sellPrice}</td>
                      <td className="px-4 py-3 text-muted-foreground font-medium">{p.brand || "—"}</td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">₹{p.purchasePrice}</td>
                      <td className="px-4 py-3 font-mono text-xs text-primary font-bold">{p.hsnCode || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs">{p.rack || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.partNo || "—"}</td>
                      <td className="px-4 py-3 font-mono text-[0.625rem] text-muted-foreground">{p.barcode || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={p.status === "Active" || !p.status} 
                            onCheckedChange={() => toggleStatus(p)}
                            className="scale-75 data-[state=checked]:bg-primary"
                          />
                          <StatusBadge status={p.status || "Active"} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">{p.type || "PRODUCT"}</td>
                      <td className="px-4 py-3 text-right">
                        {canEdit && (
                          <CreateProductModal 
                            tabName="products" 
                            products={products}
                            initialData={p}
                            title="Edit Product"
                            trigger={
                              <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-primary/10 hover:text-primary transition-all text-muted-foreground/50">
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                            }
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                  {isLoading ? (
                    <tr><td colSpan={16} className="px-4 py-8 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading products...</td></tr>
                  ) : filtered.length === 0 && (
                    <tr><td colSpan={16} className="px-4 py-12 text-center text-muted-foreground italic">No products found in the catalog</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
      {filtered.length !== products.length && (
        <p className="text-[0.5625rem] font-medium text-muted-foreground/60 italic lowercase ml-1">
          Showing {filtered.length} products matching filters
        </p>
      )}
    </div>
  );
}

function CategoryList({ products, dbCategories }: { products: any[], dbCategories: any[] }) {
  const [search, setSearch] = useState("");
  const catNamesFromProducts = Array.isArray(products) 
    ? Array.from(new Set(products.map((p: any) => p.category))).filter(Boolean)
    : [];
  
  const allCategoryNames = Array.from(new Set([...catNamesFromProducts.map(c => c.trim()), ...dbCategories.map(c => (c.name || "").trim())]))
    .filter(cat => cat.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search categories..." 
          className="pl-9 h-10 shadow-sm transition-all focus:ring-primary/20" 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allCategoryNames.map(cat => {
          const prodCount = products.filter(p => p.category === cat).length;
          const totalStock = products.filter(p => p.category === cat).reduce((sum, p) => sum + (parseFloat(p.stock || 0)), 0);
          const dbCat = dbCategories.find(c => c.name === cat);
          return (
            <Card key={cat} className="overflow-hidden hover:border-primary/30 transition-colors cursor-pointer group">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-bold uppercase tracking-tight text-sm text-gray-900 group-hover:text-primary transition-colors">{cat}</h3>
                  <p className="text-xs text-muted-foreground font-medium">{prodCount} Products</p>
                  {dbCat?.description && <p className="text-[0.625rem] text-gray-400 italic line-clamp-1">{dbCat.description}</p>}
                </div>
                <div className="text-right">
                  <p className="text-[0.5625rem] font-black text-gray-400 uppercase tracking-[0.2em]">Total Stock</p>
                  <div className="flex items-center justify-end gap-1.5 mt-1">
                     <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                     <p className="text-xl font-black text-gray-900 leading-none">{totalStock}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {allCategoryNames.length === 0 && (
           <div className="col-span-full p-20 text-center text-muted-foreground border-2 border-dashed border-zinc-500 rounded-xl bg-gray-50/30 font-medium italic">No categories found matching your search</div>
        )}
      </div>
    </div>
  );
}

function BrandList({ products, dbBrands }: { products: any[], dbBrands: any[] }) {
  const [search, setSearch] = useState("");
  const brandNamesFromProducts = Array.isArray(products) 
    ? Array.from(new Set(products.map((p: any) => p.brand))).filter(Boolean)
    : [];
  
  const allBrandNames = Array.from(new Set([...brandNamesFromProducts.map(b => b.trim()), ...dbBrands.map(b => (b.name || "").trim())]))
    .filter(brand => brand.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search brands..." 
          className="pl-9 h-10 shadow-sm transition-all focus:ring-primary/20" 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allBrandNames.map(brand => {
          const prodCount = products.filter(p => p.brand === brand).length;
          const totalStock = products.filter(p => p.brand === brand).reduce((sum, p) => sum + (parseFloat(p.stock || 0)), 0);
          const dbBrand = dbBrands.find(b => b.name === brand);
          return (
            <Card key={brand} className="overflow-hidden hover:border-primary/30 transition-colors cursor-pointer group">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-bold uppercase tracking-tight text-sm text-gray-900 group-hover:text-primary transition-colors">{brand}</h3>
                  <p className="text-xs text-muted-foreground font-medium">{prodCount} Products</p>
                  {dbBrand?.description && <p className="text-[0.625rem] text-gray-400 italic line-clamp-1">{dbBrand.description}</p>}
                </div>
                <div className="text-right">
                  <p className="text-[0.5625rem] font-black text-gray-400 uppercase tracking-[0.2em]">Total Stock</p>
                  <div className="flex items-center justify-end gap-1.5 mt-1">
                     <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                     <p className="text-xl font-black text-gray-900 leading-none">{totalStock}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {allBrandNames.length === 0 && (
           <div className="col-span-full p-20 text-center text-muted-foreground border-2 border-dashed border-zinc-500 rounded-xl bg-gray-50/30 font-medium italic">No brands found matching your search</div>
        )}
      </div>
    </div>
  );
}

function PriceListRatesModal({ priceList, products, trigger }: { priceList: any, products: any[], trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  
  const { data: rates = [], isLoading } = useQuery({
    queryKey: ["pricelistitems", priceList.id],
    queryFn: () => fetch(`/api/core?resource=pricelistitems&priceListId=${priceList.id}`).then(res => res.json()),
    enabled: open
  });

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const updateRate = async (productId: number, newPrice: string) => {
    const existingRate = rates.find((r: any) => r.productId === productId);
    try {
      const res = await fetch(`/api/core?resource=pricelistitems`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: existingRate?.id,
          priceListId: priceList.id,
          productId,
          customPrice: newPrice
        })
      });
      if (!res.ok) throw new Error("Failed to update rate");
      queryClient.invalidateQueries({ queryKey: ["pricelistitems", priceList.id] });
      toast({ title: "Rate Updated", description: "The custom price has been saved." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update Failed", description: err.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl h-[58rem] max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 border-b">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Rates for {priceList.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-4 border-b bg-gray-50/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search products to set rates..." 
              className="pl-9 h-9 bg-white" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-0">
          <table className="w-full text-sm text-left">
            <thead className="text-[0.625rem] uppercase font-bold text-muted-foreground bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3">Product Name</th>
                <th className="px-6 py-3">Standard Price</th>
                <th className="px-6 py-3 w-[200px]">Custom Rate (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProducts.map(p => {
                const rate = rates.find((r: any) => r.productId === p.id);
                return (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{p.name}</p>
                      <p className="text-[0.625rem] text-muted-foreground">{p.sku}</p>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-medium">₹{p.sellPrice}</td>
                    <td className="px-6 py-4">
                      <Input 
                        type="number" 
                        defaultValue={rate?.customPrice || p.sellPrice} 
                        className={`h-8 font-bold ${rate ? 'border-primary/50 bg-primary/5' : ''}`}
                        onBlur={(e) => {
                          if (e.target.value !== (rate?.customPrice || p.sellPrice)) {
                            updateRate(p.id, e.target.value);
                          }
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t flex justify-end">
          <Button onClick={() => setOpen(false)}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PriceListView({ pricelists, isLoading, products }: { pricelists: any[], isLoading: boolean, products: any[] }) {
  const [search, setSearch] = useState("");
  
  const filtered = (pricelists || []).filter((p: any) => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search price lists..." 
          className="pl-9 h-10 shadow-sm" 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((pl: any) => (
          <Card key={pl.id} className="overflow-hidden hover:border-primary/30 transition-all cursor-pointer group shadow-sm">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-primary/5 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <StatusBadge status={pl.status} />
              </div>
              <div className="space-y-3">
                <h3 className="font-bold text-base text-gray-900 group-hover:text-primary transition-colors">{pl.name}</h3>
                {pl.description && <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{pl.description}</p>}
                
                <div className="pt-3 border-t flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span className="text-[0.625rem] font-medium">Starts: {pl.effectiveFrom ? new Date(pl.effectiveFrom).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <PriceListRatesModal 
                    priceList={pl} 
                    products={products}
                    trigger={<Button variant="ghost" size="sm" className="h-7 text-[0.625rem] uppercase font-bold tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">View Rates</Button>}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {isLoading ? (
           <div className="col-span-full p-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
        ) : filtered.length === 0 && (
           <div className="col-span-full p-20 text-center text-muted-foreground border-2 border-dashed border-zinc-500 rounded-xl bg-gray-50/30 font-medium">No price lists found matching your search</div>
        )}
      </div>
    </div>
  );
}

function FormCombobox({ label, value, options, onSelect, triggerRef, onKeyDown, openOnFocus }: { label: string, value: string, options: string[], onSelect: (v: string) => void, triggerRef?: any, onKeyDown?: (e: React.KeyboardEvent) => void, openOnFocus?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          ref={triggerRef}
          variant="outline" 
          role="combobox" 
          className="w-full mt-1 h-9 justify-between font-normal truncate"
          title={value || `Select ${label.toLowerCase()}`}
          onKeyDown={onKeyDown}
          onFocus={() => openOnFocus && setOpen(true)}
        >
          <span className="truncate">{value || `Select ${label.toLowerCase()}`}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 z-[100]">
        <Command>
          <CommandInput placeholder={`Search ${label.toLowerCase()}...`} className="h-9" />
          <CommandList>
            <CommandEmpty>No {label.toLowerCase()} found.</CommandEmpty>
            <CommandGroup>
              {Array.from(new Set(options.map(o => String(o || "").trim()))).sort().map((opt: string) => (
                <CommandItem
                  key={opt}
                  value={opt}
                  title={opt}
                  onSelect={() => {
                    onSelect(opt);
                    setOpen(false);
                  }}
                  className="cursor-default"
                >
                  <Check className={cn("mr-2 h-4 w-4", value === opt ? "opacity-100" : "opacity-0")} />
                  {String(opt)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function CreateProductModal({ trigger, title, tabName, products, initialData }: { trigger: React.ReactNode; title: string, tabName: string, products: any[], initialData?: any }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const defaultValues = {
    sku: `SKU-${Date.now().toString().slice(-4)}`,
    name: "",
    category: "",
    subCategory: "",
    brand: "",
    type: "SERVICE",
    sellPrice: "0",
    purchasePrice: "0",
    stock: "0",
    minStock: "10",
    unit: "Nos.",
    rack: "",
    partNo: "",
    barcode: "",
    hsnCode: "",
    gstRate: "18",
    description: "",
    status: "Active"
  };

  const [formData, setFormData] = useState<any>(initialData?.id ? initialData : { ...defaultValues, ...initialData });
  const fieldRefs = useRef<Record<string, any>>({});
  const saveBtnRef = useRef<HTMLButtonElement>(null);

  const handleEnter = (e: React.KeyboardEvent, nextKey?: string, isLast?: boolean) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (isLast) {
        saveBtnRef.current?.focus();
      } else if (nextKey) {
        fieldRefs.current[nextKey]?.focus();
        if (fieldRefs.current[nextKey] instanceof HTMLInputElement) {
          fieldRefs.current[nextKey]?.select();
        }
      }
    }
  };

  const resetForm = () => setFormData(initialData?.id ? initialData : { ...defaultValues, ...initialData });

  const categories = Array.isArray(products) 
    ? Array.from(new Set([
        ...products.map((p: any) => (p.category || "").trim()), 
        ...(Array.isArray(initialData?.dbCategories) ? initialData.dbCategories : []).map((c: any) => (c.name || "").trim())
      ])).filter(Boolean)
    : [];
  const brands = Array.isArray(products)
    ? Array.from(new Set([
        ...products.map((p: any) => (p.brand || "").trim()), 
        ...(Array.isArray(initialData?.dbBrands) ? initialData.dbBrands : []).map((b: any) => (b.name || "").trim())
      ])).filter(Boolean)
    : [];

  const handleSave = async () => {
    if (!formData.name) {
      toast({ variant: "destructive", title: "Missing Name", description: "Name is required" });
      return;
    }
    setLoading(true);
    try {
      const { createdAt, ...saveData } = formData;
      // Trim all string fields
      Object.keys(saveData).forEach(key => {
        if (typeof saveData[key] === 'string') {
          saveData[key] = saveData[key].trim();
        }
      });

      const resource = tabName === 'categories' ? 'categories' : tabName === 'brands' ? 'brands' : tabName === 'pricelists' ? 'pricelists' : 'products';

      // Duplication Check
      if (resource === 'products') {
        const isDup = products.some((p: any) => 
          p.id !== formData.id && 
          (p.name || "").trim().toLowerCase() === (saveData.name || "").toLowerCase() &&
          (p.category || "").trim().toLowerCase() === (saveData.category || "").toLowerCase() &&
          (p.subCategory || "").trim().toLowerCase() === (saveData.subCategory || "").toLowerCase()
        );
        if (isDup) {
          toast({ variant: "destructive", title: "Duplicate Product", description: "A product with this Name, Category, and Sub-Category already exists." });
          setLoading(false);
          return;
        }
      } else if (resource === 'categories') {
        const isDup = (initialData?.dbCategories || []).some((c: any) => 
          c.id !== formData.id && 
          (c.name || "").trim().toLowerCase() === (saveData.name || "").toLowerCase()
        );
        if (isDup) {
          toast({ variant: "destructive", title: "Duplicate Category", description: "This category name already exists." });
          setLoading(false);
          return;
        }
      } else if (resource === 'brands') {
        const isDup = (initialData?.dbBrands || []).some((b: any) => 
          b.id !== formData.id && 
          (b.name || "").trim().toLowerCase() === (saveData.name || "").toLowerCase()
        );
        if (isDup) {
          toast({ variant: "destructive", title: "Duplicate Brand", description: "This brand name already exists." });
          setLoading(false);
          return;
        }
      }

      const res = await fetch(`/api/core?resource=${resource}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saveData)
      });
      if (!res.ok) throw new Error(`Failed to save ${resource}`);
      toast({ title: "Success", description: `${title} saved successfully` });
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      await queryClient.invalidateQueries({ queryKey: ["brands"] });
      await queryClient.invalidateQueries({ queryKey: ["pricelists"] });
      setOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const getFields = () => {
    switch (tabName) {
      case "products":
        return [
          { label: "SKU", key: "sku", span: false }, 
          { label: "Product Name", key: "name", span: true },
          { label: "Category", key: "category", span: false, isCategory: true }, 
          { label: "Sub Category", key: "subCategory", span: false },
          { label: "Brand", key: "brand", span: false, isBrand: true },
          { label: "Stock", key: "stock", span: false, type: "number" },
          { label: "Sell Price (₹)", key: "sellPrice", span: false, type: "number" }, 
          { label: "Purchase Price (₹)", key: "purchasePrice", span: false, type: "number" },
          { label: "HSN Code", key: "hsnCode", span: false },
          { label: "GST Rate (%)", key: "gstRate", span: false, type: "number" },
          { label: "Min Stock", key: "minStock", span: false, type: "number" }, 
          { label: "Unit", key: "unit", span: false },
          { label: "Rack/Location", key: "rack", span: false }, 
          { label: "Part No.", key: "partNo", span: false },
          { label: "Barcode", key: "barcode", span: false },
          { label: "Type", key: "type", span: false, isToggle: true, options: ["PRODUCT", "SERVICE"] }, 
          { label: "Status", key: "status", span: false, isToggle: true, options: ["Active", "Inactive"] }, 
          { label: "Description", key: "description", span: true, type: "textarea" },
        ];
      case "categories":
        return [
          { label: "Category Name", key: "name", span: true },
          { label: "Description", key: "description", span: true, type: "textarea" },
        ];
      case "brands":
        return [
          { label: "Brand Name", key: "name", span: true },
          { label: "Description", key: "description", span: true, type: "textarea" },
        ];
      case "pricelists":
        return [
          { label: "List Name", key: "name", span: true },
          { label: "Effective From", key: "effectiveFrom", span: false, type: "date" },
          { label: "Status", key: "status", span: false, isToggle: true, options: ["Active", "Inactive"] },
          { label: "Description", key: "description", span: true, type: "textarea" },
        ];
      default: return [];
    }
  };

  const fields = getFields();

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if(!v) resetForm(); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[45rem] overflow-y-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
          {fields.map((f, i) => (
            <div key={f.label} className={f.span ? "col-span-2" : ""}>
              <Label className="text-xs font-medium text-muted-foreground">{f.label}</Label>
              {f.isCategory ? (
                <FormCombobox 
                  triggerRef={(el: any) => fieldRefs.current[f.key as string] = el}
                  onKeyDown={(e) => handleEnter(e, fields[i + 1]?.key as string, i === fields.length - 1)}
                  openOnFocus
                  label={f.label} 
                  value={formData.category} 
                  options={categories} 
                  onSelect={(v) => {
                    setFormData({ ...formData, category: v });
                    setTimeout(() => fieldRefs.current[fields[i+1]?.key as string]?.focus(), 100);
                  }} 
                />
              ) : f.isBrand ? (
                <FormCombobox 
                  triggerRef={(el: any) => fieldRefs.current[f.key as string] = el}
                  onKeyDown={(e) => handleEnter(e, fields[i + 1]?.key as string, i === fields.length - 1)}
                  openOnFocus
                  label={f.label} 
                  value={formData.brand} 
                  options={brands} 
                  onSelect={(v) => {
                    setFormData({ ...formData, brand: v });
                    setTimeout(() => fieldRefs.current[fields[i+1]?.key as string]?.focus(), 100);
                  }} 
                />
              ) : f.isToggle ? (
                <ToggleGroup 
                  ref={(el: any) => fieldRefs.current[f.key as string] = el}
                  type="single" 
                  className="justify-start mt-1 gap-0 border rounded-lg w-fit overflow-hidden h-9" 
                  value={formData[f.key as string]} 
                  onValueChange={(v) => v && setFormData({ ...formData, [f.key as string]: v })}
                  onKeyDown={(e) => handleEnter(e, fields[i + 1]?.key as string, i === fields.length - 1)}
                >
                  {f.options?.map((opt: string) => (
                    <ToggleGroupItem 
                      key={opt} 
                      value={opt} 
                      className="px-4 text-[0.625rem] font-bold uppercase tracking-tight rounded-none border-r last:border-0 data-[state=on]:bg-primary data-[state=on]:text-white h-full"
                    >
                      {opt}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              ) : f.type === "textarea" ? (
                <Textarea 
                  ref={(el: any) => fieldRefs.current[f.key as string] = el}
                  className="mt-1 h-20" 
                  placeholder={f.label} 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  onKeyDown={(e) => handleEnter(e, fields[i + 1]?.key as string, i === fields.length - 1)}
                />
              ) : (
                <Input 
                  ref={(el: any) => fieldRefs.current[f.key as string] = el}
                  className="mt-1 h-9" 
                  placeholder={f.label} 
                  type={f.type || "text"} 
                  value={formData[f.key as string]} 
                  onChange={e => setFormData({...formData, [f.key as string]: e.target.value})} 
                  onKeyDown={(e) => handleEnter(e, fields[i + 1]?.key as string, i === fields.length - 1)}
                />
              )}
            </div>
          ))}
          <div className="col-span-2 flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button ref={saveBtnRef} size="sm" onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {formData.id ? `Update ${title.split(' ').pop()}` : `Save ${title.split(' ').pop()}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "products";
  const setActiveTab = (v: string) => setSearchParams({ tab: v });
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("Products", "edit");
  const canCreate = hasPermission("Products", "create");
  const { data: products = [], isLoading: productsLoading, isError: productsError } = useQuery({ 
    queryKey: ["products"], 
    queryFn: () => fetch("/api/core?resource=products").then(res => {
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    }) 
  });

  const { data: dbCategories = [] } = useQuery({ 
    queryKey: ["categories"], 
    queryFn: () => fetch("/api/core?resource=categories").then(res => res.ok ? res.json() : []) 
  });

  const { data: dbBrands = [] } = useQuery({ 
    queryKey: ["brands"], 
    queryFn: () => fetch("/api/core?resource=brands").then(res => res.ok ? res.json() : []) 
  });

  const { data: pricelists = [], isLoading: pricelistsLoading } = useQuery({ 
    queryKey: ["pricelists"], 
    queryFn: () => fetch("/api/core?resource=pricelists").then(res => res.ok ? res.json() : []) 
  });

  const getNewButtonLabel = (tab: string) => {
    switch (tab) {
      case "products": return "Add New Product";
      case "categories": return "Add New Category";
      case "brands": return "Add New Brand";
      case "pricelists": return "Add New Price List";
      default: return "Add New";
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold">My Items</h1>
        <p className="text-sm text-muted-foreground">Product master, categories, and brands</p>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="products">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <TabsList className="h-12 flex-wrap bg-transparent gap-2 px-1">
            {[
              { id: "products", label: "Products" },
              { id: "categories", label: "Categories" },
              { id: "brands", label: "Brands" },
              { id: "pricelists", label: "Price Lists" }
            ].map(t => (
              <TabsTrigger key={t.id} value={t.id} className="text-xs px-5 h-10 font-black uppercase tracking-tight data-[state=active]:bg-primary/10 data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary transition-all">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {canCreate && (
            <CreateProductModal
              tabName={activeTab}
              products={products}
              initialData={{ dbCategories, dbBrands }}
              title={getNewButtonLabel(activeTab)}
              trigger={
                <Button size="sm" className="h-9 gap-1 shadow-lg shadow-primary/20">
                  <Plus className="h-3.5 w-3.5" />
                  {getNewButtonLabel(activeTab)}
                </Button>
              }
            />
          )}
        </div>

        <TabsContent value="products" className="mt-4"><ProductList products={products} isLoading={productsLoading} isError={productsError} canEdit={canEdit} /></TabsContent>
        <TabsContent value="categories" className="mt-4"><CategoryList products={products} dbCategories={dbCategories} /></TabsContent>
        <TabsContent value="brands" className="mt-4"><BrandList products={products} dbBrands={dbBrands} /></TabsContent>
        <TabsContent value="pricelists" className="mt-4">
          <PriceListView pricelists={pricelists} isLoading={pricelistsLoading} products={products} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
