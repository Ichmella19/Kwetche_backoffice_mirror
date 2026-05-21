import type { SettingValueType } from "@/lib/enums";

export interface AppSetting {
  id: string;
  key: string;
  value: string | number | boolean;
  value_type: SettingValueType | string;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
}
