import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, BarChart2, FileText, Package, Receipt, TrendingUp, Users, FileCheck, History, Loader2, Printer, RotateCcw, ArrowLeft } from "lucide-react";
import { StatusBadge } from "./Dashboard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import * as XLSX from 'xlsx';

const reportTypes = [
  { key: "daily-sales", icon: BarChart2, title: "Daily Sales Report", desc: "Day-wise sales summary with customer and product breakdown" },
  { key: "inventory", icon: Package, title: "Inventory Report", desc: "Current stock levels, valuation, and movement history" },
  { key: "gst", icon: FileCheck, title: "GST Report", desc: "CGST, SGST, IGST breakdowns for filing" },
  { key: "invoice-ledger", icon: FileText, title: "Invoice Ledger", desc: "Complete list of all invoices with payment status" },
  { key: "expense", icon: Receipt, title: "Expense Summary", desc: "Category-wise expense breakdown and trends" },
  { key: "outstanding", icon: TrendingUp, title: "Outstanding Report", desc: "Receivable and payable aging analysis" },
  { key: "transaction", icon: History, title: "Transaction History", desc: "Complete transaction log across all modules" },
];

const exportToExcel = (data: any[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

const exportToCSV = (data: any[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
};

function GSTReport({ onRegisterExport }: { onRegisterExport: (fn: () => void) => void }) {
  const [returnFor, setReturnFor] = useState("invoice");
  const [dateRange, setDateRange] = useState("Previous Month");
  const [taxType, setTaxType] = useState("Both");
  const [filterType, setFilterType] = useState("Both");
  const [hsnSearch, setHsnSearch] = useState("");

  const { data: gstLines = [], isLoading } = useQuery({ 
    queryKey: ["gst_report", returnFor, dateRange, taxType, filterType], 
    queryFn: () => fetch(`/api/sales?resource=gst_report&returnFor=${returnFor}`).then(res => res.json()) 
  });

  const filteredGstLines = gstLines.filter((line: any) => {
    if (returnFor === "invoice") {
      const ref = (line.invoiceNo || "").toUpperCase();
      return !ref.startsWith("EST") && !ref.startsWith("QUO");
    }
    return true;
  });

  useEffect(() => {
    onRegisterExport(() => exportToExcel(filteredGstLines, `GST_Audit_${returnFor}_${new Date().toLocaleDateString()}`));
  }, [filteredGstLines, returnFor]);

  const handleClear = () => {
    setReturnFor("invoice");
    setDateRange("Previous Month");
    setTaxType("Both");
    setFilterType("Both");
    setHsnSearch("");
  };

  const isFiltered = returnFor !== "invoice" || dateRange !== "Previous Month" || taxType !== "Both" || filterType !== "Both" || hsnSearch !== "";

  return (
    <div className="space-y-6 bg-gray-50/50 p-4 rounded-xl border border-gray-100 print:bg-white print:p-0 print:border-none">
      <Card className="bg-white border-gray-200 shadow-sm print:hidden">
        <CardContent className="p-5 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4 items-end">
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase font-black text-gray-500 tracking-wider">Tax Return For</Label>
            <Select value={returnFor} onValueChange={setReturnFor}>
              <SelectTrigger className="h-10 bg-gray-50/50 border-gray-200 font-bold"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="invoice">invoice</SelectItem>
                <SelectItem value="expense">expense</SelectItem>
                <SelectItem value="sales_return">sales_return</SelectItem>
                <SelectItem value="purchase_return">purchase_return</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase font-black text-gray-500 tracking-wider">Create Date</Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="h-10 bg-gray-50/50 border-gray-200 font-bold"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="This Month">This Month</SelectItem>
                <SelectItem value="Previous Month">Previous Month</SelectItem>
                <SelectItem value="Custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase font-black text-gray-500 tracking-wider">Tax Type</Label>
            <Select value={taxType} onValueChange={setTaxType}>
              <SelectTrigger className="h-10 bg-gray-50/50 border-gray-200 font-bold"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Both">Both</SelectItem>
                <SelectItem value="Exempt">Exempt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase font-black text-gray-500 tracking-wider">Filter Type</Label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-10 bg-gray-50/50 border-gray-200 font-bold"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 col-span-1 lg:col-span-2">
            <Label className="text-[10px] uppercase font-black text-gray-500 tracking-wider">HSN/SAC Search</Label>
            <Input className="h-10 bg-gray-50/50 border-gray-200 font-bold" placeholder="HSN..." value={hsnSearch} onChange={e => setHsnSearch(e.target.value)} />
          </div>
          
          <div className="flex gap-2 mb-0.5">
            <Button className="h-10 flex-1 font-bold uppercase tracking-widest text-[10px]">Find Records</Button>
            {isFiltered && (
              <Button variant="ghost" className="h-10 flex-1 font-bold uppercase tracking-widest text-[10px] text-destructive hover:bg-destructive/10" onClick={handleClear}>
                <RotateCcw className="h-3 w-3 mr-1" /> Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200 shadow-xl overflow-hidden">
        <CardHeader className="pb-3 border-b bg-gray-50 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-black uppercase tracking-[0.1em] text-gray-600">Invoice GST Audit Submission</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[600px]">
            {isLoading ? (
              <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <table className="w-full text-[10px] border-collapse min-w-[1400px]">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 font-bold uppercase">
                    <th className="border px-3 py-2 text-left w-64">Company Name</th>
                    <th className="border px-3 py-2 text-left">GSTIN</th>
                    <th className="border px-2 py-2 text-center w-20">Invoice No</th>
                    <th className="border px-2 py-2 text-center w-24">Invoice Date</th>
                    <th className="border px-2 py-2 text-right">Tax Before Value</th>
                    <th className="border px-2 py-2 text-center">HSN</th>
                    <th className="border px-2 py-2 text-center">GST %</th>
                    <th className="border px-2 py-2 text-center">IGST %</th>
                    <th className="border px-2 py-2 text-right">IGST</th>
                    <th className="border px-2 py-2 text-center">CGST %</th>
                    <th className="border px-2 py-2 text-right">CGST</th>
                    <th className="border px-2 py-2 text-center">SGST %</th>
                    <th className="border px-2 py-2 text-right">SGST</th>
                    <th className="border px-2 py-2 text-right">Tax Amount</th>
                    <th className="border px-2 py-2 text-right">Total Value</th>
                    <th className="border px-3 py-2 text-left w-32">Place of Supply</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-medium text-gray-700">
                  {filteredGstLines.map((line: any, idx: number) => {
                    const taxable = parseFloat(line.taxableValue || 0);
                    const cgst = taxable * 0.09;
                    const sgst = taxable * 0.09;
                    const taxAmt = cgst + sgst;
                    const totalVal = taxable + taxAmt;
                    
                    return (
                      <tr key={idx} className="hover:bg-primary/5 transition-colors odd:bg-gray-50/30">
                        <td className="border px-3 py-2 font-bold uppercase">{line.companyName}</td>
                        <td className="border px-3 py-2 font-mono text-xs">{line.gstin || "N/A"}</td>
                        <td className="border px-2 py-2 text-center font-bold text-primary">{line.invoiceNo}</td>
                        <td className="border px-2 py-2 text-center text-gray-500">{line.date}</td>
                        <td className="border px-2 py-2 text-right tabular-nums">{taxable.toFixed(2)}</td>
                        <td className="border px-2 py-2 text-center">4909</td>
                        <td className="border px-2 py-2 text-center font-bold">18</td>
                        <td className="border px-2 py-2 text-center">0</td>
                        <td className="border px-2 py-2 text-right tabular-nums text-gray-400">0</td>
                        <td className="border px-2 py-2 text-center">9</td>
                        <td className="border px-2 py-2 text-right tabular-nums">{cgst.toFixed(2)}</td>
                        <td className="border px-2 py-2 text-center">9</td>
                        <td className="border px-2 py-2 text-right tabular-nums">{sgst.toFixed(2)}</td>
                        <td className="border px-2 py-2 text-right tabular-nums font-bold">{taxAmt.toFixed(2)}</td>
                        <td className="border px-2 py-2 text-right tabular-nums font-black">{totalVal.toFixed(2)}</td>
                        <td className="border px-3 py-2 text-gray-500 italic">{line.placeOfSupply || "Tamil Nadu"}</td>
                      </tr>
                    );
                  })}
                  {filteredGstLines.length === 0 && (
                    <tr><td colSpan={16} className="p-20 text-center text-gray-400 font-bold uppercase italic">No records found for GST auditing.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DailySalesReport({ onRegisterExport }: { onRegisterExport: (fn: () => void) => void }) {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const { data: lines = [], isLoading } = useQuery({ queryKey: ["gst_report"], queryFn: () => fetch("/api/sales?resource=gst_report").then(res => res.json()) });
  
  const filteredLines = lines.filter((l: any) => {
    const isWithinDate = startDate ? l.date === startDate : true;
    const isMatchSearch = !searchTerm || 
      (l.companyName || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
      (l.lineName || "").toLowerCase().includes(searchTerm.toLowerCase());
    return isWithinDate && isMatchSearch;
  });

  useEffect(() => {
    onRegisterExport(() => exportToCSV(filteredLines, `Daily_Sales_${startDate}`));
  }, [filteredLines, startDate]);

  const handleClear = () => {
    setStartDate(new Date().toISOString().split('T')[0]);
    setSearchTerm("");
  };

  const isFiltered = startDate !== new Date().toISOString().split('T')[0] || searchTerm !== "";

  return (
    <div className="space-y-4">
      <div className="flex gap-3 bg-white p-3 border rounded-lg shadow-sm items-end print:hidden">
        <div className="space-y-1">
          <Label className="text-[10px] font-black uppercase text-gray-400">Select Date</Label>
          <Input type="date" className="h-9 w-40 font-bold" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div className="space-y-1 flex-1">
          <Label className="text-[10px] font-black uppercase text-gray-400">Search Customer / Product</Label>
          <Input placeholder="Search..." className="h-9 font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {isFiltered && <Button variant="ghost" size="sm" onClick={handleClear} className="h-9 text-destructive hover:bg-destructive/10 font-bold uppercase text-[10px] tracking-widest"><RotateCcw className="h-3 w-3 mr-1" /> Reset</Button>}
        </div>
      </div>
      <Card className="border-gray-200 shadow-xl overflow-hidden">
        <CardContent className="p-0">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr className="bg-gray-900 text-white font-black uppercase tracking-widest">
                <th className="px-4 py-3 text-left w-32">Date</th>
                <th className="px-4 py-3 text-left">Customer / Party</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-center w-16">Qty</th>
                <th className="px-4 py-3 text-right w-24">Rate</th>
                <th className="px-4 py-3 text-right w-32 bg-blue-700">Net Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y font-medium text-gray-700">
              {isLoading ? (
                <tr><td colSpan={6} className="p-20 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></td></tr>
              ) : filteredLines.map((l: any, i: number) => (
                <tr key={i} className="hover:bg-primary/5 transition-colors">
                  <td className="px-4 py-3 text-gray-500 font-bold italic">{l.date}</td>
                  <td className="px-4 py-3 font-black uppercase text-gray-800">{l.companyName}</td>
                  <td className="px-4 py-3 font-semibold text-gray-600 truncate max-w-[300px]">{l.lineName}</td>
                  <td className="px-4 py-3 text-center tabular-nums font-bold">{l.qty}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-500">₹{parseFloat(l.rate).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-black tabular-nums bg-gray-50 text-gray-900">₹{parseFloat(l.taxableValue).toLocaleString()}</td>
                </tr>
              ))}
              {filteredLines.length === 0 && !isLoading && <tr><td colSpan={6} className="p-20 text-center text-gray-400 font-bold italic uppercase">No sales recorded for the selected criteria.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function InventoryReport({ onRegisterExport }: { onRegisterExport: (fn: () => void) => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const { data: inv = { products: [] }, isLoading } = useQuery({ queryKey: ["inventory"], queryFn: () => fetch("/api/system?resource=inventory").then(res => res.json()) });
  
  const filteredProducts = (inv.products || []).filter((p: any) => {
    const isMatchSearch = !searchTerm || 
      (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
      (p.sku || "").toLowerCase().includes(searchTerm.toLowerCase());
    const isMatchCategory = categoryFilter === "ALL" || p.category === categoryFilter;
    return isMatchSearch && isMatchCategory;
  });

  useEffect(() => {
    onRegisterExport(() => exportToCSV(filteredProducts, `Inventory_Report_${new Date().toISOString().split('T')[0]}`));
  }, [filteredProducts]);

  const categories = Array.from(new Set((inv.products || []).map((p: any) => p.category)));

  const handleClear = () => {
    setSearchTerm("");
    setCategoryFilter("ALL");
  };

  const isFiltered = searchTerm !== "" || categoryFilter !== "ALL";

  const totalValuation = filteredProducts.reduce((acc: number, p: any) => acc + (parseFloat(p.stock) * parseFloat(p.purchasePrice)), 0);

  return (
    <div className="space-y-4">
      <div className="flex gap-4 bg-white p-4 border rounded-xl shadow-sm items-end mb-6 print:hidden">
        <div className="space-y-1.5 flex-1">
          <Label className="text-[10px] uppercase font-black text-gray-400">Search Product / SKU</Label>
          <Input placeholder="Search..." className="h-9 font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="space-y-1.5 w-48">
          <Label className="text-[10px] uppercase font-black text-gray-400">Category</Label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-9 font-bold text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {categories.map((c: any) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          {isFiltered && <Button variant="ghost" size="sm" onClick={handleClear} className="h-9 text-destructive hover:bg-destructive/10 font-bold uppercase text-[10px] tracking-widest border border-destructive/20"><RotateCcw className="h-3 w-3 mr-1" /> Reset</Button>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border-2 border-primary/20 p-6 rounded-2xl shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Catalog Size</p>
          <p className="text-4xl font-black text-primary leading-none">{filteredProducts.length}</p>
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Filtered Items</span>
            <span className="text-[10px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded">Active</span>
          </div>
        </div>
        <div className="bg-white border-2 border-orange-200 p-6 rounded-2xl shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Low Stock Alerts</p>
          <p className="text-4xl font-black text-orange-600 leading-none">{filteredProducts.filter((p: any) => parseFloat(p.stock) < parseFloat(p.minStock)).length}</p>
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Action items</span>
            <span className="text-[10px] font-black text-orange-600 uppercase bg-orange-50 px-2 py-0.5 rounded">{filteredProducts.filter((p: any) => parseFloat(p.stock) < parseFloat(p.minStock)).length > 0 ? 'Urgent' : 'Safe'}</span>
          </div>
        </div>
        <div className="bg-white border-2 border-blue-200 p-6 rounded-2xl shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Filtered Valuation</p>
          <p className="text-4xl font-black text-blue-700 leading-none">₹{totalValuation.toLocaleString()}</p>
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Filtered total</span>
            <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded">Asset Value</span>
          </div>
        </div>
      </div>
      <Card className="border-gray-200 shadow-2xl rounded-2xl overflow-hidden mt-8">
        <CardContent className="p-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b text-gray-500 font-black uppercase tracking-widest text-[9px]">
                <th className="px-6 py-4 text-left">SKU / Reference</th>
                <th className="px-6 py-4 text-left">Material / Product Name</th>
                <th className="px-6 py-4 text-left">Category</th>
                <th className="px-6 py-4 text-center">In-Stock Level</th>
                <th className="px-6 py-4 text-right">Avg Unit Cost</th>
                <th className="px-6 py-4 text-right bg-blue-50 text-blue-700">Total Valuation</th>
              </tr>
            </thead>
            <tbody className="divide-y font-medium text-gray-700">
              {isLoading ? (
                <tr><td colSpan={6} className="p-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></td></tr>
              ) : filteredProducts.map((p: any) => (
                <tr key={p.id} className="hover:bg-primary/5 transition-all">
                  <td className="px-6 py-4 font-mono text-gray-400 italic">{p.sku || 'N/A'}</td>
                  <td className="px-6 py-4 font-black uppercase">{p.name}</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-gray-100 rounded text-[9px] font-black uppercase text-gray-500">{p.category}</span></td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-black tabular-nums ${parseFloat(p.stock) < parseFloat(p.minStock) ? 'text-red-500 animate-pulse' : 'text-emerald-700'}`}>
                      {parseFloat(p.stock).toLocaleString()} {p.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-gray-400">₹{parseFloat(p.purchasePrice).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-black tabular-nums bg-blue-50/20 text-blue-900">
                    ₹{(parseFloat(p.stock) * parseFloat(p.purchasePrice)).toLocaleString()}
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && !isLoading && <tr><td colSpan={6} className="p-20 text-center text-gray-400 font-bold italic uppercase">No products match your filters.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function ExpenseReport({ onRegisterExport }: { onRegisterExport: (fn: () => void) => void }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const { data: expenses = [], isLoading } = useQuery({ queryKey: ["expenses"], queryFn: () => fetch("/api/system?resource=expenses").then(res => res.json()) });
  
  const filteredExpenses = expenses.filter((e: any) => {
    const date = new Date(e.date);
    const isWithinDate = (!startDate || date >= new Date(startDate)) && (!endDate || date <= new Date(endDate));
    const isMatchCategory = categoryFilter === "ALL" || e.category === categoryFilter;
    return isWithinDate && isMatchCategory;
  });

  useEffect(() => {
    onRegisterExport(() => exportToCSV(filteredExpenses, `Expense_Report_${startDate || 'all'}_to_${endDate || 'all'}`));
  }, [filteredExpenses]);

  const categories = Array.from(new Set(expenses.map((e: any) => e.category)));

  const handleClear = () => {
    setStartDate("");
    setEndDate("");
    setCategoryFilter("ALL");
  };

  const isFiltered = startDate !== "" || endDate !== "" || categoryFilter !== "ALL";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 border rounded-xl shadow-sm items-end mb-4 print:hidden">
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase font-black text-gray-400">Start Date</Label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 font-bold text-xs" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase font-black text-gray-400">End Date</Label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-9 font-bold text-xs" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase font-black text-gray-400">Category</Label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-9 font-bold text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {categories.map((c: any) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          {isFiltered && <Button variant="ghost" size="sm" onClick={handleClear} className="h-9 text-destructive hover:bg-destructive/10 font-bold uppercase text-[10px] tracking-widest border border-destructive/20 w-full"><RotateCcw className="h-3 w-3 mr-1" /> Reset</Button>}
        </div>
      </div>

      <div className="flex justify-between items-center bg-gray-900 p-6 rounded-2xl shadow-xl text-white mb-6">
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/80 mb-1">Aggregated Operations Cost</h3>
          <p className="text-4xl font-black tracking-tighter tabular-nums">₹{filteredExpenses.reduce((acc: number, e: any) => acc + parseFloat(e.amount), 0).toLocaleString()}</p>
        </div>
        <div className="text-right">
           <p className="text-[10px] font-black uppercase opacity-60">Filtered Records</p>
           <p className="text-xl font-bold">{filteredExpenses.length}</p>
        </div>
      </div>
      <Card className="border-gray-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b text-gray-400 font-black uppercase tracking-widest text-[9px]">
                <th className="px-6 py-4 text-left">Ref Date</th>
                <th className="px-6 py-4 text-left">Category Group</th>
                <th className="px-6 py-4 text-left">Expense Description</th>
                <th className="px-6 py-4 text-right">Debit Amount</th>
                <th className="px-6 py-4 text-center">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y text-gray-700">
              {isLoading ? (
                <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></td></tr>
              ) : filteredExpenses.map((e: any) => (
                <tr key={e.id} className="hover:bg-gray-50 transition-all">
                  <td className="px-6 py-4 text-gray-400 font-bold italic">{e.date}</td>
                  <td className="px-6 py-4"><span className="font-black uppercase text-[9px] px-2.5 py-1 rounded bg-gray-100 text-gray-600">{e.category}</span></td>
                  <td className="px-6 py-4 font-bold uppercase text-gray-800">{e.name}</td>
                  <td className="px-6 py-4 text-right font-black tabular-nums text-sm text-red-600">₹{parseFloat(e.amount).toLocaleString()}</td>
                  <td className="px-6 py-4 text-center"><StatusBadge status="Cleared" /></td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && !isLoading && <tr><td colSpan={5} className="p-20 text-center text-gray-400 font-bold uppercase italic">No expense records found matching filters.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function OutstandingReport({ onRegisterExport }: { onRegisterExport: (fn: () => void) => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: cs = [], isLoading } = useQuery({ queryKey: ["contacts"], queryFn: () => fetch("/api/core?resource=contacts").then(res => res.json()) });
  
  const customers = cs.filter((c: any) => ["B2B", "B2C"].includes(c.type));
  
  const filteredCustomers = customers.filter((c: any) => {
    return !searchTerm || 
      (c.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.mobile || "").toLowerCase().includes(searchTerm.toLowerCase());
  });

  useEffect(() => {
    onRegisterExport(() => exportToCSV(filteredCustomers, `Outstanding_Report_${new Date().toISOString().split('T')[0]}`));
  }, [filteredCustomers]);

  const handleClear = () => setSearchTerm("");
  const isFiltered = searchTerm !== "";

  const totalOutstanding = filteredCustomers.reduce((acc: number, c: any) => acc + Math.max(0, parseFloat(c.balance || 0)), 0);

  return (
    <div className="space-y-4">
      <div className="flex gap-4 bg-white p-3 border rounded-xl shadow-sm items-end mb-6 print:hidden">
        <div className="space-y-1 flex-1">
          <Label className="text-[10px] uppercase font-black text-gray-400">Search Customer Name / Mobile</Label>
          <Input placeholder="Search debtors..." className="h-9 font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        {isFiltered && <Button variant="ghost" size="sm" onClick={handleClear} className="h-9 text-destructive hover:bg-destructive/10 font-bold uppercase text-[10px] tracking-widest border border-destructive/20"><RotateCcw className="h-3 w-3 mr-1" /> Reset</Button>}
      </div>

      <div className="bg-red-700 p-8 rounded-[2rem] shadow-2xl shadow-red-200 text-white flex justify-between items-end mb-10 overflow-hidden relative">
        <div className="relative z-10">
          <p className="text-xs font-black uppercase tracking-[0.3em] opacity-70 mb-2 font-mono">Filtered Pending Receivables</p>
          <div className="flex items-center gap-4">
            <p className="text-5xl font-black tracking-tighter">₹{totalOutstanding.toLocaleString()}</p>
            <div className="px-3 py-1 bg-white/10 rounded-full border border-white/20 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">Selected collections</span>
            </div>
          </div>
        </div>
        <div className="relative z-10 text-right">
           <p className="text-[10px] font-black uppercase opacity-60 mb-1">Filtered Debtors</p>
           <p className="text-2xl font-black">{filteredCustomers.filter((c: any) => parseFloat(c.balance || 0) > 0).length}</p>
        </div>
        <div className="absolute -bottom-10 -right-10 h-64 w-64 bg-white/5 rounded-full blur-3xl" />
      </div>
      <Card className="border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <CardContent className="p-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b text-gray-400 font-black uppercase tracking-widest text-[9px]">
                <th className="px-8 py-5 text-left">Client Entity</th>
                <th className="px-8 py-5 text-left">Contact Channel</th>
                <th className="px-8 py-5 text-center">Collection Status</th>
                <th className="px-8 py-5 text-right bg-red-50/50 text-red-700 border-r">Net Outstanding</th>
                <th className="px-8 py-5 text-right font-mono opacity-40 italic">Aging Est.</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></td></tr>
              ) : filteredCustomers.map((c: any) => (
                <tr key={c.id} className="hover:bg-red-50/30 transition-all group">
                  <td className="px-8 py-4">
                    <div className="flex flex-col">
                      <span className="font-black uppercase text-gray-800 tracking-tight text-sm">{c.name}</span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{c.type} partner</span>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                     <div className="flex flex-col gap-0.5">
                       <span className="text-gray-500 font-bold flex items-center gap-1.5"><History className="h-3 w-3" /> {c.mobile || "N/A"}</span>
                       <span className="text-[10px] text-gray-400 italic font-medium">{c.email || "-"}</span>
                     </div>
                  </td>
                  <td className="px-8 py-4 text-center">
                    <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full border-2 ${parseFloat(c.balance || 0) > 0 ? "border-red-100 bg-red-50 text-red-700 shadow-sm" : "border-emerald-100 bg-emerald-50 text-emerald-700 opacity-50"}`}>
                      {parseFloat(c.balance || 0) > 0 ? "OVERDUE" : "SETTLED"}
                    </span>
                  </td>
                  <td className={`px-8 py-4 text-right font-black tabular-nums text-lg border-r ${parseFloat(c.balance || 0) > 0 ? "text-red-700" : "text-gray-300"}`}>
                    ₹{parseFloat(c.balance || 0).toLocaleString()}
                  </td>
                  <td className="px-8 py-4 text-right font-bold tabular-nums text-gray-300 italic">
                    ₹{(parseFloat(c.balance || 0) * 0.4).toFixed(0).toLocaleString()}
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && !isLoading && <tr><td colSpan={5} className="p-20 text-center text-gray-400 font-bold uppercase italic">No debtors matching search found.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function TransactionHistoryReport({ onRegisterExport }: { onRegisterExport: (fn: () => void) => void }) {
  const defaultStartDate = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
  const defaultEndDate = new Date().toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [filterType, setFilterType] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: inv = [], isLoading: invLoading } = useQuery({ 
    queryKey: ["invoices"], 
    queryFn: () => fetch("/api/sales?resource=invoices").then(res => res.json()) 
  });
  const { data: exp = [], isLoading: expLoading } = useQuery({ 
    queryKey: ["expenses"], 
    queryFn: () => fetch("/api/system?resource=expenses").then(res => res.json()) 
  });

  const isLoading = invLoading || expLoading;

  const handleClear = () => {
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
    setFilterType("ALL");
    setSearchTerm("");
  };

  const isFiltered = startDate !== defaultStartDate || endDate !== defaultEndDate || filterType !== "ALL" || searchTerm !== "";

  const allFiltered = [...inv.map((i: any) => ({ ...i, type: 'SALE', ref: i.invoiceNo })), ...exp.map((e: any) => ({ ...e, type: 'EXPENSE', ref: 'EXP-'+e.id, customerName: 'System Operating Cost' }))]
    .filter(t => {
      const date = new Date(t.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      const isWithinDate = date >= start && date <= end;
      const isMatchType = filterType === "ALL" || t.type === filterType;
      const search = searchTerm.toLowerCase();
      const isMatchSearch = !searchTerm || 
        t.ref?.toLowerCase().includes(search) || 
        (t.customerName || t.name || "").toLowerCase().includes(search);
      
      return isWithinDate && isMatchType && isMatchSearch;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  useEffect(() => {
    onRegisterExport(() => exportToCSV(allFiltered, `Transaction_History_${startDate}_to_${endDate}`));
  }, [allFiltered]);

  const totalInflow = allFiltered.filter(t => t.type === 'SALE').reduce((acc, t) => acc + parseFloat(t.total || 0), 0);
  const totalOutflow = allFiltered.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 bg-white p-4 border rounded-xl shadow-sm items-end print:hidden">
        <div className="space-y-1.5 col-span-1">
          <Label className="text-[10px] uppercase font-black text-gray-400">Date Range</Label>
          <div className="flex items-center gap-2">
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 font-bold text-xs" />
            <span className="text-gray-300 font-black">→</span>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-9 font-bold text-xs" />
          </div>
        </div>
        <div className="space-y-1.5 col-span-1">
          <Label className="text-[10px] uppercase font-black text-gray-400">Transaction Type</Label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-9 font-bold text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Transactions</SelectItem>
              <SelectItem value="SALE">Sales (Inflow)</SelectItem>
              <SelectItem value="EXPENSE">Expenses (Outflow)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label className="text-[10px] uppercase font-black text-gray-400">Search Transaction</Label>
          <Input 
            placeholder="Search by Ref # or Entity Name..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
            className="h-9 font-bold text-xs"
          />
        </div>
        <div className="col-span-1">
          {isFiltered && (
            <Button 
              variant="outline" 
              onClick={handleClear} 
              className="h-9 w-full font-bold uppercase text-[10px] tracking-widest text-destructive hover:bg-destructive/5 hover:text-destructive border-dashed"
            >
              <RotateCcw className="h-3 w-3 mr-2" /> Clear
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 border rounded-xl shadow-sm">
        <div className="flex-1 border-r border-gray-100 pr-4">
           <p className="text-[10px] font-black uppercase text-gray-400 mb-0.5">Filtered Records</p>
           <p className="text-xl font-black">{allFiltered.length}</p>
        </div>
        <div className="flex-1 border-r border-gray-100 pr-4">
           <p className="text-[10px] font-black uppercase text-gray-400 mb-0.5">Total Inflow</p>
           <p className="text-xl font-black text-emerald-600">₹{totalInflow.toLocaleString()}</p>
        </div>
        <div className="flex-1">
           <p className="text-[10px] font-black uppercase text-gray-400 mb-0.5">Total Outflow</p>
           <p className="text-xl font-black text-red-600">₹{totalOutflow.toLocaleString()}</p>
        </div>
      </div>

      <Card className="border-gray-200 shadow-md overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[600px]">
            <table className="w-full text-[11px] border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-100 text-gray-500 font-black uppercase tracking-widest text-[9px]">
                  <th className="px-6 py-4 text-left w-32">Timestamp</th>
                  <th className="px-6 py-4 text-left w-24">Type</th>
                  <th className="px-6 py-4 text-left w-40">Ref Number</th>
                  <th className="px-6 py-4 text-left">Entity Description</th>
                  <th className="px-6 py-4 text-right bg-blue-50/20">Inflow (+)</th>
                  <th className="px-6 py-4 text-right bg-red-50/20">Outflow (-)</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr><td colSpan={7} className="p-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></td></tr>
                ) : allFiltered.map((t, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5 text-gray-400 font-bold italic">{t.date}</td>
                    <td className="px-6 py-3.5">
                      <span className={`text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-tighter ${t.type === 'SALE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-mono font-bold text-primary group-hover:underline cursor-pointer">{t.ref}</td>
                    <td className="px-6 py-3.5 font-black uppercase text-gray-700 truncate max-w-[250px]">{t.customerName || t.name || 'System Operating Cost'}</td>
                    <td className="px-6 py-3.5 text-right tabular-nums font-black text-emerald-600 bg-emerald-50/5">
                      {t.type === 'SALE' ? `₹${parseFloat(t.total || 0).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-6 py-3.5 text-right tabular-nums font-black text-red-600 bg-red-50/5">
                      {t.type === 'EXPENSE' ? `₹${parseFloat(t.amount || 0).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-6 py-3.5 text-center"><StatusBadge status={t.status || 'Cleared'} /></td>
                  </tr>
                ))}
                {!isLoading && allFiltered.length === 0 && (
                  <tr><td colSpan={7} className="p-20 text-center text-gray-400 font-bold uppercase italic">No transactions found for the selected criteria.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InvoiceLedgerReport({ onRegisterExport }: { onRegisterExport: (fn: () => void) => void }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const { data: invoices = [], isLoading } = useQuery({ queryKey: ["invoices"], queryFn: () => fetch("/api/sales?resource=invoices").then(res => res.json()) });

  const filteredInvoices = invoices.filter((i: any) => {
    const date = new Date(i.date);
    const isWithinDate = (!startDate || date >= new Date(startDate)) && (!endDate || date <= new Date(endDate));
    const isMatchSearch = !searchTerm || 
      (i.customerName || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
      (i.invoiceNo || "").toLowerCase().includes(searchTerm.toLowerCase());
    return isWithinDate && isMatchSearch;
  });

  useEffect(() => {
    onRegisterExport(() => exportToCSV(filteredInvoices, `Invoice_Ledger_${startDate || 'all'}_to_${endDate || 'all'}`));
  }, [filteredInvoices]);

  const handleClear = () => {
    setStartDate("");
    setEndDate("");
    setSearchTerm("");
  };

  const isFiltered = startDate !== "" || endDate !== "" || searchTerm !== "";

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 bg-white p-3 border rounded-xl shadow-sm print:hidden">
        <div className="space-y-1">
          <Label className="text-[10px] font-black uppercase text-gray-400">Start Date</Label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 w-40 font-bold" />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-black uppercase text-gray-400">End Date</Label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-9 w-40 font-bold" />
        </div>
        <div className="space-y-1 flex-1 min-w-[200px]">
          <Label className="text-[10px] font-black uppercase text-gray-400">Search Invoice # / Customer</Label>
          <Input placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="h-9 font-bold" />
        </div>
        <div className="flex gap-2">
          {isFiltered && <Button variant="ghost" size="sm" onClick={handleClear} className="h-9 text-destructive hover:bg-destructive/10 font-bold uppercase text-[10px] tracking-widest border border-destructive/20"><RotateCcw className="h-3 w-3 mr-1" /> Reset</Button>}
        </div>
      </div>
      <Card className="border-gray-200 overflow-hidden shadow-2xl">
        <CardContent className="p-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-900 text-white font-black uppercase tracking-widest text-[9px]">
                <th className="px-6 py-4 text-left">ID Tag</th>
                <th className="px-6 py-4 text-left">Filing Date</th>
                <th className="px-6 py-4 text-left">Client Identity</th>
                <th className="px-6 py-4 text-right">Invoice total</th>
                <th className="px-6 py-4 text-center">Filing Status</th>
              </tr>
            </thead>
            <tbody className="divide-y font-medium text-gray-700">
              {filteredInvoices.map((inv: any) => (
                <tr key={inv.id} className="hover:bg-primary/5 transition-all transition-colors cursor-pointer group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400 group-hover:bg-primary group-hover:text-white transition-colors">#{inv.id}</div>
                      <span className="font-mono text-xs font-black text-primary group-hover:underline">{inv.invoiceNo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-400 font-bold italic">{inv.date}</td>
                  <td className="px-6 py-4 font-black uppercase text-gray-800">{inv.customerName}</td>
                  <td className="px-6 py-4 tabular-nums font-black text-sm text-right">₹{parseFloat(inv.total).toLocaleString()}</td>
                  <td className="px-6 py-4 text-center"><StatusBadge status={inv.status} /></td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && <tr><td colSpan={5} className="p-20 text-center text-gray-400 font-black uppercase italic">No ledger entries found matching filters.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Reports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const active = searchParams.get("active");
  const setActive = (v: string | null) => {
    if (v) setSearchParams({ active: v });
    else setSearchParams({});
  };
  const exportRef = useRef<(() => void) | null>(null);

  const handleExport = () => {
    if (exportRef.current) {
      exportRef.current();
    }
  };

  if (active) {
    const report = reportTypes.find(r => r.key === active)!;
    return (
      <div className="p-8 space-y-8 bg-white min-h-screen print:p-0">
        <div className="flex items-center justify-between border-b pb-6 print:hidden">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setActive(null)} 
              className="h-10 w-10 rounded-full border border-gray-100 shadow-sm hover:bg-black hover:text-white transition-all"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="h-8 w-[2px] bg-gray-100" />
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3 leading-none text-black">
                <report.icon className="h-8 w-8 text-primary shadow-sm" /> {report.title}
              </h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1.5 ml-11">{report.desc}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={handleExport} className="h-10 px-6 font-black uppercase text-[10px] gap-2 border-2 border-gray-100 rounded-xl hover:bg-black hover:text-white transition-all"><Download className="h-4 w-4" /> Export CSV</Button>
            <Button variant="outline" size="sm" onClick={() => window.print()} className="h-10 px-6 font-black uppercase text-[10px] gap-2 border-2 border-gray-100 rounded-xl hover:bg-black hover:text-white transition-all"><FileText className="h-4 w-4" /> Download PDF</Button>
            <Button size="sm" onClick={() => window.print()} className="h-10 px-6 font-black uppercase text-[10px] gap-2 shadow-xl shadow-primary/20 bg-primary rounded-xl hover:scale-105 transition-all"><Printer className="h-4 w-4" /> Print Report</Button>
          </div>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {active === "gst" && <GSTReport onRegisterExport={(fn) => exportRef.current = fn} />}
          {active === "invoice-ledger" && <InvoiceLedgerReport onRegisterExport={(fn) => exportRef.current = fn} />}
          {active === "daily-sales" && <DailySalesReport onRegisterExport={(fn) => exportRef.current = fn} />}
          {active === "inventory" && <InventoryReport onRegisterExport={(fn) => exportRef.current = fn} />}
          {active === "expense" && <ExpenseReport onRegisterExport={(fn) => exportRef.current = fn} />}
          {active === "outstanding" && <OutstandingReport onRegisterExport={(fn) => exportRef.current = fn} />}
          {active === "transaction" && <TransactionHistoryReport onRegisterExport={(fn) => exportRef.current = fn} />}
          
          {!["gst","invoice-ledger","daily-sales","inventory","expense","outstanding","transaction"].includes(active) && (
            <div className="p-20 text-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2rem]">
              <report.icon className="h-16 w-16 text-gray-200 mx-auto mb-6" />
              <h3 className="text-xl font-black uppercase text-gray-400">Section Under Sync</h3>
              <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-2">{report.title} is coming soon.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Reports & Analytics</h1>
        <p className="text-sm text-muted-foreground">Generate business reports with real-time data</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {reportTypes.map(r => (
          <button
            key={r.key}
            onClick={() => setActive(r.key)}
            className="text-left group"
          >
            <Card className="h-full hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer group-hover:bg-primary/5">
              <CardContent className="p-5">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <r.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="font-semibold text-sm">{r.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}
