export class CreateAttendanceDto {
  inscripcionId: number;
  fecha: string; // ISO
  presente: boolean;
  justificado?: boolean;
}
