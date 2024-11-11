import { UserSummary } from 'src/user';

export interface Base {
  id: string;

  createdAt: Date | null;
  updatedAt: Date | null;
  deletedAt: Date | null;
  createdById: UserSummary | null;
  updatedById: UserSummary | null;
  deletedById: UserSummary | null;
}
