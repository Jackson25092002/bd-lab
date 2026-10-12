import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { ReceptionService } from './reception.service.js';
import { SaveDraftDto } from './dto/save-draft.dto.js';
import { ListRecordsDto } from './dto/list-records.dto.js';

@ApiTags('Hồ sơ tiếp nhận')
@Controller('reception-records')
export class ReceptionController {
  constructor(
    @Inject(ReceptionService) private readonly service: ReceptionService,
  ) {}
  @Get()
  @ApiOperation({
    summary: 'Danh sách hồ sơ và mẫu trong môi trường phát triển.',
  })
  list(@Query() query: ListRecordsDto) {
    return this.service.list(query);
  }
  @Post('demo')
  @ApiOperation({
    summary: 'Tạo một hồ sơ giả lập, chỉ khi bật ENABLE_DEMO_FIXTURES.',
  })
  demo() {
    return this.service.createDemo();
  }
  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024, files: 1, fields: 0 },
    }),
  )
  @ApiOperation({ summary: 'Lưu PDF gốc và tạo hồ sơ trống, không chạy OCR.' })
  create(@UploadedFile() file: Express.Multer.File) {
    return this.service.create(file);
  }
  @Get(':id') detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.detail(id);
  }
  @Patch(':id/draft')
  @ApiOperation({
    summary: 'Lưu bản nháp trong transaction; version cũ trả 409.',
  })
  save(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SaveDraftDto) {
    return this.service.save(id, dto);
  }
  @Get(':id/history') history(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.history(id);
  }
  @Get(':id/pdf')
  @ApiProduces('application/pdf')
  async pdf(
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const file = await this.service.pdf(id);
    response.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="bien-ban.pdf"; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ETag: `"${file.sha256}"`,
    });
    return new StreamableFile(file.buffer);
  }
}
