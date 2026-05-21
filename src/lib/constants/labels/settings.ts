/** Libellés des clés de paramètres applicatifs connues. */
export const SETTING_LABELS: Record<string, string> = {
  min_age: "Âge minimum à l'inscription",
  otp_ttl_minutes: "Validité d'un code OTP (minutes)",
  reset_ttl_minutes: "Validité d'un code de réinitialisation (minutes)",
  otp_length: "Longueur du code OTP",
  resend_cooldown_seconds: "Délai anti-renvoi (secondes)",
  kyc_required_for_wallet: "KYC requis pour accéder au wallet",
  upload_photo_max_bytes: "Taille max d'une photo (octets)",
  upload_photo_allowed_ext: "Extensions photo autorisées",
  upload_doc_max_bytes: "Taille max d'un document (octets)",
  upload_doc_allowed_ext: "Extensions document autorisées",
};
