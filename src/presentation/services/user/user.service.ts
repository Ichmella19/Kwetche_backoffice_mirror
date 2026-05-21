/**
 * Service utilisateur : profil de l'administrateur connecté.
 */

import { userRepository } from "@/core/data/repositories";
import type { User } from "@/lib/types";

class UserService {
  me(): Promise<User> {
    return userRepository.me();
  }

  updateProfile(data: Partial<User>): Promise<User> {
    return userRepository.updateProfile(data);
  }
}

export const userService = new UserService();
