import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AddToCartDto {
  @IsString()
  productId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  /**
   * Required when the product has hasVariants=true.
   * Identifies which variant the customer is purchasing.
   */
  @IsOptional()
  @IsString()
  variantId?: string;
}
