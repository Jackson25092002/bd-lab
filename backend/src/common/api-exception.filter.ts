import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);
  catch(error: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    if (error instanceof HttpException) {
      response.status(error.getStatus()).json({
        statusCode: error.getStatus(),
        ...(typeof error.getResponse() === 'object'
          ? (error.getResponse() as object)
          : { message: error.message }),
      });
      return;
    }
    const prismaError = error as { code?: string };
    const parserError = error as { status?: number; type?: string };
    if (
      parserError.type === 'entity.parse.failed' ||
      parserError.type === 'entity.too.large'
    ) {
      const status = parserError.type === 'entity.too.large' ? 413 : 400;
      response
        .status(status)
        .json({
          statusCode: status,
          message:
            status === 413
              ? 'Nội dung JSON vượt giới hạn 1 MB.'
              : 'Nội dung JSON không hợp lệ.',
        });
      return;
    }
    if (prismaError.code === 'P2002') {
      response.status(HttpStatus.CONFLICT).json({
        statusCode: 409,
        message: 'Dữ liệu trùng lặp; không thể lưu thay đổi.',
      });
      return;
    }
    this.logger.error(
      'Không thể xử lý yêu cầu API; kiểm tra database và bộ nhớ cục bộ.',
    );
    response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
      statusCode: 503,
      message:
        'Không thể truy cập database hoặc bộ nhớ. Thử lại sau khi kiểm tra backend.',
    });
  }
}
