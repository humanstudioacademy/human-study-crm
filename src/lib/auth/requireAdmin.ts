import "server-only";
import { redirect } from "next/navigation";
import { requireUser, type CurrentUser } from "@/lib/auth/getSession";

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.profile.role !== "admin") redirect("/kanban");
  return user;
}
