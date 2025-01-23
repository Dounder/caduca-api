import { BaseListResponse, BaseResponse } from 'src/common';

export interface CustomerSummary {
  id: string;
  name: string;
  code: number;
}

export interface CustomerResponse extends BaseResponse {
  code: number;
  name: string;
  address: string;
}

export interface CustomerListResponse extends BaseListResponse {
  code: number;
  name: string;
  address: string;
}

export interface CustomerSummaryResponse {
  id: string;
  code: number;
  name: string;
}
