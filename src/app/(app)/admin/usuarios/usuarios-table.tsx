"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toggleUserActive, updateUserRole } from "@/lib/actions/usuarios.actions";
import type { Tables } from "@/lib/types/database.types";

type Profile = Tables<"profiles">;

export function UsuariosTable({
  usuarios,
  currentUserId,
}: {
  usuarios: Profile[];
  currentUserId: string;
}) {
  const [, startTransition] = useTransition();

  function handleRoleChange(userId: string, role: string | null) {
    if (!role) return;
    startTransition(async () => {
      const result = await updateUserRole(userId, role);
      if (result?.error) toast.error(result.error);
    });
  }

  function handleToggleActive(userId: string, isActive: boolean) {
    startTransition(async () => {
      const result = await toggleUserActive(userId, isActive);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>E-mail</TableHead>
          <TableHead>Papel</TableHead>
          <TableHead>Status</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {usuarios.map((usuario) => (
          <TableRow key={usuario.id}>
            <TableCell className="font-medium">
              {usuario.full_name}
              {usuario.id === currentUserId && (
                <Badge variant="secondary" className="ml-2">
                  Você
                </Badge>
              )}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {usuario.email}
            </TableCell>
            <TableCell>
              <Select
                items={{ sales_rep: "Comercial", admin: "Administrador" }}
                defaultValue={usuario.role}
                onValueChange={(value) => handleRoleChange(usuario.id, value)}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales_rep">Comercial</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <Badge variant={usuario.is_active ? "secondary" : "outline"}>
                {usuario.is_active ? "Ativo" : "Inativo"}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="sm"
                disabled={usuario.id === currentUserId}
                onClick={() =>
                  handleToggleActive(usuario.id, !usuario.is_active)
                }
              >
                {usuario.is_active ? "Desativar" : "Ativar"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
