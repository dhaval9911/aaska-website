import { Type } from 'class-transformer';
import { IsArray, IsInt, IsString, Min, ValidateNested } from 'class-validator';

class HomeTileOrderItem {
  @IsString()
  id!: string;

  @IsInt()
  @Min(0)
  homeDisplayOrder!: number;
}

export class ReorderHomeTilesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HomeTileOrderItem)
  tiles!: HomeTileOrderItem[];
}
