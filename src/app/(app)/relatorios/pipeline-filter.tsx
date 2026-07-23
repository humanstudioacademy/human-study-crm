"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PipelineFilter({
  pipelines,
  currentId,
}: {
  pipelines: { id: string; nome: string }[];
  currentId?: string;
}) {
  const router = useRouter();

  if (pipelines.length <= 1) return null;

  return (
    <Select
      items={Object.fromEntries(pipelines.map((p) => [p.id, p.nome]))}
      value={currentId}
      onValueChange={(value) => {
        if (value) router.push(`/relatorios?pipelineId=${value}`);
      }}
    >
      <SelectTrigger className="w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {pipelines.map((pipeline) => (
          <SelectItem key={pipeline.id} value={pipeline.id}>
            {pipeline.nome}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
