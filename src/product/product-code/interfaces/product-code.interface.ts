import { BaseListResponse, BaseResponse } from 'src/common';
import { ProductSummary } from 'src/product/interfaces';

export interface Code extends BaseResponse {
  code: number;
  product: ProductSummary;
}

export interface CodeList extends BaseListResponse {
  code: number;
  product: ProductSummary;
}

export interface CodeSummary {
  id: string;
  code: number;
  product: ProductSummary;
}

export interface ProductCodes {
  id: string;
  code: number;
}
