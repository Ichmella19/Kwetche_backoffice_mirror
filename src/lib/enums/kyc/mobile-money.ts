/**
 * Opérateurs Mobile Money (KYC niveau 3).
 * Miroir de `app/commons/enums/mobile_money/mobile_money_provider.py`.
 */

export enum MobileMoneyProvider {
  MTN = "mtn",
  MOOV = "moov",
  CELTIIS = "celtiis",
}

export const MOBILE_MONEY_PROVIDER_LABELS: Record<string, string> = {
  [MobileMoneyProvider.MTN]: "MTN Mobile Money",
  [MobileMoneyProvider.MOOV]: "Moov Africa Money",
  [MobileMoneyProvider.CELTIIS]: "Celtiis Cash",
};

export const mobileMoneyProviderLabel = (
  value: string | null | undefined,
): string | null =>
  value ? (MOBILE_MONEY_PROVIDER_LABELS[value] ?? value) : null;
