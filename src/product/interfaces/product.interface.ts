import { BaseListResponse, BaseResponse } from 'src/common';
import { CodeListResponse } from '../product-code';

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
}

export interface ProductResponse extends BaseResponse {
  name: string;
  slug: string;
  codes: CodeListResponse[];
}

export interface ProductListResponse extends BaseListResponse {
  name: string;
  slug: string;
  codes: CodeListResponse[];
}
