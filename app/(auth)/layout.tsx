import type { ReactNode } from "react";
import { ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { Brand } from "@/presentation/components/layout/brand";
import { ThemeToggle } from "@/presentation/components/layout/theme-toggle";

const HIGHLIGHTS = [
  { icon: ShieldCheck, text: "Vérification KYC et conformité centralisées" },
  { icon: Wallet, text: "Pilotage des wallets et de la trésorerie plateforme" },
  { icon: Sparkles, text: "Tontines, prêts et épargne sous contrôle" },
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panneau de marque (desktop) */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-brand-gradient p-12 text-white lg:flex">
        <div className="absolute -right-24 -top-24 size-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 size-96 rounded-full bg-white/5 blur-3xl" />

        <Brand className="relative [&_span]:text-white [&_.text-muted]:text-white/70" />

        <div className="relative max-w-md space-y-6">
          <h2 className="text-3xl font-semibold leading-tight">
            Le poste de pilotage de la plateforme tontine Kwetche.
          </h2>
          <ul className="space-y-3">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-white/85">
                <span className="grid size-9 place-items-center rounded-lg bg-white/10">
                  <Icon className="size-5 text-primary" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-white/50">
          © {new Date().getFullYear()} Kwetche — Zone UEMOA · XOF
        </p>
      </aside>

      {/* Zone formulaire */}
      <main className="relative flex items-center justify-center p-6 sm:p-10">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Brand />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
