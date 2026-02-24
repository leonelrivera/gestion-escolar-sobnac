import { Module } from '@nestjs/common';
import { OrientationsController } from './orientations.controller';
import { OrientationsService } from './orientations.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OrientationsController],
  providers: [OrientationsService],
})
export class OrientationsModule {}
