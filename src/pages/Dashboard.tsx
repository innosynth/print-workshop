import { dashboardStats, monthlySalesPurchase, products, contacts, invoices } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, Users, TrendingUp, TrendingDown, AlertTriangle, PackageX } from "lucide-react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

function StatCard({ title, value, icon: Icon, sub, trend }: {
  title: string; value: string; icon: React.ElementType;
  sub?: string; trend?: "up" | "down";
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold mt-1 text-foreground">{value}</p>
            {sub && (
              <p className={`text-xs mt-1 flex items-center gap-1 ${trend === "up" ? "text-primary" : trend === "down" ? "text-destructive" : "text-muted-foreground"}`}>
                {trend === "up" && <TrendingUp className="h-3 w-3" />}
                {trend === "down" && <TrendingDown className="h-3 w-3" />}
                {sub}
              </p>
            )}
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const fmt = (n: number) =>
  "₹" + (n >= 100000 ? (n / 100000).toFixed(1) + "L" : n >= 1000 ? (n / 1000).toFixed(1) + "K" : n);

export default function Dashboard() {
  const lowStock = products.filter(p => p.stock > 0 && p.stock < p.minStock);
  const outOfStock = products.filter(p => p.stock === 0);
  const recentInvoices = invoices.slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Sales" value={fmt(dashboardStats.todaySales)} icon={IndianRupee} sub="+8.2% vs yesterday" trend="up" />
        <StatCard title="Last Month Sales" value={fmt(dashboardStats.lastMonthSales)} icon={TrendingUp} sub="+6.5% vs prior month" trend="up" />
        <StatCard title="Last 60 Days" value={fmt(dashboardStats.last60DaysSales)} icon={IndianRupee} sub="Feb – Mar 2024" />
        <StatCard title="Active Customers" value={String(dashboardStats.activeCustomers)} icon={Users} sub="8 of 11 contacts" />
      </div>

      {/* Receivable / Payable */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Receivable Outstanding</p>
            <p className="text-2xl font-bold text-foreground mt-1">₹1,98,700</p>
            <p className="text-xs text-muted-foreground mt-1">Across {contacts.filter(c => c.balance > 0).length} customers</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-destructive">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Payable Outstanding</p>
            <p className="text-2xl font-bold text-foreground mt-1">₹59,500</p>
            <p className="text-xs text-muted-foreground mt-1">Across {contacts.filter(c => c.balance < 0).length} suppliers</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Sales vs Purchase – Last 12 Months</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={monthlySalesPurchase} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tickFormatter={(v) => "₹" + (v / 1000) + "K"} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip formatter={(value: number) => "₹" + value.toLocaleString("en-IN")} />
              <Legend />
              <Bar dataKey="sales" name="Sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Line dataKey="purchase" name="Purchase" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Bottom Grid */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Low Stock Alert */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Low Stock Alerts ({lowStock.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Product</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Stock</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Min</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map(p => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-medium">{p.name}</td>
                    <td className="px-4 py-2.5 text-right text-yellow-600 font-semibold">{p.stock} {p.unit}</td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">{p.minStock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Out of Stock */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PackageX className="h-4 w-4 text-destructive" />
              Out of Stock ({outOfStock.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Product</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Category</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Min Stock</th>
                </tr>
              </thead>
              <tbody>
                {outOfStock.map(p => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-medium">{p.name}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{p.category}</td>
                    <td className="px-4 py-2.5 text-right">
                      <Badge variant="destructive" className="text-xs">{p.minStock} {p.unit}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {["Invoice #","Date","Customer","Amount","Status"].map(h => (
                    <th key={h} className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map(inv => (
                  <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-mono text-xs font-semibold text-primary">{inv.id}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{inv.date}</td>
                    <td className="px-4 py-2.5 font-medium">{inv.customer}</td>
                    <td className="px-4 py-2.5 font-semibold">₹{inv.total.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={inv.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Paid: "bg-primary/10 text-primary border-primary/20",
    Pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    Cancelled: "bg-destructive/10 text-destructive border-destructive/20",
    Partial: "bg-blue-100 text-blue-700 border-blue-200",
    Draft: "bg-muted text-muted-foreground border-border",
    Active: "bg-primary/10 text-primary border-primary/20",
    Inactive: "bg-muted text-muted-foreground border-border",
    Approved: "bg-primary/10 text-primary border-primary/20",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${map[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}
