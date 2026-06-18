"use client";

import Link from "next/link";
import { LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/presentation/contexts/auth-context";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/presentation/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/presentation/components/ui/dropdown-menu";
import { ROUTES, ROLE_LABELS } from "@/lib/constants";
import { fullName, getInitials, resolveFileUrl } from "@/lib/utils/formatters";

export function UserMenu() {
  const { user, logout } = useAuth();
  if (!user) return null;

  const photo = resolveFileUrl(user.profile_photo);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none ring-ring transition focus-visible:ring-2">
        <Avatar className="size-9">
          {photo && <AvatarImage src={photo} alt="" />}
          <AvatarFallback>{getInitials(user.first_name, user.last_name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-foreground">
            {fullName(user.first_name, user.last_name)}
          </span>
          <span className="text-xs font-normal text-muted">
            {ROLE_LABELS[user.role] ?? user.role}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={ROUTES.PROFILE}>
            <UserIcon />
            Mon profil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            void logout();
          }}
          className="text-danger focus:bg-danger-soft [&_svg]:text-danger"
        >
          <LogOut />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
