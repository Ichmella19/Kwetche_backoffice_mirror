import { httpService } from "@/core/data/http.service";
import type { ISettingsRepository } from "@/core/domain/repositories";
import type { AppSetting } from "@/lib/types";

export class SettingsRepository implements ISettingsRepository {
  list(): Promise<AppSetting[]> {
    return httpService.get<AppSetting[]>("/settings");
  }

  update(
    key: string,
    payload: { value: unknown; value_type?: string; description?: string },
  ): Promise<AppSetting> {
    return httpService.patch<AppSetting>(`/admin/settings/${key}`, payload);
  }
}

export const settingsRepository = new SettingsRepository();
