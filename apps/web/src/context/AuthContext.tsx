import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { Permission, Role } from '@metriflow/contracts';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  isPlatformSuperAdmin?: boolean;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  currency: string;
  timezone: string;
  branches?: Array<{ id: string; name: string; isDefault?: boolean }>;
}

export interface Membership {
  role: Role | string;
  permissions: Permission[];
  branchScopes?: string[];
  warehouseScopes?: string[];
}

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  membership: Membership | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  activeBranchId: string | null;
  setActiveBranchId: (id: string) => void;
  login: (token: string, user: User, organization?: Organization, membership?: Membership) => void;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (roles: Role | string | (Role | string)[]) => boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('metriflow_token'));
  const [activeBranchId, setActiveBranchIdState] = useState<string | null>(
    localStorage.getItem('metriflow_branch_id')
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('metriflow_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const sessionData: any = await api.get('/auth/me');
        if (sessionData && sessionData.user) {
          setUser(sessionData.user);
          setOrganization(sessionData.organization || null);
          setMembership(sessionData.membership || null);

          if (sessionData.organization?.branches?.length && !activeBranchId) {
            const defaultBranch = sessionData.organization.branches.find((b: any) => b.isDefault) || sessionData.organization.branches[0];
            setActiveBranchIdState(defaultBranch.id);
            localStorage.setItem('metriflow_branch_id', defaultBranch.id);
          }
        }
      } catch (err) {
        console.error('Session restoration failed:', err);
        localStorage.removeItem('metriflow_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (
    newToken: string,
    newUser: User,
    newOrg?: Organization,
    newMembership?: Membership
  ) => {
    localStorage.setItem('metriflow_token', newToken);
    setToken(newToken);
    setUser(newUser);
    if (newOrg) setOrganization(newOrg);
    if (newMembership) setMembership(newMembership);

    if (newOrg?.branches?.length) {
      const defaultBranch = newOrg.branches.find((b: any) => b.isDefault) || newOrg.branches[0];
      setActiveBranchIdState(defaultBranch.id);
      localStorage.setItem('metriflow_branch_id', defaultBranch.id);
    }
  };

  const logout = () => {
    localStorage.removeItem('metriflow_token');
    localStorage.removeItem('metriflow_branch_id');
    setToken(null);
    setUser(null);
    setOrganization(null);
    setMembership(null);
    setActiveBranchIdState(null);
  };

  const setActiveBranchId = (id: string) => {
    setActiveBranchIdState(id);
    localStorage.setItem('metriflow_branch_id', id);
  };

  const hasPermission = (perm: Permission): boolean => {
    if (user?.isPlatformSuperAdmin) return true;
    if (membership?.role === Role.OWNER_ADMIN || membership?.role === 'OWNER') return true;
    return membership?.permissions?.includes(perm) ?? false;
  };

  const hasRole = (roles: Role | string | (Role | string)[]): boolean => {
    if (user?.isPlatformSuperAdmin) return true;
    if (!membership?.role) return false;
    const allowed = Array.isArray(roles) ? roles : [roles];
    return allowed.includes(membership.role as any);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        membership,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        activeBranchId,
        setActiveBranchId,
        login,
        logout,
        hasPermission,
        hasRole,
        isSuperAdmin: !!user?.isPlatformSuperAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
