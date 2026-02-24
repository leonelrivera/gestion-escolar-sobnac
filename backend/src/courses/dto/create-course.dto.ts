export class CreateCourseDto {
  cicloLectivoId: number;
  anioCurso: string; // "1ro"
  division: string; // "A"
  turno?: 'MANANA' | 'TARDE' | 'VESPERTINO';
  orientacionId?: number;
  preceptorId?: number;
}
