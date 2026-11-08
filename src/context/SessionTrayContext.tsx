import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { MemoryKind } from "../data/showcase";

export type TrayChip = {
  id: string;
  kind: MemoryKind;
  label: string;
};

type SessionTrayContextValue = {
  chips: TrayChip[];
  collect: (chip: TrayChip) => void;
  clear: () => void;
};

const SessionTrayContext = createContext<SessionTrayContextValue | null>(null);

export function SessionTrayProvider({ children }: { children: ReactNode }) {
  const [chips, setChips] = useState<TrayChip[]>([]);

  const collect = useCallback((chip: TrayChip) => {
    setChips((prev) => {
      if (prev.some((c) => c.id === chip.id)) return prev;
      const next = [...prev, chip];
      return next.slice(-8);
    });
  }, []);

  const clear = useCallback(() => setChips([]), []);

  const value = useMemo(
    () => ({ chips, collect, clear }),
    [chips, collect, clear],
  );

  return (
    <SessionTrayContext.Provider value={value}>
      {children}
    </SessionTrayContext.Provider>
  );
}

export function useSessionTray(): SessionTrayContextValue {
  const ctx = useContext(SessionTrayContext);
  if (!ctx) {
    throw new Error("useSessionTray requires SessionTrayProvider");
  }
  return ctx;
}
