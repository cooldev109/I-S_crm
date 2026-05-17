import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateClientDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  /** Phone, email, or whatever the studio uses to reach them. */
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  contact: string;

  /** Origin (e.g. "whatsapp", "form:ishomesstudio.com", UTM-ish). Free-form. */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  source?: string;
}
