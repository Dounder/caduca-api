import { BaseResponse, Catalog } from 'src/common';
import { CustomerSummary } from 'src/customer';
import { ProductCodeVoucher } from 'src/product';

export interface VoucherList extends BaseResponse {
  number: number;
  approvedDate: null | Date;
  rejectedDate: null | Date;
  customer: CustomerSummary;
  status: Catalog;
  returnType: Catalog;
}

export interface Voucher extends VoucherList {
  items: VoucherItem[];
}

export interface VoucherItem {
  id: string;
  expirationDate: Date;
  observation: string;
  received: boolean;
  quantity: number;
  productCode: ProductCodeVoucher;
}

export enum ReturnType {
  Expired = 1,
  Damaged,
  GoodCondition,
}

export enum VoucherStatus {
  Draft = 1,
  Submitted,
  UnderReview,
  Approved,
  Processing,
  Received,
  Completed,
  Rejected,
}
