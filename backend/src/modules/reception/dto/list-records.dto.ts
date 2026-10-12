import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
export class ListRecordsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
  @ApiPropertyOptional({ enum: ['pending', 'reviewing', 'draft'] })
  @IsOptional()
  @IsIn(['pending', 'reviewing', 'draft'])
  status?: 'pending' | 'reviewing' | 'draft';
}
