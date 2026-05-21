"use client";

import { useState } from "react";
import { Lock, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/presentation/components/shared/page-header";
import { ErrorState } from "@/presentation/components/shared/error";
import { EmptyState } from "@/presentation/components/shared/empty-state";
import { Card } from "@/presentation/components/ui/card";
import { Input } from "@/presentation/components/ui/input";
import { Select } from "@/presentation/components/ui/select";
import { Button } from "@/presentation/components/ui/button";
import { Badge } from "@/presentation/components/ui/badge";
import { Skeleton } from "@/presentation/components/ui/skeleton";
import { useAsync, useToast } from "@/presentation/hooks";
import { useAuth } from "@/presentation/contexts/auth-context";
import { settingsService } from "@/presentation/services/settings";
import { Grant, SettingValueType } from "@/lib/enums";
import { SETTING_LABELS } from "@/lib/constants";
import { getErrorMessage } from "@/lib/utils/helpers";
import type { AppSetting } from "@/lib/types";

const BOOL_OPTIONS = [
  { value: "true", label: "Activé" },
  { value: "false", label: "Désactivé" },
];

function SettingRow({
  setting,
  canEdit,
  onSaved,
}: {
  setting: AppSetting;
  canEdit: boolean;
  onSaved: (updated: AppSetting) => void;
}) {
  const toast = useToast();
  const [value, setValue] = useState(String(setting.value));
  const [saving, setSaving] = useState(false);

  const isBool = setting.value_type === SettingValueType.BOOL;
  const isNumber =
    setting.value_type === SettingValueType.INT ||
    setting.value_type === SettingValueType.FLOAT;
  const dirty = value !== String(setting.value);

  const save = async () => {
    setSaving(true);
    try {
      const parsed: unknown = isBool
        ? value === "true"
        : isNumber
          ? Number(value)
          : value;
      const updated = await settingsService.update(setting.key, parsed, setting.value_type);
      onSaved(updated);
      setValue(String(updated.value));
      toast.success("Paramètre enregistré", SETTING_LABELS[setting.key] ?? setting.key);
    } catch (err) {
      toast.error("Enregistrement impossible", getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground">
            {SETTING_LABELS[setting.key] ?? setting.key}
          </p>
          <Badge variant="neutral" className="font-mono">{setting.key}</Badge>
        </div>
        {setting.description && <p className="text-sm text-muted">{setting.description}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:w-72">
        {isBool ? (
          <Select
            options={BOOL_OPTIONS}
            value={value}
            disabled={!canEdit || saving}
            onChange={(e) => setValue(e.target.value)}
          />
        ) : (
          <Input
            type={isNumber ? "number" : "text"}
            value={value}
            disabled={!canEdit || saving}
            onChange={(e) => setValue(e.target.value)}
          />
        )}
        {canEdit && (
          <Button size="sm" onClick={save} isLoading={saving} disabled={!dirty}>
            Enregistrer
          </Button>
        )}
      </div>
    </Card>
  );
}

export default function SettingsPage() {
  const { hasGrant } = useAuth();
  const canEdit = hasGrant(Grant.SETTINGS_WRITE);
  const { data, isLoading, error, execute, setData } = useAsync<AppSetting[]>(() =>
    settingsService.list(),
  );

  const handleSaved = (updated: AppSetting) => {
    if (!data) return;
    setData(data.map((s) => (s.key === updated.key ? updated : s)));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paramètres de la plateforme"
        description="Réglages applicatifs (OTP, KYC, uploads). Modifiables à chaud."
        actions={
          !canEdit ? (
            <Badge variant="warning" className="gap-1">
              <Lock className="size-3" /> Lecture seule
            </Badge>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => execute()} />
      ) : !data || data.length === 0 ? (
        <EmptyState icon={SlidersHorizontal} title="Aucun paramètre" />
      ) : (
        <div className="space-y-3">
          {data.map((setting) => (
            <SettingRow
              key={setting.key}
              setting={setting}
              canEdit={canEdit}
              onSaved={handleSaved}
            />
          ))}
        </div>
      )}
    </div>
  );
}
