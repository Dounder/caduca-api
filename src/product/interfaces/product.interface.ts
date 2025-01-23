import { BaseListResponse, BaseResponse } from 'src/common';
import { ProductCodes } from '../product-code';

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
}

export interface ProductResponse extends BaseResponse {
  name: string;
  slug: string;
  codes: ProductCodes[];
}

export interface ProductListResponse extends BaseListResponse {
  name: string;
  slug: string;
  codes: ProductCodes[];
}
