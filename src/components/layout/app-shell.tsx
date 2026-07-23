import Link from "next/link";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLinks, type NavLink } from "@/components/layout/nav-links";
import { logout } from "@/lib/actions/auth.actions";
import type { CurrentUser } from "@/lib/auth/getSession";

const BASE_LINKS: NavLink[] = [
  { href: "/kanban", label: "Kanban" },
  { href: "/clientes", label: "Clientes" },
  { href: "/relatorios", label: "Relatórios" },
];

const ADMIN_LINKS: NavLink[] = [
  { href: "/admin/pipelines", label: "Pipelines" },
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/usuarios", label: "Usuários" },
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
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r bg-muted/20 p-4">
        <Link href="/kanban" className="mb-6 px-3 text-lg font-semibold">
          Human CRM
        </Link>
        <NavLinks links={links} className="flex-1" />
        <div className="border-t pt-4">
          <div className="mb-2 px-3">
            <p className="truncate text-sm font-medium">
              {user.profile.full_name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user.profile.role === "admin" ? "Administrador" : "Comercial"}
            </p>
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
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
