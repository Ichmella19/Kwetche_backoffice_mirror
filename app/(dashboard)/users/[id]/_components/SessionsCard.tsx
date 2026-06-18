import { Button } from "@/presentation/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import { Skeleton } from "@/presentation/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils/formatters";
import type { UserSession } from "@/lib/types";

interface SessionsCardProps {
  sessions: UserSession[] | null;
  isLoading: boolean;
  onRevoke: (sessionId: string) => void;
  onRevokeAll: () => void;
  busySessionId: string | null;
  isRevokingAll: boolean;
}

export function SessionsCard({
  sessions,
  isLoading,
  onRevoke,
  onRevokeAll,
  busySessionId,
  isRevokingAll,
}: SessionsCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Sessions actives</CardTitle>
            <CardDescription>
              Appareils connectés à ce compte et révocation à distance.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRevokeAll}
            disabled={isLoading || !sessions?.length}
            isLoading={isRevokingAll}
          >
            Tout révoquer
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <Skeleton className="h-24 rounded-lg" />
        ) : !sessions?.length ? (
          <p className="text-sm text-muted">Aucune session active.</p>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium text-foreground">
                  {session.device_name || session.os || "Appareil inconnu"}
                </p>
                <p className="text-sm text-muted">
                  {session.device_ip || "IP inconnue"} ·{" "}
                  {session.app_version || "version inconnue"}
                </p>
                <p className="text-xs text-muted">
                  Dernière activité {formatDateTime(session.last_seen_at)}
                </p>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => onRevoke(session.id)}
                isLoading={busySessionId === session.id}
              >
                Révoquer
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
