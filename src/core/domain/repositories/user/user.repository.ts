import type { User } from "@/lib/types";

export interface IUserRepository {
  me(): Promise<User>;
  updateProfile(data: Partial<User>): Promise<User>;
}
