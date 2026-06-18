/**
 * Type de valeur d'un paramètre applicatif (cast côté API).
 * Miroir de `app_settings.value_type` (str | int | float | bool).
 */

export enum SettingValueType {
  STRING = "str",
  INT = "int",
  FLOAT = "float",
  BOOL = "bool",
}
