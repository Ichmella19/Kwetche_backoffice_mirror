/**
 * Service paramètres applicatifs : lecture + mise à jour.
 */

import { settingsRepository } from "@/core/data/repositories";
import { SettingValueType } from "@/lib/enums";
import type { AppSetting } from "@/lib/types";

class SettingsService {
  list(): Promise<AppSetting[]> {
    return settingsRepository.list();
  }

  update(
    key: string,
    value: unknown,
    valueType?: SettingValueType | string,
  ): Promise<AppSetting> {
    return settingsRepository.update(key, {
      value,
      value_type: valueType,
    });
  }
}

export const settingsService = new SettingsService();
