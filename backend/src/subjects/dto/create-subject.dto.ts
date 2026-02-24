export class CreateSubjectDto {
  nombre: string;
  anioCurso: string; // "1ro", "2do", etc.
  orientacionFiltro?: string;
}
