import Link from "next/link";
import {
  Kanban,
  Users,
  BarChart3,
  GitBranch,
  Package,
  UserCog,
  FileText,
  CalendarDays,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { NavLinks, type NavLink } from "@/components/layout/nav-links";
import { logout } from "@/lib/actions/auth.actions";
import type { CurrentUser } from "@/lib/auth/getSession";

const iconClass = "size-4 shrink-0";

const BASE_LINKS: NavLink[] = [
  { href: "/kanban", label: "Kanban", icon: <Kanban className={iconClass} /> },
  { href: "/clientes", label: "Clientes", icon: <Users className={iconClass} /> },
  {
    href: "/agenda",
    label: "Agenda",
    icon: <CalendarDays className={iconClass} />,
  },
  {
    href: "/relatorios",
    label: "Relatórios",
    icon: <BarChart3 className={iconClass} />,
  },
];

const ADMIN_LINKS: NavLink[] = [
  {
    href: "/admin/pipelines",
    label: "Pipelines",
    icon: <GitBranch className={iconClass} />,
  },
  {
    href: "/admin/produtos",
    label: "Produtos",
    icon: <Package className={iconClass} />,
  },
  {
    href: "/admin/usuarios",
    label: "Usuários",
    icon: <UserCog className={iconClass} />,
  },
  {
    href: "/admin/formularios",
    label: "Formulários",
    icon: <FileText className={iconClass} />,
  },
];

export function AppShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  const links =
    user.profile.role === "admin" ? [...BASE_LINKS, ...ADMIN_LINKS] : BASE_LINKS;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="flex w-64 shrink-0 flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar p-4">
        <Link href="/kanban" className="mb-6 flex items-center gap-2 px-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-[oklch(0.62_0.19_293)] to-[oklch(0.65_0.2_330)] text-sm font-bold text-white">
            H
          </span>
          <span className="text-lg font-semibold tracking-tight text-sidebar-foreground">
            Human CRM
          </span>
        </Link>
        <NavLinks links={links} className="flex-1" />
        <div className="border-t border-sidebar-border pt-4">
          <div className="mb-2 flex items-center gap-2 px-2">
            <UserAvatar name={user.profile.full_name} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {user.profile.full_name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user.profile.role === "admin" ? "Administrador" : "Comercial"}
              </p>
            </div>
          </div>
          <form action={logout}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground"
            >
              <LogOut className="size-4" />
              Sair
            </Button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  );
}
