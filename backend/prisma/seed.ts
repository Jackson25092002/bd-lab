import { existsSync } from 'node:fs';
import { PrismaService } from '../src/database/prisma.service.js';
import { LocalPdfStorage } from '../src/storage/local-pdf.storage.js';
import { ReceptionService } from '../src/modules/reception/reception.service.js';
if (existsSync('.env')) process.loadEnvFile('.env');
if (
  process.env.NODE_ENV === 'production' ||
  process.env.ENABLE_DEMO_FIXTURES !== 'true'
)
  throw new Error(
    'Seed chỉ dùng môi trường phát triển với ENABLE_DEMO_FIXTURES=true.',
  );
const prisma = new PrismaService();
try {
  const count = await prisma.receptionRecord.count({ where: { isDemo: true } });
  if (count)
    console.log('Đã có hồ sơ demo; seed không ghi đè hoặc xóa dữ liệu.');
  else {
    const service = new ReceptionService(prisma, new LocalPdfStorage());
    const first = await service.createDemo();
    const second = await service.createDemo();
    const third = await service.createDemo();
    await service.save(second.id, {
      version: second.version,
      edited: second.edited,
    });
    await prisma.receptionRecord.update({
      where: { id: third.id },
      data: { status: 'reviewing' },
    });
    console.log(
      `Đã tạo 3 hồ sơ / 9 mẫu hoàn toàn giả lập. Hồ sơ đầu: ${first.reference}.`,
    );
  }
} finally {
  await prisma.$disconnect();
}
