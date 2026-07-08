import { IsOptional, IsString, MaxLength } from 'class-validator';

export class TrackVisitDto {
  @IsString()
  @MaxLength(512)
  path!: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  referrer?: string;
}
