import { CondicionEstudiante } from '@prisma/client';

export class CreateStudentDto {
  dni: string;
  apellido: string;
  nombre: string;
  fechaNacimiento: string; // ISO Date string
  lugarNacimiento: string;
  genero?: string;
  domicilio?: string;
  telefonoContacto?: string;
  emailContacto?: string;

  fechaIngreso?: string;
  institucionOrigen?: string;
  fechaEgreso?: string;
  institucionDestino?: string;
  condicion?: CondicionEstudiante;
  paseDestino?: string;
  paseColegio?: string;
  paseFecha?: string;
  paseEstado?: string;

  librosFolios: { libro: string; folio: string }[];

  // Nuevos campos
  cud?: boolean;
  grupoSanguineo?: string;
  alergias?: string;
  enfermedadesCronicas?: string;
  obraSocial?: string;
  nombreTutor?: string;
  telefonoTutor?: string;
  emailTutor?: string;
  nombreTutorAlternativo?: string;
  telefonoTutorAlternativo?: string;
  emailTutorAlternativo?: string;
  contactoEmergenciaNombre?: string;
  contactoEmergenciaTelefono?: string;
  orientacion?: string;
  observacionesGenerales?: string;
}
