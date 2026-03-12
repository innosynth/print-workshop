import { useState } from "react";
import { chartOfAccounts, contacts } from "@/lib/mockData";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronRight, ChevronDown } from "lucide-react";

type AccountType = "Asset" | "Liability" | "Equity" | "Income" | "Expense";
const typeColor: Record<AccountType, string> = {
  Asset: "bg-blue-100 text-blue-700 border-blue-200",
  Liability: "bg-red-100 text-red-700 border-red-200",
  Equity: "bg-purple-100 text-purple-700 border-purple-200",
  Income: "bg-green-100 text-green-700 border-green-200",
  Expense: "bg-orange-100 text-orange-700 border-orange-200",
};

function ChartOfAccounts() {
  const [search, setSearch] = useState("");
  const [openGroups, setOpenGroups] = useState<string[]>(["Current Assets", "Revenue"]);
  const groups = [...new Set(chartOfAccounts.map(a => a.group))];
  const toggleGroup = (g: string) =>
    setOpenGroups(p => p.includes(g) ? p.filter(x => x !== g) : [...p, g]);
  const filtered = chartOfAccounts.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.code.includes(search)
  );
  const groupedAccounts = search
    ? { "Search Results": filtered }
    : groups.reduce((acc, g) => {
        acc[g] = chartOfAccounts.filter(a => a.group === g);
        return acc;
      }, {} as Record<string, typeof chartOfAccounts>);

  return (
    <div className="space-y-3">
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input placeholder="Search accounts..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <Card>
        <CardContent className="p-0">
          {Object.entries(groupedAccounts).map(([group, accounts]) => (
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

const ledgerTx = [
  { date: "2024-03-01", desc: "INV-2024-001 - Raj Prints Pvt Ltd", debit: 20165, credit: 0, balance: 20165 },
  { date: "2024-03-05", desc: "INV-2024-002 - Print House Co.", debit: 35316, credit: 0, balance: 55481 },
  { date: "2024-03-08", desc: "Receipt - Raj Prints Pvt Ltd", debit: 0, credit: 20165, balance: 35316 },
  { date: "2024-03-10", desc: "INV-2024-004 - Global Flex Media", debit: 15478, credit: 0, balance: 50794 },
  { date: "2024-03-15", desc: "INV-2024-006 - Raj Prints Pvt Ltd", debit: 26814, credit: 0, balance: 77608 },
  { date: "2024-03-18", desc: "Receipt - Print House Co. (Partial)", debit: 0, credit: 20000, balance: 57608 },
  { date: "2024-03-20", desc: "INV-2024-008 - Meena Sharma", debit: 3488, credit: 0, balance: 61096 },
  { date: "2024-04-05", desc: "INV-2024-012 - Raj Prints Pvt Ltd", debit: 42401, credit: 0, balance: 103497 },
  { date: "2024-04-12", desc: "Receipt - Raj Prints Pvt Ltd", debit: 0, credit: 42401, balance: 61096 },
];

const receivables = contacts.filter(c => c.balance > 0).map(c => ({
  name: c.name, city: c.city, total: c.balance,
  current: Math.round(c.balance * 0.4), days30: Math.round(c.balance * 0.35),
  days60: Math.round(c.balance * 0.15), days90: Math.round(c.balance * 0.1),
}));

const payables = contacts.filter(c => c.balance < 0).map(c => ({
  name: c.name, city: c.city, total: Math.abs(c.balance),
  current: Math.round(Math.abs(c.balance) * 0.5), days30: Math.round(Math.abs(c.balance) * 0.3),
  days60: Math.round(Math.abs(c.balance) * 0.2), days90: 0,
}));

export default function Accounting() {
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Accounting</h1>
        <p className="text-sm text-muted-foreground">Ledger, chart of accounts, and outstanding tracking</p>
      </div>
      <Tabs defaultValue="coa">
        <TabsList className="h-9">
          {["coa","ledger","contra","debit","credit","receivable","payable"].map(t => (
            <TabsTrigger key={t} value={t} className="text-xs px-3">
              {t === "coa" ? "Chart of Accounts" : t === "receivable" ? "Receivables" : t === "payable" ? "Payables" : t === "debit" ? "Debit Notes" : t === "credit" ? "Credit Notes" : t.charAt(0).toUpperCase() + t.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="coa" className="mt-4"><ChartOfAccounts /></TabsContent>

        <TabsContent value="ledger" className="mt-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-48">
                <label className="text-xs font-medium text-muted-foreground">Account</label>
                <select className="mt-1 w-full h-9 text-sm border border-input rounded-md px-3 bg-background">
                  {chartOfAccounts.map(a => <option key={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">From</label>
                <Input type="date" className="mt-1 h-9 w-36" defaultValue="2024-03-01" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">To</label>
                <Input type="date" className="mt-1 h-9 w-36" defaultValue="2024-04-30" />
              </div>
              <Button size="sm" className="mt-5">View Ledger</Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      {["Date","Description","Debit","Credit","Balance"].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerTx.map((t, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-2.5 text-muted-foreground">{t.date}</td>
                        <td className="px-4 py-2.5 font-medium">{t.desc}</td>
                        <td className="px-4 py-2.5 tabular-nums text-primary">{t.debit > 0 ? "₹" + t.debit.toLocaleString("en-IN") : "—"}</td>
                        <td className="px-4 py-2.5 tabular-nums text-destructive">{t.credit > 0 ? "₹" + t.credit.toLocaleString("en-IN") : "—"}</td>
                        <td className="px-4 py-2.5 tabular-nums font-semibold">₹{t.balance.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="receivable" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Customer-wise Receivable Aging</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {["Customer","City","Current","0-30 days","31-60 days","61-90 days","Total"].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {receivables.map((r, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-semibold">{r.name}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{r.city}</td>
                      <td className="px-4 py-2.5 tabular-nums">₹{r.current.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-2.5 tabular-nums text-yellow-600">₹{r.days30.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-2.5 tabular-nums text-orange-500">₹{r.days60.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-2.5 tabular-nums text-destructive">₹{r.days90.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-2.5 tabular-nums font-bold text-primary">₹{r.total.toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payable" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Supplier-wise Payable Aging</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {["Supplier","City","Current","0-30 days","31-60 days","61-90 days","Total"].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payables.map((r, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-semibold">{r.name}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{r.city}</td>
                      <td className="px-4 py-2.5 tabular-nums">₹{r.current.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-2.5 tabular-nums text-yellow-600">₹{r.days30.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-2.5 tabular-nums text-orange-500">₹{r.days60.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-2.5 tabular-nums text-destructive">₹{r.days90.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-2.5 tabular-nums font-bold text-destructive">₹{r.total.toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {["contra","debit","credit"].map(t => (
          <TabsContent key={t} value={t} className="mt-4">
            <div className="text-sm text-muted-foreground p-4">No {t === "contra" ? "contra vouchers" : t + " notes"} recorded yet.</div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
