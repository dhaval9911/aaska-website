import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsString()
  bannerImage?: string;

  @IsOptional()
  @IsString()
  homeTileImage?: string;

  @IsOptional()
  @IsBoolean()
  featuredOnHome?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  homeDisplayOrder?: number;

  @IsOptional()
  @IsString()
  description?: string;
}
