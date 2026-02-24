import { CondicionEstudiante } from '@prisma/client';

export class CreateStudentDto {
  dni: string;
  apellido: string;
  nombre: string;
  fechaNacimiento: string; // ISO Date string
  lugarNacimiento?: string;
  genero?: string;
  domicilio?: string;
  telefonoContacto?: string;
  emailContacto?: string;

  fechaIngreso?: string;
  institucionOrigen?: string;
  fechaEgreso?: string;
  institucionDestino?: string;
  condicion?: CondicionEstudiante;

  librosFolios: { libro: string; folio: string }[];

  // Nuevos campos
  grupoSanguineo?: string;
  alergias?: string;
  enfermedadesCronicas?: string;
  obraSocial?: string;
  nombreTutor?: string;
  telefonoTutor?: string;
  emailTutor?: string;
  contactoEmergenciaNombre?: string;
  contactoEmergenciaTelefono?: string;
  orientacion?: string;
  observacionesGenerales?: string;
}
