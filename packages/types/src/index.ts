export type UserRole = 'ADMIN' | 'CUSTOMER';

export type ProductUnit =
  | 'KG'
  | 'LITRE'
  | 'ML'
  | 'METER'
  | 'PACK'
  | 'PIECE'
  | 'BOTTLE'
  | 'COMBO_KIT';

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
}

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  unit: ProductUnit;
  images: string[];
  categoryId: string;
}
