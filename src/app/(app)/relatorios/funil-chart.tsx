"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type FunilRow = {
  etapa_nome: string;
  quantidade: number;
  quantidade_parada: number;
};

export function FunilChart({ data }: { data: FunilRow[] }) {
  const chartData = data.map((row) => ({
    etapa: row.etapa_nome,
    avancando: row.quantidade - row.quantidade_parada,
    parado: row.quantidade_parada,
  }));

  if (chartData.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Sem etapas ou negócios para exibir.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="etapa" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Bar
          dataKey="avancando"
          name="Avançando"
          stackId="a"
          fill="var(--color-chart-1)"
        />
        <Bar
          dataKey="parado"
          name="Parado (7d+)"
          stackId="a"
          fill="var(--color-chart-4)"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
