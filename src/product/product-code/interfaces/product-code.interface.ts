import { ProductSummary } from 'src/product/interfaces';

export interface ProductCodeSummary {
  id: string;
  code: number;
  product: ProductSummary;
}
