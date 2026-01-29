"use client";

import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/constants";
import type { TaxResults } from "@/lib/tax-calculator";
import {
  ResponsiveContainer, Cell, PieChart, Pie, Tooltip,
} from "recharts";

interface Props {
  results: TaxResults;
}

export function NetPayChart({ results }: Props) {
  const pieData = [
    {
      name: "Net Pay",
      value: Math.round(results.netPay),
      fill: "#22c55e",
    },
    {
      name: "NIS",
      value: Math.round(results.nisContribution),
      fill: "#3b82f6",
    },
    {
      name: "PAYE",
      value: Math.round(results.incomeTax),
      fill: "#ef4444",
    },
    {
      name: "Loan/CU",
      value: Math.round(results.loanPayment + results.creditUnionDeduction),
      fill: "#f59e0b",
    },
  ].filter((d) => d.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Pay Breakdown</CardTitle>
        <CardDescription>
          Visual breakdown of your {results.frequencyConfig.periodLabel} pay
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Pie Chart */}
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: item.fill }}
                />
                <span className="text-muted-foreground">{item.name}:</span>
                <span className="font-medium tabular-nums">
                  {formatCurrency(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
