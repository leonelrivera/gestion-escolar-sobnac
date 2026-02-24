import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { OrientationsService } from './orientations.service';
import { CreateOrientationDto } from './dto/create-orientation.dto';
import { UpdateOrientationDto } from './dto/update-orientation.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('orientations')
export class OrientationsController {
  constructor(private readonly orientationsService: OrientationsService) {}

  @Get()
  findAll() {
    return this.orientationsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateOrientationDto) {
    return this.orientationsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOrientationDto) {
    return this.orientationsService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orientationsService.remove(+id);
  }
}
