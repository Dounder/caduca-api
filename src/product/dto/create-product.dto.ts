import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty()
  @MaxLength(300)
  name: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  newCode: boolean = false;
}
