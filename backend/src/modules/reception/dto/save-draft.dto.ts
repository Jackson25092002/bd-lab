import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDefined,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SampleDto {
  @ApiProperty() @IsUUID() id!: string;
  @ApiProperty() @IsString() @MaxLength(300) name!: string;
  @ApiProperty() @IsString() @MaxLength(100) matrix!: string;
  @ApiProperty() @IsString() @MaxLength(1000) location!: string;
  @ApiProperty() @IsString() @MaxLength(200) quantity!: string;
  @ApiProperty() @IsString() @MaxLength(2000) tests!: string;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  uncertain?: boolean;
}
export class DraftDataDto {
  @ApiProperty() @IsString() @MaxLength(300) customer!: string;
  @ApiProperty() @IsString() @MaxLength(1000) address!: string;
  @ApiProperty() @IsString() @MaxLength(300) contact!: string;
  @ApiProperty({ description: 'YYYY-MM-DD hoặc chuỗi trống nếu chưa biết.' })
  @IsString()
  @Matches(/^$|^\d{4}-\d{2}-\d{2}$/)
  collectedAt!: string;
  @ApiProperty() @IsString() @MaxLength(300) collector!: string;
  @ApiProperty() @IsString() @MaxLength(5000) note!: string;
  @ApiProperty({ type: [SampleDto] })
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => SampleDto)
  samples!: SampleDto[];
}
export class SaveDraftDto {
  @ApiProperty({
    description: 'Version đã đọc; tránh ghi đè khi hai cửa sổ cùng sửa.',
  })
  @IsInt()
  @Min(0)
  version!: number;
  @ApiProperty({ type: DraftDataDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => DraftDataDto)
  edited!: DraftDataDto;
}
