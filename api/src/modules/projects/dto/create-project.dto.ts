import { IsEnum, IsNumber, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';
import { ProjectType } from '@studio/shared';

export class CreateProjectDto {
  @IsString()
  clientId: string;

  @IsEnum(ProjectType)
  type: ProjectType;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  areaM2?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  scope?: string;
}
