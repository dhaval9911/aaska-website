import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ProductUnit } from '@prisma/client';

import { CreateProductVariantDto } from './create-product-variant.dto';

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

  /**
   * Base selling price.  When hasVariants=true this is derived automatically
   * from the default variant's price and does not need to be provided.
   */
  @ValidateIf((o) => !o.hasVariants)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  /** "Was" / crossed-out price. Set showComparePrice: true to display it. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  compareAtPrice?: number;

  @IsOptional()
  @IsBoolean()
  showComparePrice?: boolean;

  /**
   * Base stock.  When hasVariants=true this is derived automatically from the
   * sum of variant stocks and does not need to be provided.
   */
  @ValidateIf((o) => !o.hasVariants)
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

  /** When true, price/stock/compareAtPrice come from the variants array. */
  @IsOptional()
  @IsBoolean()
  hasVariants?: boolean;

  /** When false, the stock count badge is hidden on the product detail page. */
  @IsOptional()
  @IsBoolean()
  showStock?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  variants?: CreateProductVariantDto[];
}
