import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createDemoRecord, initialRecords } from "./mock-data";
import { blankData, saveDraft } from "./model";
import type { ExtractedData, ReceptionRecord } from "./types";
import { ReceptionContext } from "./context";
import { receptionApi } from "./api";
import { env } from "../../shared/config/env";

export function ReceptionProvider({ children }: { children: ReactNode }) {
  const mode = env.dataSource;
  const [records, setRecords] = useState<ReceptionRecord[]>(() =>
    mode === "mock" ? initialRecords() : [],
  );
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(mode === "api");
  const [error, setError] = useState("");
  const objectUrls = useRef<string[]>([]);
  const pendingLoad = useRef<AbortController | null>(null);
  useEffect(() => {
    if (mode !== "api") return;
    const controller = new AbortController();
    pendingLoad.current = controller;
    void receptionApi
      .list(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setRecords(result);
        setError("");
        setLoading(false);
      })
      .catch((issue) => {
        if (!controller.signal.aborted) {
          setError(
            issue instanceof Error ? issue.message : "Không tải được hồ sơ.",
          );
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [mode]);
  useEffect(
    () => () => objectUrls.current.forEach((url) => URL.revokeObjectURL(url)),
    [],
  );
  function add(record: ReceptionRecord) {
    setRecords((current) => [record, ...current]);
  }
  async function reload() {
    if (mode !== "api") return;
    pendingLoad.current?.abort();
    setLoading(true);
    const controller = new AbortController();
    pendingLoad.current = controller;
    try {
      const result = await receptionApi.list(controller.signal);
      setRecords(result);
      setError("");
      setRevision((value) => value + 1);
    } catch (issue) {
      if (!controller.signal.aborted)
        setError(
          issue instanceof Error ? issue.message : "Không tải được hồ sơ.",
        );
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }
  async function receivePdf(file: File) {
    let record: ReceptionRecord;
    if (mode === "api") record = await receptionApi.createPdf(file);
    else {
      const pdfUrl = URL.createObjectURL(file);
      objectUrls.current.push(pdfUrl);
      const data = blankData();
      record = {
        id: "DEMO-" + crypto.randomUUID().slice(0, 8).toUpperCase(),
        version: 0,
        pdfUrl,
        fileName: file.name,
        fileSize: file.size,
        demo: false,
        receivedAt: new Date().toISOString(),
        status: "pending",
        raw: structuredClone(data),
        edited: structuredClone(data),
      };
    }
    add(record);
    return record;
  }
  async function createDemo() {
    const record =
      mode === "api"
        ? await receptionApi.createDemo()
        : {
            ...createDemoRecord(
              "DEMO-" + crypto.randomUUID().slice(0, 8).toUpperCase(),
            ),
            version: 0,
            receivedAt: new Date().toISOString(),
          };
    add(record);
    return record;
  }
  async function save(id: string, data: ExtractedData) {
    const current = records.find((record) => record.id === id);
    if (!current) throw new Error("Hồ sơ không còn trong danh sách.");
    const saved =
      mode === "api"
        ? await receptionApi.save(id, current.version ?? 0, data)
        : { ...saveDraft(current, data), version: (current.version ?? 0) + 1 };
    setRecords((items) =>
      items.map((record) => (record.id === id ? saved : record)),
    );
  }
  function reset() {
    if (mode !== "mock") return;
    objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrls.current = [];
    setRecords(initialRecords());
    setRevision((value) => value + 1);
  }
  return (
    <ReceptionContext.Provider
      value={{
        records,
        revision,
        mode,
        loading,
        error,
        reload,
        receivePdf,
        createDemo,
        save,
        reset,
      }}
    >
      {children}
    </ReceptionContext.Provider>
  );
}
