import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { AppModule } from '../dist/app.module.js';
import { setupApp } from '../dist/app.setup.js';
import { PrismaService } from '../dist/database/prisma.service.js';
import { LocalPdfStorage } from '../dist/storage/local-pdf.storage.js';

describe('Hồ sơ / PostgreSQL / PDF', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let fixture: Buffer;
  beforeAll(async () => {
    fixture = await readFile(
      resolve('../frontend/public/demo/bien-ban-demo.pdf'),
    );
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const instance = module.createNestApplication<NestExpressApplication>({
      bodyParser: false,
    });
    instance.useBodyParser('json', { limit: '1mb' });
    app = instance;
    setupApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });
  afterAll(async () => {
    await app?.close();
  });
  const receive = async () =>
    (
      await request(app.getHttpServer())
        .post('/api/reception-records')
        .attach('file', fixture, {
          filename: 'DEMO.pdf',
          contentType: 'application/pdf',
        })
        .expect(201)
    ).body;
  const demo = async () =>
    (
      await request(app.getHttpServer())
        .post('/api/reception-records/demo')
        .expect(201)
    ).body;

  it('JSON lỗi và vượt 1 MB trả lỗi 400/413 rõ ràng', async () => {
    const id = randomUUID();
    await request(app.getHttpServer())
      .patch(`/api/reception-records/${id}/draft`)
      .set('Content-Type', 'application/json')
      .send('{')
      .expect(400);
    await request(app.getHttpServer())
      .patch(`/api/reception-records/${id}/draft`)
      .send({ note: 'a'.repeat(1024 * 1024 + 1) })
      .expect(413);
  });
  it('health và readiness kiểm tra database', async () => {
    await request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok', service: 'bd-lab-api' });
    await request(app.getHttpServer())
      .get('/api/health/ready')
      .expect(200)
      .expect({ status: 'ok', database: 'connected' });
  });
  it('tiếp nhận PDF giữ byte gốc và không suy đoán OCR', async () => {
    const record = await receive();
    expect(record.edited.samples).toEqual([]);
    expect(record.raw.customer).toBe('');
    const response = await request(app.getHttpServer())
      .get(`/api/reception-records/${record.id}/pdf`)
      .expect(200)
      .expect('Content-Type', /application\/pdf/);
    expect(response.body).toEqual(fixture);
    expect(record.sha256).toHaveLength(64);
  });
  it('từ chối tệp giả, không có tệp và vượt 20 MB', async () => {
    await request(app.getHttpServer())
      .post('/api/reception-records')
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/reception-records')
      .attach('file', Buffer.from('not-pdf'), {
        filename: 'fake.pdf',
        contentType: 'application/pdf',
      })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/reception-records')
      .attach('file', fixture, {
        filename: 'fake.txt',
        contentType: 'text/plain',
      })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/reception-records')
      .attach('file', Buffer.alloc(20 * 1024 * 1024 + 1), {
        filename: 'too-big.pdf',
        contentType: 'application/pdf',
      })
      .expect(413);
  });
  it('lưu 3 mẫu, đọc lại sau khởi tạo service mới và giữ dữ liệu gốc', async () => {
    const record = await demo();
    const edited = structuredClone(record.edited);
    edited.samples[1].quantity = '2 chai × 500 ml';
    const response = await request(app.getHttpServer())
      .patch(`/api/reception-records/${record.id}/draft`)
      .send({ version: 0, edited })
      .expect(200);
    expect(response.body.raw.samples[1].quantity).toBe('');
    expect(response.body.version).toBe(1);
    expect(response.body.status).toBe('draft');
    const fresh = new PrismaService();
    try {
      const stored = await fresh.receptionRecord.findUniqueOrThrow({
        where: { id: record.id },
        include: { samples: true },
      });
      expect(stored.samples).toHaveLength(3);
      expect(
        stored.samples.find((sample) => sample.id === edited.samples[1].id)
          ?.quantity,
      ).toBe('2 chai × 500 ml');
    } finally {
      await fresh.$disconnect();
    }
    const history = await request(app.getHttpServer())
      .get(`/api/reception-records/${record.id}/history`)
      .expect(200);
    expect(
      history.body.map((item: { version: number }) => item.version),
    ).toEqual([1, 0]);
  });
  it('thêm/xóa mẫu không đổi ID của mẫu giữ lại', async () => {
    const record = await demo();
    const edited = structuredClone(record.edited);
    const retained = edited.samples[0].id;
    edited.samples.splice(1, 1);
    edited.samples.push({
      id: randomUUID(),
      name: 'Mẫu thêm thử nghiệm',
      matrix: 'Đất',
      location: '',
      quantity: '',
      tests: '',
    });
    const saved = await request(app.getHttpServer())
      .patch(`/api/reception-records/${record.id}/draft`)
      .send({ version: 0, edited })
      .expect(200);
    expect(saved.body.edited.samples).toHaveLength(3);
    expect(saved.body.edited.samples[0].id).toBe(retained);
    expect(saved.body.raw.samples).toHaveLength(3);
  });
  it('version cũ trả 409 và không ghi đè bản đã lưu', async () => {
    const record = await demo();
    const edited = { ...record.edited, customer: 'Bản lưu đầu tiên' };
    await request(app.getHttpServer())
      .patch(`/api/reception-records/${record.id}/draft`)
      .send({ version: 0, edited })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/api/reception-records/${record.id}/draft`)
      .send({
        version: 0,
        edited: { ...edited, customer: 'Ghi đè không được phép' },
      })
      .expect(409);
    const detail = await request(app.getHttpServer())
      .get(`/api/reception-records/${record.id}`)
      .expect(200);
    expect(detail.body.edited.customer).toBe('Bản lưu đầu tiên');
    expect(detail.body.version).toBe(1);
  });
  it('hai lần lưu đồng thời cùng version chỉ một lần được chấp nhận', async () => {
    const record = await demo();
    const responses = await Promise.all(
      ['Cửa sổ A', 'Cửa sổ B'].map((customer) =>
        request(app.getHttpServer())
          .patch(`/api/reception-records/${record.id}/draft`)
          .send({ version: 0, edited: { ...record.edited, customer } }),
      ),
    );
    expect(
      responses.map((response) => response.status).sort((a, b) => a - b),
    ).toEqual([200, 409]);
    const detail = await request(app.getHttpServer())
      .get(`/api/reception-records/${record.id}`)
      .expect(200);
    expect(detail.body.version).toBe(1);
  });
  it('API lọc khách hàng/trạng thái và kiểm tra query sai', async () => {
    const record = await demo();
    const unique = `Khách hàng thử nghiệm ${randomUUID()}`;
    await request(app.getHttpServer())
      .patch(`/api/reception-records/${record.id}/draft`)
      .send({ version: 0, edited: { ...record.edited, customer: unique } })
      .expect(200);
    const result = await request(app.getHttpServer())
      .get('/api/reception-records')
      .query({ search: unique, status: 'draft' })
      .expect(200);
    expect(result.body.map((item: { id: string }) => item.id)).toEqual([
      record.id,
    ]);
    await request(app.getHttpServer())
      .get('/api/reception-records')
      .query({ status: 'confirmed' })
      .expect(400);
  });
  it('không cập nhật mẫu của hồ sơ khác; transaction rollback toàn bộ', async () => {
    const a = await demo(),
      b = await demo();
    const edited = {
      ...a.edited,
      customer: 'Không được lưu',
      samples: [b.edited.samples[0]],
    };
    await request(app.getHttpServer())
      .patch(`/api/reception-records/${a.id}/draft`)
      .send({ version: 0, edited })
      .expect(400);
    const detail = await request(app.getHttpServer())
      .get(`/api/reception-records/${a.id}`)
      .expect(200);
    expect(detail.body.version).toBe(0);
    expect(detail.body.edited.customer).toBe(a.edited.customer);
  });
  it('chặn sửa raw, trường lạ, ID trùng, ngày sai và payload thiếu', async () => {
    const record = await demo();
    const path = `/api/reception-records/${record.id}/draft`;
    await request(app.getHttpServer())
      .patch(path)
      .send({ version: 0, edited: record.edited, raw: {} })
      .expect(400);
    await request(app.getHttpServer())
      .patch(path)
      .send({ version: 0 })
      .expect(400);
    await request(app.getHttpServer())
      .patch(path)
      .send({
        version: 0,
        edited: { ...record.edited, collectedAt: '2026-02-30' },
      })
      .expect(400);
    await request(app.getHttpServer())
      .patch(path)
      .send({
        version: 0,
        edited: {
          ...record.edited,
          samples: [record.edited.samples[0], record.edited.samples[0]],
        },
      })
      .expect(400);
    await request(app.getHttpServer())
      .get('/api/reception-records/not-uuid')
      .expect(400);
    await request(app.getHttpServer())
      .get(`/api/reception-records/${randomUUID()}`)
      .expect(404);
  });
  it('database chặn sửa dữ liệu OCR gốc và lịch sử', async () => {
    const record = await demo();
    await expect(
      prisma.extractionSnapshot.update({
        where: { recordId: record.id },
        data: { payload: {} },
      }),
    ).rejects.toThrow();
    const revision = await prisma.draftRevision.findFirstOrThrow({
      where: { recordId: record.id },
    });
    await expect(
      prisma.draftRevision.update({
        where: { id: revision.id },
        data: { action: 'tampered' },
      }),
    ).rejects.toThrow();
  });
  it('phát hiện PDF gốc bị thay đổi trên filesystem', async () => {
    const record = await receive();
    const attachment = await prisma.pdfAttachment.findUniqueOrThrow({
      where: { recordId: record.id },
    });
    const storage = new LocalPdfStorage();
    const path = storage.path(attachment.storageKey);
    await writeFile(path, Buffer.from('%PDF-corrupted-fixture'));
    try {
      await request(app.getHttpServer())
        .get(`/api/reception-records/${record.id}/pdf`)
        .expect(503);
    } finally {
      await writeFile(path, fixture);
    }
  });
});
