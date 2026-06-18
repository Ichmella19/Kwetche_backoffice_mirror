import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants";

export default function Home() {
  // L'AuthGuard du groupe (dashboard) renverra vers /login si pas de session.
  redirect(ROUTES.DASHBOARD);
}
