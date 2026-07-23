"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export function PipelineTabs({
  pipelines,
  currentId,
}: {
  pipelines: { id: string; nome: string }[];
  currentId: string;
}) {
  if (pipelines.length <= 1) return null;

  return (
    <div className="flex gap-1">
      {pipelines.map((pipeline) => (
        <Link
          key={pipeline.id}
          href={`/kanban/${pipeline.id}`}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium",
            pipeline.id === currentId
              ? "bg-secondary text-secondary-foreground"
              : "text-muted-foreground hover:bg-secondary/60"
          )}
        >
          {pipeline.nome}
        </Link>
      ))}
    </div>
  );
}
