import { Module } from '@nestjs/common';
import { GradesService } from './grades.service';
import { GradesController } from './grades.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CyclesModule } from '../cycles/cycles.module';

@Module({
  imports: [PrismaModule, CyclesModule],
  controllers: [GradesController],
  providers: [GradesService],
})
export class GradesModule {}
