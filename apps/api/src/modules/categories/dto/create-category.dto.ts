import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  image?: string;

  /** null / omitted → top-level category; provided → subcategory (max 1 level deep) */
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
