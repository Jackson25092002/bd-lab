import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID, createHash } from 'node:crypto';
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { basename, isAbsolute, join, resolve } from 'node:path';

@Injectable()
export class LocalPdfStorage {
  readonly root = resolve(process.env.LOCAL_UPLOAD_DIR ?? './uploads');
  async store(file: Express.Multer.File) {
    if (
      !file ||
      !file.originalname.toLowerCase().endsWith('.pdf') ||
      (file.mimetype && file.mimetype !== 'application/pdf')
    )
      throw new BadRequestException('Chỉ tiếp nhận PDF.');
    if (!file.size || file.size > 20 * 1024 * 1024)
      throw new BadRequestException('PDF phải có nội dung và không quá 20 MB.');
    if (file.buffer.subarray(0, 5).toString('ascii') !== '%PDF-')
      throw new BadRequestException('Nội dung tệp không có chữ ký PDF hợp lệ.');
    const storageKey = `${randomUUID()}.pdf`;
    const decoded = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const readable =
      Array.from(file.originalname).every(
        (char) => char.charCodeAt(0) <= 255,
      ) && !decoded.includes('\uFFFD')
        ? decoded
        : file.originalname;
    const originalName =
      Array.from(basename(readable.replaceAll('\\', '/')))
        .filter(
          (char) => char.charCodeAt(0) >= 32 && char.charCodeAt(0) !== 127,
        )
        .join('')
        .slice(0, 250) || 'bien-ban.pdf';
    try {
      await mkdir(this.root, { recursive: true });
      await writeFile(join(this.root, storageKey), file.buffer, { flag: 'wx' });
    } catch {
      throw new ServiceUnavailableException(
        'Không thể lưu PDF vào bộ nhớ cục bộ.',
      );
    }
    return {
      storageKey,
      originalName,
      byteSize: file.size,
      sha256: createHash('sha256').update(file.buffer).digest('hex'),
    };
  }
  path(key: string) {
    if (isAbsolute(key) || !/^[0-9a-f-]{36}\.pdf$/.test(key))
      throw new NotFoundException('Không tìm thấy PDF.');
    return join(this.root, key);
  }
  async read(key: string, expectedHash: string) {
    let buffer: Buffer;
    try {
      buffer = await readFile(this.path(key));
    } catch {
      throw new NotFoundException('PDF gốc không còn trong bộ nhớ cục bộ.');
    }
    if (createHash('sha256').update(buffer).digest('hex') !== expectedHash)
      throw new ServiceUnavailableException(
        'PDF gốc đã thay đổi; cần kiểm tra tính toàn vẹn.',
      );
    return buffer;
  }
  async removeUncommitted(key: string) {
    await rm(this.path(key), { force: true });
  }
  async ready() {
    await mkdir(this.root, { recursive: true });
    await access(this.root, constants.R_OK | constants.W_OK);
  }
}
