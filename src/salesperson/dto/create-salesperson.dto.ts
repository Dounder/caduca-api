import { IsNotEmpty, MaxLength } from 'class-validator';

export class CreateSalespersonDto {
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}
