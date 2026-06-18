export interface User {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  country_code: string;
  email: string | null;
  profile_photo: string | null;
  date_of_birth: string | null;
  sexe: string | null;
  address: string | null;
  profession: string | null;
  revenus_declared: number | null;
  bio: string | null;
  role: string;
  is_admin: boolean;
  grants: string[];
  manager_id: string | null;
  team_name: string | null;
  kyc_level: number;
  kyc_updated_at: string | null;
  npi_number: string | null;
  cip_photo: string | null;
  cip_validation: string;
  selfie_photo: string | null;
  selfie_validation: string;
  cip_verified_at: string | null;
  is_verified: boolean;
  is_desactivate: boolean;
  is_deleted: boolean;
  last_login_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface UserListResponse {
  items: User[];
  total: number;
  page: number;
  pages: number;
}

export interface AdminCreateUserInput {
  first_name: string;
  last_name: string;
  phone: string;
  country_code: string;
  email?: string | null;
  password?: string;
  role: string;
  grants: string[];
  is_verified: boolean;
}

export interface AdminUpdateUserInput {
  first_name?: string;
  last_name?: string;
  email?: string | null;
  role?: string;
  grants?: string[];
  is_verified?: boolean;
  is_desactivate?: boolean;
}
