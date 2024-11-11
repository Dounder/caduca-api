import { IsNotEmpty, MaxLength } from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty()
  @MaxLength(300)
  name: string;
}
