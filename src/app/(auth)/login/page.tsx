import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Human CRM</h1>
          <p className="text-sm text-muted-foreground">
            Entre com o e-mail e senha da sua conta.
          </p>
        </div>
        <LoginForm next={next} />
      </div>
    </div>
  );
}
