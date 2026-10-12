import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PrismaService } from '../../database/prisma.service.js';
import { LocalPdfStorage } from '../../storage/local-pdf.storage.js';
import { Prisma } from '../../generated/prisma/client.js';
import { DraftDataDto, SaveDraftDto } from './dto/save-draft.dto.js';
import { demoData, emptyData } from './demo-data.js';
import { ListRecordsDto } from './dto/list-records.dto.js';

const recordInclude = {
  attachment: true,
  extraction: true,
  samples: { orderBy: { position: 'asc' as const } },
};
type IncludedRecord = Prisma.ReceptionRecordGetPayload<{
  include: typeof recordInclude;
}>;
const json = (data: DraftDataDto) =>
  JSON.parse(JSON.stringify(data)) as Prisma.InputJsonValue;
const sampleFields = (sample: DraftDataDto['samples'][number]) => ({
  name: sample.name,
  matrix: sample.matrix,
  location: sample.location,
  quantity: sample.quantity,
  tests: sample.tests,
  uncertain: sample.uncertain ?? false,
});

@Injectable()
export class ReceptionService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(LocalPdfStorage) private readonly storage: LocalPdfStorage,
  ) {}
  serialize(record: IncludedRecord) {
    return {
      id: record.id,
      reference: `HS-${String(record.serial).padStart(6, '0')}`,
      version: record.version,
      fileName: record.attachment?.originalName ?? '',
      fileSize: record.attachment?.byteSize ?? 0,
      pdfUrl: `/api/reception-records/${record.id}/pdf`,
      sha256: record.attachment?.sha256,
      demo: record.isDemo,
      receivedAt: record.receivedAt.toISOString(),
      status: record.status,
      savedAt: record.savedAt?.toISOString(),
      raw: record.extraction?.payload ?? emptyData(),
      edited: this.data(record),
    };
  }
  private data(record: IncludedRecord): DraftDataDto {
    return {
      customer: record.customer,
      address: record.address,
      contact: record.contact,
      collectedAt: record.collectedAt,
      collector: record.collector,
      note: record.note,
      samples: record.samples.map(
        ({ id, name, matrix, location, quantity, tests, uncertain }) => ({
          id,
          name,
          matrix,
          location,
          quantity,
          tests,
          uncertain,
        }),
      ),
    };
  }
  async list(query: ListRecordsDto = {}) {
    const search = query.search?.trim();
    const records = await this.prisma.receptionRecord.findMany({
      where: {
        status: query.status,
        ...(search
          ? {
              OR: [
                { customer: { contains: search, mode: 'insensitive' } },
                {
                  samples: {
                    some: { name: { contains: search, mode: 'insensitive' } },
                  },
                },
              ],
            }
          : {}),
      },
      include: recordInclude,
      orderBy: [{ receivedAt: 'desc' }, { serial: 'desc' }],
    });
    return records.map((record) => this.serialize(record));
  }
  async get(id: string) {
    const record = await this.prisma.receptionRecord.findUnique({
      where: { id },
      include: recordInclude,
    });
    if (!record) throw new NotFoundException('Không tìm thấy hồ sơ.');
    return record;
  }
  async detail(id: string) {
    return this.serialize(await this.get(id));
  }
  async create(file: Express.Multer.File, demo = false) {
    const attachment = await this.storage.store(file);
    const data = demo ? demoData() : emptyData();
    const { samples, ...fields } = data;
    try {
      const record = await this.prisma.receptionRecord.create({
        data: {
          ...fields,
          isDemo: demo,
          attachment: { create: attachment },
          extraction: demo
            ? { create: { source: 'demo', payload: json(data) } }
            : undefined,
          samples: {
            create: samples.map((sample, position) => ({
              id: sample.id,
              ...sampleFields(sample),
              position,
            })),
          },
          revisions: {
            create: {
              version: 0,
              action: demo ? 'demo-created' : 'pdf-received',
              snapshot: json(data),
            },
          },
        },
        include: recordInclude,
      });
      return this.serialize(record);
    } catch (error) {
      await this.storage.removeUncommitted(attachment.storageKey);
      throw error;
    }
  }
  async createDemo() {
    if (
      process.env.NODE_ENV === 'production' ||
      process.env.ENABLE_DEMO_FIXTURES !== 'true'
    )
      throw new ForbiddenException(
        'Dữ liệu demo không được bật trong môi trường này.',
      );
    const path = resolve(
      process.env.DEMO_PDF_PATH ?? '../frontend/public/demo/bien-ban-demo.pdf',
    );
    const buffer = await readFile(path);
    return this.create(
      {
        originalname: 'BB_lay_mau_DEMO.pdf',
        mimetype: 'application/pdf',
        size: buffer.length,
        buffer,
      } as Express.Multer.File,
      true,
    );
  }
  async save(id: string, dto: SaveDraftDto) {
    const identifiers = dto.edited.samples.map((sample) => sample.id);
    if (new Set(identifiers).size !== identifiers.length)
      throw new BadRequestException('ID mẫu không được trùng trong một hồ sơ.');
    if (dto.edited.collectedAt) {
      const value = dto.edited.collectedAt;
      const date = new Date(`${value}T00:00:00Z`);
      if (
        !Number.isFinite(date.getTime()) ||
        date.toISOString().slice(0, 10) !== value
      )
        throw new BadRequestException('Ngày lấy mẫu không hợp lệ.');
    }
    const { samples, ...fields } = dto.edited;
    const record = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.receptionRecord.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!existing) throw new NotFoundException('Không tìm thấy hồ sơ.');
      const updated = await tx.receptionRecord.updateMany({
        where: { id, version: dto.version },
        data: {
          ...fields,
          status: 'draft',
          savedAt: new Date(),
          version: { increment: 1 },
        },
      });
      if (!updated.count)
        throw new ConflictException(
          'Hồ sơ đã thay đổi ở cửa sổ khác. Tải lại bản mới trước khi lưu.',
        );
      const owners = await tx.sample.findMany({
        where: { id: { in: identifiers } },
        select: { id: true, recordId: true },
      });
      if (owners.some((sample) => sample.recordId !== id))
        throw new BadRequestException(
          'Không được cập nhật mẫu của hồ sơ khác.',
        );
      await tx.sample.deleteMany({
        where: { recordId: id, id: { notIn: identifiers } },
      });
      for (const [position, sample] of samples.entries()) {
        const fields = { ...sampleFields(sample), position };
        if (owners.some((owner) => owner.id === sample.id)) {
          const changed = await tx.sample.updateMany({
            where: { id: sample.id, recordId: id },
            data: fields,
          });
          if (!changed.count)
            throw new ConflictException(
              'Mẫu đã thay đổi; tải lại hồ sơ trước khi lưu.',
            );
        } else
          await tx.sample.create({
            data: { id: sample.id, recordId: id, ...fields },
          });
      }
      await tx.draftRevision.create({
        data: {
          recordId: id,
          version: dto.version + 1,
          action: 'draft-saved',
          snapshot: json(dto.edited),
        },
      });
      return tx.receptionRecord.findUniqueOrThrow({
        where: { id },
        include: recordInclude,
      });
    });
    return this.serialize(record);
  }
  async history(id: string) {
    await this.get(id);
    return this.prisma.draftRevision.findMany({
      where: { recordId: id },
      orderBy: { version: 'desc' },
    });
  }
  async pdf(id: string) {
    const record = await this.get(id);
    if (!record.attachment) throw new NotFoundException('Hồ sơ chưa có PDF.');
    return {
      name: record.attachment.originalName,
      sha256: record.attachment.sha256,
      buffer: await this.storage.read(
        record.attachment.storageKey,
        record.attachment.sha256,
      ),
    };
  }
}
