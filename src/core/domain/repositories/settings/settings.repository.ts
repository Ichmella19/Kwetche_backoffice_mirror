import type { AppSetting } from "@/lib/types";

export interface ISettingsRepository {
  list(): Promise<AppSetting[]>;
  update(
    key: string,
    payload: { value: unknown; value_type?: string; description?: string },
  ): Promise<AppSetting>;
}
