"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AuthGuard } from "@/presentation/components/auth/auth-guard";
import { Sidebar } from "@/presentation/components/layout/sidebar";
import { Topbar } from "@/presentation/components/layout/topbar";
import { realtimeService } from "@/presentation/services/realtime";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // BO realtime : ouvre la WS dès l'entrée dans le dashboard (l'AuthGuard a
  // déjà validé la session). Backend abonne automatiquement le staff au
  // channel `admin`. Reconnect avec backoff géré par le service.
  useEffect(() => {
    realtimeService.connect();
    return () => realtimeService.disconnect();
  }, []);

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        {/* Sidebar fixe (desktop) */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border lg:block">
          <Sidebar />
        </aside>

        {/* Tiroir mobile */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              aria-label="Fermer le menu"
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 w-64 border-r border-border shadow-pop animate-in slide-in-from-left">
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenuClick={() => setMobileOpen(true)} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
