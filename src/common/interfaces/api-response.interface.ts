import { User, UserSummary } from 'src/user';
import { PaginationDto } from '../dto';

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

export interface BaseListResponse {
  id: string;

  createdAt: Date | null;
  updatedAt: Date | null;
  deletedAt: Date | null;
  createdBy: UserSummary | null;
}

export interface FindAllParams {
  pagination: PaginationDto;
  user: User;
  summary?: boolean;
}

export interface CatalogResponse {
  id: number;
  name: string;
}
