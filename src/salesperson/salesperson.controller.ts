import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { CreateSalespersonDto, UpdateSalespersonDto } from './dto';
import { SalespersonService } from './salesperson.service';
import { ParseCuidPipe } from 'src/common';

@Controller('salesperson')
export class SalespersonController {
  constructor(private readonly salespersonService: SalespersonService) {}

  @Post()
  create(@Body() createSalespersonDto: CreateSalespersonDto) {
    return this.salespersonService.create(createSalespersonDto);
  }

  @Get()
  findAll() {
    return this.salespersonService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseCuidPipe) id: string) {
    return this.salespersonService.findOne(id);
  }

  @Get('code/:code')
  findOneByCode(@Param('code', ParseIntPipe) code: number) {
    return this.salespersonService.findOneByCode(code);
  }

  @Patch(':id')
  update(@Param('id', ParseCuidPipe) id: string, @Body() updateSalespersonDto: UpdateSalespersonDto) {
    return this.salespersonService.update(id, updateSalespersonDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseCuidPipe) id: string) {
    return this.salespersonService.remove(id);
  }

  @Patch(':id/restore')
  restore(@Param('id', ParseCuidPipe) id: string) {
    return this.salespersonService.remove(id);
  }
}
