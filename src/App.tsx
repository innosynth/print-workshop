import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import Contacts from "./pages/Contacts";
import Sales from "./pages/Sales";
import Purchase from "./pages/Purchase";
import Accounting from "./pages/Accounting";
import Inventory from "./pages/Inventory";
import Products from "./pages/Products";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import MeterReadings from "./pages/MeterReadings";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { useAuth, AuthProvider } from "./lib/auth-context";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, module }: { children: React.ReactNode, module?: string }) => {
  const { user, isLoading, hasPermission } = useAuth();
  
  if (isLoading) return <div className="h-screen flex items-center justify-center bg-zinc-950"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/login" />;
  
  if (module && !hasPermission(module, 'view')) {
    return <Navigate to="/" />;
  }
  
  return <Layout>{children}</Layout>;
};

const NAV_ITEMS = [
  { title: "Dashboard", url: "/", module: "Dashboard" },
  { title: "Contacts", url: "/contacts", module: "Contacts" },
  { title: "Sales", url: "/sales", module: "Sales" },
  { title: "Purchase", url: "/purchase", module: "Purchase" },
  { title: "Accounting", url: "/accounting", module: "Accounting" },
  { title: "Inventory", url: "/inventory", module: "Inventory" },
  { title: "Products", url: "/products", module: "Products" },
  { title: "Meter Readings", url: "/meter-readings", module: "Meter Readings" },
  { title: "Reports", url: "/reports", module: "Reports" },
  { title: "Settings", url: "/settings", module: "Settings" },
];

const HomeRedirect = () => {
  const { hasPermission } = useAuth();
  const firstAvailable = NAV_ITEMS.find(item => {
    if (item.module === "Meter Readings") return true; // Always visible as per sidebar logic
    return hasPermission(item.module, 'view');
  });

  if (firstAvailable && firstAvailable.url !== "/") {
    return <Navigate to={firstAvailable.url} replace />;
  }

  return <Dashboard />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><HomeRedirect /></ProtectedRoute>} />
            <Route path="/contacts" element={<ProtectedRoute module="Contacts"><Contacts /></ProtectedRoute>} />
            <Route path="/sales" element={<ProtectedRoute module="Sales"><Sales /></ProtectedRoute>} />
            <Route path="/purchase" element={<ProtectedRoute module="Purchase"><Purchase /></ProtectedRoute>} />
            <Route path="/accounting" element={<ProtectedRoute module="Accounting"><Accounting /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute module="Inventory"><Inventory /></ProtectedRoute>} />
            <Route path="/products" element={<ProtectedRoute module="Products"><Products /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute module="Reports"><Reports /></ProtectedRoute>} />
            <Route path="/meter-readings" element={<ProtectedRoute><MeterReadings /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute module="Settings"><Settings /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
