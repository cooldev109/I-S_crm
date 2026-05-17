import { IsEnum, IsNumber, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';
import { ProjectStatus, ProjectType } from '@studio/shared';

export class UpdateProjectDto {
  @IsOptional()
  @IsEnum(ProjectType)
  type?: ProjectType;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  areaM2?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  scope?: string;
}
