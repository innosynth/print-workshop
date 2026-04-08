import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronRight, ChevronDown, Loader2 } from "lucide-react";

type AccountType = "Asset" | "Liability" | "Equity" | "Income" | "Expense";
const typeColor: Record<AccountType, string> = {
  Asset: "bg-blue-100 text-blue-700 border-blue-200",
  Liability: "bg-red-100 text-red-700 border-red-200",
  Equity: "bg-purple-100 text-purple-700 border-purple-200",
  Income: "bg-green-100 text-green-700 border-green-200",
  Expense: "bg-orange-100 text-orange-700 border-orange-200",
};

function ChartOfAccountsTable() {
  const [search, setSearch] = useState("");
  const [openGroups, setOpenGroups] = useState<string[]>(["Current Assets", "Revenue"]);

  const { data: accounts = [], isLoading } = useQuery({ 
    queryKey: ["coa"], 
    queryFn: () => fetch("/api/system?resource=accounting&type=coa").then(res => res.json()) 
  });

  const groups = [...new Set(accounts.map((a: any) => a.group))];
  const toggleGroup = (g: string) =>
    setOpenGroups(p => p.includes(g) ? p.filter(x => x !== g) : [...p, g]);

  const filtered = accounts.filter((a: any) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    String(a.code).includes(search)
  );

  const groupedAccounts = search
    ? { "Search Results": filtered }
    : groups.reduce((acc: any, g: any) => {
        acc[g] = accounts.filter((a: any) => a.group === g);
        return acc;
      }, {});

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-3">
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input placeholder="Search accounts..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <Card>
        <CardContent className="p-0">
          {(Object.entries(groupedAccounts) as [string, any[]][]).map(([group, accounts]) => (
            <div key={group} className="border-b last:border-0">
              <button
                className="w-full flex items-center gap-2 px-4 py-3 hover:bg-muted/30 text-left"
                onClick={() => toggleGroup(group)}
              >
                {openGroups.includes(group) || search
                  ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                }
                <span className="font-semibold text-sm">{group}</span>
                <Badge variant="outline" className="ml-auto text-xs">{accounts.length}</Badge>
              </button>
              {(openGroups.includes(group) || search) && (
                <div className="border-t">
                  {accounts.map(acc => (
                    <div key={acc.id} className="flex items-center gap-3 px-6 py-2.5 hover:bg-muted/20 border-b last:border-0">
                      <span className="font-mono text-xs text-muted-foreground w-12">{acc.code}</span>
                      <span className="flex-1 text-sm font-medium">{acc.name}</span>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${typeColor[acc.type as AccountType]}`}>{acc.type}</span>
                      <span className={`tabular-nums text-sm font-semibold w-28 text-right ${acc.balance >= 0 ? "text-foreground" : "text-destructive"}`}>
                        ₹{Math.abs(acc.balance).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function Accounting() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "coa";
  const setActiveTab = (v: string) => setSearchParams({ tab: v });

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Accounting</h1>
        <p className="text-sm text-muted-foreground">Ledger, chart of accounts, and outstanding tracking</p>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="coa">
        <TabsList className="h-12 flex-wrap bg-transparent gap-2 px-1">
          {[
            { id: "coa", label: "Chart of Accounts" },
            { id: "ledger", label: "General Ledger" },
            { id: "contra", label: "Contra" },
            { id: "debit", label: "Debit Notes" },
            { id: "credit", label: "Credit Notes" },
            { id: "receivable", label: "Receivables" },
            { id: "payable", label: "Payables" }
          ].map(t => (
            <TabsTrigger key={t.id} value={t.id} className="text-xs px-5 h-10 font-black uppercase tracking-tight data-[state=active]:bg-primary/10 data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary transition-all">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="coa" className="mt-4"><ChartOfAccountsTable /></TabsContent>
        <TabsContent value="ledger" className="mt-4"><div className="p-20 text-center text-muted-foreground border-2 border-dashed border-zinc-800 rounded-xl">General ledger transaction history</div></TabsContent>
        <TabsContent value="contra" className="mt-4"><div className="p-20 text-center text-muted-foreground border-2 border-dashed border-zinc-800 rounded-xl">Bank-to-bank and cash transfers (Contra)</div></TabsContent>
        <TabsContent value="debit" className="mt-4"><div className="p-20 text-center text-muted-foreground border-2 border-dashed border-zinc-800 rounded-xl">Purchase returns and debit note adjustments</div></TabsContent>
        <TabsContent value="credit" className="mt-4"><div className="p-20 text-center text-muted-foreground border-2 border-dashed border-zinc-800 rounded-xl">Sales returns and credit note adjustments</div></TabsContent>
        <TabsContent value="receivable" className="mt-4"><div className="p-20 text-center text-muted-foreground border-2 border-dashed border-zinc-800 rounded-xl">Customer outstanding and receivables aging</div></TabsContent>
        <TabsContent value="payable" className="mt-4"><div className="p-20 text-center text-muted-foreground border-2 border-dashed border-zinc-800 rounded-xl">Supplier outstanding and payables aging</div></TabsContent>
      </Tabs>
    </div>
  );
}
