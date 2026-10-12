import { env } from "../../shared/config/env";
import type { ExtractedData, ReceptionRecord } from "./types";

export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, options);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      throw error;
    throw new ApiError(
      "Không kết nối được backend. Kiểm tra server port 3000 và database.",
      0,
    );
  }
  const content = await response.json().catch(() => null);
  if (!response.ok)
    throw new ApiError(
      Array.isArray(content?.message)
        ? content.message.join(" · ")
        : content?.message || `Yêu cầu thất bại (${response.status}).`,
      response.status,
    );
  return content as T;
}
function mapRecord(record: ReceptionRecord): ReceptionRecord {
  return {
    ...record,
    pdfUrl: `${env.apiBaseUrl}/reception-records/${record.id}/pdf`,
  };
}
export const receptionApi = {
  async list(signal?: AbortSignal) {
    const result = await request<ReceptionRecord[]>("/reception-records", {
      signal,
    });
    return result.map(mapRecord);
  },
  async createPdf(file: File) {
    const body = new FormData();
    body.append(
      "file",
      file.type
        ? file
        : new File([file], file.name, { type: "application/pdf" }),
    );
    return mapRecord(
      await request<ReceptionRecord>("/reception-records", {
        method: "POST",
        body,
      }),
    );
  },
  async createDemo() {
    return mapRecord(
      await request<ReceptionRecord>("/reception-records/demo", {
        method: "POST",
      }),
    );
  },
  async save(id: string, version: number, edited: ExtractedData) {
    return mapRecord(
      await request<ReceptionRecord>(`/reception-records/${id}/draft`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version, edited }),
      }),
    );
  },
  history(id: string) {
    return request<
      Array<{
        id: string;
        version: number;
        action: string;
        createdAt: string;
        snapshot: ExtractedData;
      }>
    >(`/reception-records/${id}/history`);
  },
};
