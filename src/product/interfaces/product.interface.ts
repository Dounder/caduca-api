import { BaseResponse } from 'src/common';

export interface ProductResponse extends BaseResponse {
  name: string;
  codes: ProductCodeResponse[];
}

export interface ProductCodeResponse extends BaseResponse {
  code: number;
  product: ProductSummary;
}

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
}
