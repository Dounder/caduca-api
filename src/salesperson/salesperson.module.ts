import { Module } from '@nestjs/common';
import { SalespersonService } from './salesperson.service';
import { SalespersonController } from './salesperson.controller';

@Module({
  controllers: [SalespersonController],
  providers: [SalespersonService],
})
export class SalespersonModule {}
