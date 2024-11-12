import { IsNotEmpty } from 'class-validator';
import { IsCuid } from 'src/common';

export class CreateProductCodeDto {
  @IsCuid()
  @IsNotEmpty()
  productId: string;
}
