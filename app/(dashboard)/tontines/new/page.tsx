"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/presentation/components/shared/page-header";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent } from "@/presentation/components/ui/card";
import { FieldWithInfo } from "@/presentation/components/ui/field-with-info";
import { Input } from "@/presentation/components/ui/input";
import { Select } from "@/presentation/components/ui/select";
import { Textarea } from "@/presentation/components/ui/textarea";
import { useToast } from "@/presentation/hooks";
import { tontineService } from "@/presentation/services/tontine";
import { ROUTES } from "@/lib/constants";
import {
  TONTINE_DRAW_MODE_LABELS,
  TONTINE_FREQUENCY_LABELS,
  TONTINE_TYPE_LABELS,
  TontineDrawMode,
  TontineFrequency,
  TontineType,
} from "@/lib/enums";
import { getErrorMessage } from "@/lib/utils/helpers";
import type { CreateTontineInput } from "@/lib/types";

const initial: CreateTontineInput = {
  name: "",
  type: TontineType.ROTATING,
  draw_mode: TontineDrawMode.REVEALED,
  contribution_amount: 0,
  frequency: TontineFrequency.MONTHLY,
  max_members: 10,
  total_rounds: null,
  start_date: null,
  commission_rate: 0,
  required_kyc_level: 1,
  caution_amount: 0,
  cancellation_window_days: 3,
  cancellation_penalty_rate: 0,
  platform_takes_first_round: true,
  loyalty_bonus_enabled: false,
  loyalty_bonus_rate: 0,
  description: null,
};

export default function NewTontinePage() {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<CreateTontineInput>(initial);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof CreateTontineInput>(
    key: K,
    value: CreateTontineInput[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    if (form.name.trim().length < 2) {
      toast.error("Nom requis", "Donnez un nom à la tontine.");
      return;
    }
    if (form.contribution_amount <= 0 || form.max_members <= 0) {
      toast.error("Valeurs invalides", "Montants et membres doivent être > 0.");
      return;
    }
    setBusy(true);
    try {
      const created = await tontineService.create(form);
      toast.success("Tontine créée.");
      router.push(`${ROUTES.TONTINES}/${created.id}`);
    } catch (err) {
      toast.error("Échec création", getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouvelle tontine"
        description="Configurez la tontine avant de l'ouvrir aux inscriptions."
      />

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
          <FieldWithInfo
            label="Nom"
            htmlFor="t-name"
            required
            info="Nom commercial de la tontine, affiché aux candidats dans le catalogue. Court et reconnaissable (ex. « Tontine Rentrée Scolaire 2026 »)."
          >
            <Input
              id="t-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </FieldWithInfo>

          <FieldWithInfo
            label="Type"
            htmlFor="t-type"
            required
            info={
              <>
                <strong>Cagnotte tournante</strong> : un bénéficiaire par tour
                (ROSCA classique). <br />
                <strong>Épargne collective</strong> : chaque membre épargne
                pour lui-même, payout à maturité.
              </>
            }
          >
            <Select
              id="t-type"
              value={form.type}
              options={Object.values(TontineType).map((v) => ({
                value: v,
                label: TONTINE_TYPE_LABELS[v] ?? v,
              }))}
              onChange={(e) => set("type", e.target.value)}
            />
          </FieldWithInfo>

          <FieldWithInfo
            label="Mode de tirage"
            htmlFor="t-draw"
            required
            info={
              <>
                <strong>Ordre révélé</strong> : l&apos;ordre des bénéficiaires
                est affiché dès l&apos;ouverture des inscriptions. <br />
                <strong>Aléatoire à chaque tour</strong> : le gagnant de chaque
                cycle est tiré au sort parmi les non-encore-servis.
              </>
            }
          >
            <Select
              id="t-draw"
              value={form.draw_mode}
              options={Object.values(TontineDrawMode).map((v) => ({
                value: v,
                label: TONTINE_DRAW_MODE_LABELS[v] ?? v,
              }))}
              onChange={(e) => set("draw_mode", e.target.value)}
            />
          </FieldWithInfo>

          <FieldWithInfo
            label="Fréquence"
            htmlFor="t-freq"
            required
            info="Cadence des cycles. Détermine quand chaque cotisation est prélevée et quand chaque cagnotte est versée."
          >
            <Select
              id="t-freq"
              value={form.frequency}
              options={Object.values(TontineFrequency).map((v) => ({
                value: v,
                label: TONTINE_FREQUENCY_LABELS[v] ?? v,
              }))}
              onChange={(e) => set("frequency", e.target.value)}
            />
          </FieldWithInfo>

          <FieldWithInfo
            label="Cotisation (XOF)"
            htmlFor="t-amount"
            required
            info="Montant que chaque membre doit verser à chaque cycle. À l'inscription, la 1ère cotisation est prélevée immédiatement (escrow plateforme)."
          >
            <Input
              id="t-amount"
              type="number"
              min={1}
              value={form.contribution_amount || ""}
              onChange={(e) =>
                set("contribution_amount", Number(e.target.value) || 0)
              }
            />
          </FieldWithInfo>

          <FieldWithInfo
            label="Caution (XOF)"
            htmlFor="t-caution"
            info="Somme bloquée sur le wallet de chaque membre à l'inscription (en plus de la 1ère cotisation). Restituée à la clôture ou retenue partiellement en cas de désistement tardif. Mettre 0 pour aucune caution."
          >
            <Input
              id="t-caution"
              type="number"
              min={0}
              value={form.caution_amount || ""}
              onChange={(e) =>
                set("caution_amount", Number(e.target.value) || 0)
              }
            />
          </FieldWithInfo>

          <FieldWithInfo
            label="Nombre de membres max"
            htmlFor="t-max"
            required
            info="Quota cible. Inscription en mode « premier arrivé, premier servi ». Au démarrage, si le quota n'est pas atteint, la tontine bascule dans la file BO « à démarrer »."
          >
            <Input
              id="t-max"
              type="number"
              min={2}
              value={form.max_members || ""}
              onChange={(e) => set("max_members", Number(e.target.value) || 0)}
            />
          </FieldWithInfo>

          <FieldWithInfo
            label="Nombre de tours"
            htmlFor="t-rounds"
            info="Pour les tontines d'épargne, nombre de cycles de cotisation. Pour les rotatives, laisser à 0 : le système le dérive automatiquement (N membres → N+1 tours dont le 1er pour la plateforme)."
          >
            <Input
              id="t-rounds"
              type="number"
              min={0}
              value={form.total_rounds ?? 0}
              onChange={(e) =>
                set("total_rounds", Number(e.target.value) || 0)
              }
            />
          </FieldWithInfo>

          <FieldWithInfo
            label="Date de démarrage"
            htmlFor="t-start"
            info="Date prévue de démarrage. Si le quota est atteint à cette date, démarrage automatique. Sinon la tontine bascule dans la file « à démarrer » (BO) où l'agent décide : démarrer / reporter / annuler."
          >
            <Input
              id="t-start"
              type="date"
              value={form.start_date ?? ""}
              onChange={(e) => set("start_date", e.target.value || null)}
            />
          </FieldWithInfo>

          <FieldWithInfo
            label="Commission (%)"
            htmlFor="t-commission"
            info="Pourcentage retenu par la plateforme sur chaque cagnotte versée. La commission alimente le fond de réserve de la tontine."
          >
            <Input
              id="t-commission"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={form.commission_rate || ""}
              onChange={(e) =>
                set("commission_rate", Number(e.target.value) || 0)
              }
            />
          </FieldWithInfo>

          <FieldWithInfo
            label="KYC requis (niveau)"
            htmlFor="t-kyc"
            info="Niveau KYC minimum pour pouvoir s'inscrire. 1 = identité vérifiée (par défaut), 2 = revenus structurés, 3 = banque/Mobile Money/garant validés. Utiliser 2+ pour les tontines à gros montants."
          >
            <Input
              id="t-kyc"
              type="number"
              min={0}
              max={3}
              value={form.required_kyc_level}
              onChange={(e) =>
                set("required_kyc_level", Number(e.target.value) || 0)
              }
            />
          </FieldWithInfo>

          <FieldWithInfo
            label="Fenêtre de désistement (jours)"
            htmlFor="t-cwin"
            info="Nombre de jours avant la date de démarrage à partir duquel un désistement est considéré « tardif » et déclenche une pénalité sur la caution. En dehors de la fenêtre, la caution est intégralement restituée."
          >
            <Input
              id="t-cwin"
              type="number"
              min={0}
              value={form.cancellation_window_days}
              onChange={(e) =>
                set("cancellation_window_days", Number(e.target.value) || 0)
              }
            />
          </FieldWithInfo>

          <FieldWithInfo
            label="Pénalité désistement (%)"
            htmlFor="t-cpen"
            info="Pourcentage de la caution retenu (versé au fond de réserve) lorsqu'un membre se désiste à l'intérieur de la fenêtre de désistement. 0 % = pas de pénalité."
          >
            <Input
              id="t-cpen"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={form.cancellation_penalty_rate || ""}
              onChange={(e) =>
                set("cancellation_penalty_rate", Number(e.target.value) || 0)
              }
            />
          </FieldWithInfo>

          <FieldWithInfo
            label="Plateforme prend le 1er tour"
            htmlFor="t-firstround"
            info="Si « Oui » (recommandé en rotative), la cagnotte du 1er cycle est versée au fond de réserve de la tontine — sert de filet de sécurité pour absorber les impayés futurs. Aucune information n'est donnée aux participants sur ce fond (règle interne)."
          >
            <Select
              id="t-firstround"
              value={form.platform_takes_first_round ? "true" : "false"}
              options={[
                { value: "true", label: "Oui" },
                { value: "false", label: "Non" },
              ]}
              onChange={(e) =>
                set("platform_takes_first_round", e.target.value === "true")
              }
            />
          </FieldWithInfo>

          <FieldWithInfo
            label="Bonus de fidélité activé"
            htmlFor="t-bonus"
            info="Récompense distribuée à la clôture aux bénéficiaires de la 2ème moitié des tours (du rang médian au dernier), pondérée croissante : le dernier servi reçoit la plus grosse part. Incite à tenir jusqu'au bout."
          >
            <Select
              id="t-bonus"
              value={form.loyalty_bonus_enabled ? "true" : "false"}
              options={[
                { value: "false", label: "Non" },
                { value: "true", label: "Oui" },
              ]}
              onChange={(e) =>
                set("loyalty_bonus_enabled", e.target.value === "true")
              }
            />
          </FieldWithInfo>

          <FieldWithInfo
            label="Taux bonus (% du fond de réserve)"
            htmlFor="t-bonus-rate"
            info="Pourcentage du fond de réserve à distribuer en bonus de fidélité à la clôture. Ignoré si le bonus n'est pas activé."
          >
            <Input
              id="t-bonus-rate"
              type="number"
              min={0}
              max={100}
              step={0.1}
              disabled={!form.loyalty_bonus_enabled}
              value={form.loyalty_bonus_rate || ""}
              onChange={(e) =>
                set("loyalty_bonus_rate", Number(e.target.value) || 0)
              }
            />
          </FieldWithInfo>

          <div className="sm:col-span-2">
            <FieldWithInfo
              label="Description"
              htmlFor="t-desc"
              info="Texte libre affiché dans le catalogue. Sert à donner du contexte (objectif, public cible, conditions particulières)."
            >
              <Textarea
                id="t-desc"
                value={form.description ?? ""}
                onChange={(e) => set("description", e.target.value || null)}
                maxLength={1000}
              />
            </FieldWithInfo>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => router.push(ROUTES.TONTINES)}>
          Annuler
        </Button>
        <Button isLoading={busy} onClick={submit}>
          Créer
        </Button>
      </div>
    </div>
  );
}
