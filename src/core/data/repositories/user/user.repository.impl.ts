import { httpService } from "@/core/data/http.service";
import type { IUserRepository } from "@/core/domain/repositories";
import type { User } from "@/lib/types";

export class UserRepository implements IUserRepository {
  me(): Promise<User> {
    return httpService.get<User>("/user/me");
  }

  updateProfile(data: Partial<User>): Promise<User> {
    return httpService.patch<User>("/user/me", data);
  }
}

export const userRepository = new UserRepository();
