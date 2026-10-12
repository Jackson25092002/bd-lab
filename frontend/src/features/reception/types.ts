export type RecordStatus = "pending" | "reviewing" | "draft";
export type Sample = {
  id: string;
  name: string;
  matrix: string;
  location: string;
  quantity: string;
  tests: string;
  uncertain?: boolean;
};
export type ExtractedData = {
  customer: string;
  address: string;
  contact: string;
  collectedAt: string;
  collector: string;
  note: string;
  samples: Sample[];
};
export type ReceptionRecord = {
  id: string;
  reference?: string;
  version?: number;
  sha256?: string;
  fileName: string;
  fileSize: number;
  pdfUrl: string;
  demo: boolean;
  receivedAt: string;
  status: RecordStatus;
  raw: ExtractedData;
  edited: ExtractedData;
  savedAt?: string;
};
