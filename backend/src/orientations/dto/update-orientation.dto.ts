import { PartialType } from '@nestjs/mapped-types';
import { CreateOrientationDto } from './create-orientation.dto';

export class UpdateOrientationDto extends PartialType(CreateOrientationDto) {}
