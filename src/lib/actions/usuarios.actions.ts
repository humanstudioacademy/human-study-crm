"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import type { ActionState } from "@/lib/actions/pipelines.actions";

const inviteSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
  full_name: z.string().trim().min(1, "Informe o nome."),
  role: z.enum(["admin", "sales_rep"]),
});

export async function inviteUser(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    full_name: formData.get("full_name"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const admin = createAdminClient();

  const { error } = await admin.auth.admin.inviteUserByEmail(
    parsed.data.email,
    {
      redirectTo: `${siteUrl}/auth/callback`,
      data: {
        full_name: parsed.data.full_name,
        role: parsed.data.role,
      },
    }
  );

  if (error) {
    return {
      error:
        error.message === "User already registered"
          ? "Já existe uma conta com este e-mail."
          : "Não foi possível enviar o convite.",
    };
  }

  revalidatePath("/admin/usuarios");
  return { success: true };
}

const roleSchema = z.object({ role: z.enum(["admin", "sales_rep"]) });

export async function updateUserRole(userId: string, role: string) {
  await requireAdmin();
  const parsed = roleSchema.safeParse({ role });
  if (!parsed.success) return { error: "Papel inválido." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role: parsed.data.role })
    .eq("id", userId);

  if (error) return { error: "Não foi possível atualizar o papel." };

  revalidatePath("/admin/usuarios");
  return { success: true };
}

export async function toggleUserActive(userId: string, isActive: boolean) {
  const admin = await requireAdmin();
  if (admin.id === userId) {
    return { error: "Você não pode desativar a própria conta." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", userId);

  if (error) return { error: "Não foi possível atualizar o status." };

  revalidatePath("/admin/usuarios");
  return { success: true };
}
