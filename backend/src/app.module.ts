import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { StudentsModule } from './students/students.module';
import { CyclesModule } from './cycles/cycles.module';
import { CoursesModule } from './courses/courses.module';
import { OrientationsModule } from './orientations/orientations.module';
import { SubjectsModule } from './subjects/subjects.module';
import { GradesModule } from './grades/grades.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ReportsModule } from './reports/reports.module';
import { InscriptionsModule } from './inscriptions/inscriptions.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    PrismaModule,
    StudentsModule,
    CyclesModule,
    CoursesModule,
    OrientationsModule,
    SubjectsModule,
    GradesModule,
    AttendanceModule,
    ReportsModule,
    InscriptionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
