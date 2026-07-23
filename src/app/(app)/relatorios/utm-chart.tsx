"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type UtmRow = {
  utm_source: string;
  quantidade: number;
  valor_total: number;
  quantidade_ganha: number;
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export function UtmChart({ data }: { data: UtmRow[] }) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum negócio com UTM registrado ainda.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tickFormatter={(v) => currency.format(v)} tick={{ fontSize: 12 }} />
        <YAxis
          dataKey="utm_source"
          type="category"
          width={100}
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          formatter={(value, name) =>
            name === "valor_total" ? currency.format(Number(value)) : value
          }
        />
        <Bar dataKey="valor_total" name="Valor total" fill="var(--color-chart-2)" />
      </BarChart>
    </ResponsiveContainer>
  );
}
