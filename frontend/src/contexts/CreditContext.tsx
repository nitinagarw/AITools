import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { CreditAccount } from "@/types";
import { creditApi } from "@/services/api";

interface CreditState {
  account: CreditAccount | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

const CreditContext = createContext<CreditState>({
  account: null,
  loading: true,
  refetch: async () => {},
});

export function CreditProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<CreditAccount | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAccount = useCallback(async () => {
    try {
      setLoading(true);
      const res = await creditApi.getAccount();
      setAccount(res.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  return (
    <CreditContext.Provider value={{ account, loading, refetch: fetchAccount }}>
      {children}
    </CreditContext.Provider>
  );
}

export function useCredits() {
  return useContext(CreditContext);
}
