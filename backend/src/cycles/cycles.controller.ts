import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { CyclesService } from './cycles.service';
import { CreateCycleDto } from './dto/create-cycle.dto';
import { UpdateCycleDto } from './dto/update-cycle.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('cycles')
export class CyclesController {
  constructor(private readonly cyclesService: CyclesService) { }

  @Post()
  create(@Body() createCycleDto: CreateCycleDto) {
    return this.cyclesService.create(createCycleDto);
  }

  @Get()
  findAll() {
    return this.cyclesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cyclesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCycleDto: UpdateCycleDto) {
    return this.cyclesService.update(+id, updateCycleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cyclesService.remove(+id);
  }

  @Post('toggle')
  toggle(@Body() body: { cicloLectivoId: number; instancia: any; cuatrimestre: number; cerrado: boolean }) {
    const fakeUserId = 1;

    return this.cyclesService.toggleInstancia({
      cicloLectivoId: body.cicloLectivoId,
      instancia: body.instancia,
      cuatrimestre: body.cuatrimestre,
      cerrado: body.cerrado,
      usuarioId: fakeUserId
    });
  }

  @Get(':id/parameters')
  getParameters(@Param('id', ParseIntPipe) id: number) {
    return this.cyclesService.getParametros(id);
  }
}
