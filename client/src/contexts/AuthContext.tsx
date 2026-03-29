import { createContext, useContext, ReactNode } from "react";
import { authClient } from "../lib/auth-client";

type Session = typeof authClient.$Infer.Session;

interface AuthContextValue {
  session: Session | null;
  isPending: boolean;
  error: Error | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending, error } = authClient.useSession();

  return (
    <AuthContext.Provider value={{ session: session ?? null, isPending, error: error ?? null }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
