import { CatalogResponse } from 'src/common';
import { CustomerSummary } from 'src/customer';
import { CodeSummary } from 'src/product';
import { UserSummary } from 'src/user';

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

export interface VoucherResponse {
  id: string;
  number: number;
  approvedDate: Date | null;
  rejectedDate: Date | null;
  customer: CustomerSummary;
  status: CatalogResponse;
  returnType: CatalogResponse;
  createdAt: Date | null;
  updatedAt: Date | null;
  deletedAt: Date | null;
  createdBy: UserSummary;
  updatedBy: UserSummary | null;
  deletedBy: UserSummary | null;
  items: Item[];
}

export interface Item {
  id: string;
  expirationDate: Date;
  observation: string;
  received: boolean;
  quantity: number;
  productCode: CodeSummary;
}
