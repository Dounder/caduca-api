import { UserSummary } from 'src/user';

export interface ListResponse<T> {
  meta: ListResponseMeta;
  data: Partial<T>[];
}

export interface ListResponseMeta {
  total: number;
  page: number;
  lastPage: number;
}

export interface BaseResponse {
  id: string;

  createdAt: Date | null;
  updatedAt: Date | null;
  deletedAt: Date | null;
  createdBy: UserSummary | null;
  updatedBy: UserSummary | null;
  deletedBy: UserSummary | null;
}
