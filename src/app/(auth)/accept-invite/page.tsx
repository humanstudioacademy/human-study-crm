import { AcceptInviteForm } from "./accept-invite-form";

export default function AcceptInvitePage() {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Bem-vindo(a) ao Human CRM
          </h1>
          <p className="text-sm text-muted-foreground">
            Defina sua senha para acessar sua conta.
          </p>
        </div>
        <AcceptInviteForm />
      </div>
    </div>
  );
}
