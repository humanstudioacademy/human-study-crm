import { useEffect } from "react";

type WithSuccess = { success?: boolean } | undefined;

// Fecha um diálogo quando uma Server Action (useActionState) resolve com sucesso.
// React Compiler ainda não está habilitado neste projeto (reactCompiler: false em
// next.config.ts), então setState num efeito aqui é seguro — só dispara uma vez,
// quando `state` muda de fato. Centralizado num único lugar para não espalhar o
// eslint-disable do react-hooks/set-state-in-effect pelo app inteiro.
export function useCloseOnSuccess(state: WithSuccess, onSuccess: () => void) {
  useEffect(() => {
    if (state?.success) {
      onSuccess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onSuccess é recriado a cada render; reagimos só a `state`
  }, [state]);
}
