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
  kyc_level: number;
  kyc_updated_at: string | null;
  cip_verified_at: string | null;
  is_verified: boolean;
  is_desactivate: boolean;
  is_deleted: boolean;
  last_login_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}
