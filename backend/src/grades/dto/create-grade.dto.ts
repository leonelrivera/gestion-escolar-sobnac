import { InstanciaEvaluacion } from '@prisma/client';

export class CreateGradeDto {
  estudianteId: number;
  materiaId: number;
  cuatrimestre: number;
  instancia: InstanciaEvaluacion;
  nota: number | null;
  fecha: string; // ISO
  observaciones?: string;
  courseId?: number; // Context for validation
}
