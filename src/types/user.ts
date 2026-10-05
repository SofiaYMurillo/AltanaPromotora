export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profileMediaAssetId?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
