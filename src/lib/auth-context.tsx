import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  roleId: number | null;
}

interface Role {
  id: number;
  name: string;
  permissions: string; // JSON string
}

interface AuthContextType {
  user: User | null;
  role: Role | null;
  login: (userData: User, roleData: Role | null) => void;
  logout: () => void;
  isLoading: boolean;
  hasPermission: (module: string, action: 'view' | 'create' | 'edit' | 'delete') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedRole = localStorage.getItem("role");
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedRole) setRole(JSON.parse(savedRole));
    setIsLoading(false);
  }, []);

  const login = (userData: User, roleData: Role | null) => {
    setUser(userData);
    setRole(roleData);
    localStorage.setItem("user", JSON.stringify(userData));
    if (roleData) localStorage.setItem("role", JSON.stringify(roleData));
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    localStorage.removeItem("user");
    localStorage.removeItem("role");
  };

  const hasPermission = (module: string, action: 'view' | 'create' | 'edit' | 'delete'): boolean => {
    if (!user) return false;
    if (!role) return true; // Default to full access if no role assigned (e.g. super admin) or decide otherwise
    
    try {
      const permissions = JSON.parse(role.permissions);
      const modulePerm = permissions.find((p: any) => p.module.toLowerCase() === module.toLowerCase());
      if (!modulePerm) return false;
      return modulePerm[action] || false;
    } catch (e) {
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, login, logout, isLoading, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
