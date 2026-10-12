-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ReceptionStatus" AS ENUM ('pending', 'reviewing', 'draft');

-- CreateEnum
CREATE TYPE "ExtractionSource" AS ENUM ('manual', 'demo');

-- CreateTable
CREATE TABLE "ReceptionRecord" (
    "id" UUID NOT NULL,
    "serial" SERIAL NOT NULL,
    "status" "ReceptionStatus" NOT NULL DEFAULT 'pending',
    "version" INTEGER NOT NULL DEFAULT 0,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "customer" VARCHAR(300) NOT NULL DEFAULT '',
    "address" VARCHAR(1000) NOT NULL DEFAULT '',
    "contact" VARCHAR(300) NOT NULL DEFAULT '',
    "collectedAt" VARCHAR(10) NOT NULL DEFAULT '',
    "collector" VARCHAR(300) NOT NULL DEFAULT '',
    "note" VARCHAR(5000) NOT NULL DEFAULT '',
    "receivedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "savedAt" TIMESTAMPTZ(3),

    CONSTRAINT "ReceptionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PdfAttachment" (
    "id" UUID NOT NULL,
    "recordId" UUID NOT NULL,
    "originalName" VARCHAR(250) NOT NULL,
    "storageKey" VARCHAR(100) NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "sha256" CHAR(64) NOT NULL,
    "mediaType" VARCHAR(50) NOT NULL DEFAULT 'application/pdf',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PdfAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtractionSnapshot" (
    "id" UUID NOT NULL,
    "recordId" UUID NOT NULL,
    "source" "ExtractionSource" NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExtractionSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sample" (
    "id" UUID NOT NULL,
    "recordId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "name" VARCHAR(300) NOT NULL DEFAULT '',
    "matrix" VARCHAR(100) NOT NULL DEFAULT '',
    "location" VARCHAR(1000) NOT NULL DEFAULT '',
    "quantity" VARCHAR(200) NOT NULL DEFAULT '',
    "tests" VARCHAR(2000) NOT NULL DEFAULT '',
    "uncertain" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Sample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DraftRevision" (
    "id" UUID NOT NULL,
    "recordId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "action" VARCHAR(30) NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DraftRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReceptionRecord_serial_key" ON "ReceptionRecord"("serial");

-- CreateIndex
CREATE INDEX "ReceptionRecord_receivedAt_idx" ON "ReceptionRecord"("receivedAt");

-- CreateIndex
CREATE INDEX "ReceptionRecord_status_receivedAt_idx" ON "ReceptionRecord"("status", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PdfAttachment_recordId_key" ON "PdfAttachment"("recordId");

-- CreateIndex
CREATE UNIQUE INDEX "PdfAttachment_storageKey_key" ON "PdfAttachment"("storageKey");

-- CreateIndex
CREATE UNIQUE INDEX "ExtractionSnapshot_recordId_key" ON "ExtractionSnapshot"("recordId");

-- CreateIndex
CREATE INDEX "Sample_recordId_position_idx" ON "Sample"("recordId", "position");

-- CreateIndex
CREATE INDEX "Sample_matrix_idx" ON "Sample"("matrix");

-- CreateIndex
CREATE UNIQUE INDEX "DraftRevision_recordId_version_key" ON "DraftRevision"("recordId", "version");

-- AddForeignKey
ALTER TABLE "PdfAttachment" ADD CONSTRAINT "PdfAttachment_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "ReceptionRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractionSnapshot" ADD CONSTRAINT "ExtractionSnapshot_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "ReceptionRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sample" ADD CONSTRAINT "Sample_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "ReceptionRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftRevision" ADD CONSTRAINT "DraftRevision_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "ReceptionRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Immutable source artifacts and revision snapshots. The application can only append.
CREATE FUNCTION bd_lab_immutable_artifact() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Original artifact or revision is immutable';
END;
$$;
CREATE TRIGGER extraction_immutable BEFORE UPDATE OR DELETE ON "ExtractionSnapshot"
FOR EACH ROW EXECUTE FUNCTION bd_lab_immutable_artifact();
CREATE TRIGGER pdf_attachment_immutable BEFORE UPDATE OR DELETE ON "PdfAttachment"
FOR EACH ROW EXECUTE FUNCTION bd_lab_immutable_artifact();
CREATE TRIGGER revision_immutable BEFORE UPDATE OR DELETE ON "DraftRevision"
FOR EACH ROW EXECUTE FUNCTION bd_lab_immutable_artifact();
ALTER TABLE "PdfAttachment" ADD CONSTRAINT pdf_byte_size CHECK ("byteSize" > 0 AND "byteSize" <= 20971520);
ALTER TABLE "ReceptionRecord" ADD CONSTRAINT version_nonnegative CHECK ("version" >= 0);
ALTER TABLE "Sample" ADD CONSTRAINT position_nonnegative CHECK ("position" >= 0);
