import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { ProductUnit } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock!: number;

  @IsEnum(ProductUnit)
  unit!: ProductUnit;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsString()
  @IsNotEmpty()
  categoryId!: string;
}
