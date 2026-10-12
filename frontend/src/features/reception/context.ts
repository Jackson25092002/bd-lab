import { createContext, useContext } from "react";
import type { ExtractedData, ReceptionRecord } from "./types";
export type ReceptionContextValue = {
  records: ReceptionRecord[];
  revision: number;
  mode: "api" | "mock";
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
  receivePdf: (file: File) => Promise<ReceptionRecord>;
  createDemo: () => Promise<ReceptionRecord>;
  save: (id: string, data: ExtractedData) => Promise<void>;
  reset: () => void;
};
export const ReceptionContext = createContext<ReceptionContextValue | null>(
  null,
);
export function useReception() {
  const context = useContext(ReceptionContext);
  if (!context) throw new Error("ReceptionProvider chưa được khởi tạo.");
  return context;
}
