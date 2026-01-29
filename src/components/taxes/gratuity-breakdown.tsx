"use client";

import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/constants";
import type { TaxResults } from "@/lib/tax-calculator";

interface Props {
  results: TaxResults;
}

export function GratuityBreakdown({ results }: Props) {
  const months = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const isGratuityMonth = m === 6 || m === 12;
    const isVacationMonth = m === 12;

    const net = results.monthlyNetPay;
    const gratuity = isGratuityMonth ? results.sixMonthGratuity : 0;
    const vacation = isVacationMonth ? results.vacationAllowance : 0;
    const total = net + gratuity + vacation;

    return {
      month: m,
      label: new Date(2026, i, 1).toLocaleString("default", { month: "short" }),
      net: Math.round(net),
      gratuity: Math.round(gratuity),
      vacation: Math.round(vacation),
      total: Math.round(total),
      isGratuityMonth,
      isVacationMonth,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">🎁 Gratuity & Package Calendar</CardTitle>
        <CardDescription>
          Monthly take-home with gratuity (months 6 & 12) and vacation pay
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {months.map((m) => (
            <div
              key={m.month}
              className={`p-3 rounded-lg border ${
                m.isGratuityMonth
                  ? "border-primary/50 bg-primary/5"
                  : "border-muted"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">{m.label}</span>
                <div className="flex gap-1">
                  {m.isGratuityMonth && (
                    <Badge variant="default" className="text-[10px]">
                      Gratuity
                    </Badge>
                  )}
                  {m.isVacationMonth && (
                    <Badge variant="secondary" className="text-[10px]">
                      Vacation
                    </Badge>
                  )}
                </div>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Net Pay</span>
                  <span className="tabular-nums">{formatCurrency(m.net)}</span>
                </div>
                {m.gratuity > 0 && (
                  <div className="flex justify-between text-primary">
                    <span>Gratuity</span>
                    <span className="tabular-nums font-medium">
                      +{formatCurrency(m.gratuity)}
                    </span>
                  </div>
                )}
                {m.vacation > 0 && (
                  <div className="flex justify-between text-blue-600 dark:text-blue-400">
                    <span>Vacation</span>
                    <span className="tabular-nums font-medium">
                      +{formatCurrency(m.vacation)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-1 font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums text-green-600 dark:text-green-400">
                    {formatCurrency(m.total)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Package Summary */}
        <div className="mt-4 grid gap-4 sm:grid-cols-3 pt-4 border-t">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Month 6 Package</p>
            <p className="text-lg font-bold tabular-nums text-green-600 dark:text-green-400">
              {formatCurrency(Math.round(results.monthSixTotal))}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Net + Gratuity
            </p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Month 12 Package</p>
            <p className="text-lg font-bold tabular-nums text-green-600 dark:text-green-400">
              {formatCurrency(Math.round(results.monthTwelveTotal))}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Net + Gratuity + Vacation
            </p>
          </div>
          <div className="text-center p-3 bg-primary/10 rounded-lg">
            <p className="text-xs text-muted-foreground">Annual Total</p>
            <p className="text-lg font-bold tabular-nums text-primary">
              {formatCurrency(Math.round(results.annualTotal))}
            </p>
            <p className="text-[10px] text-muted-foreground">
              All net pay + gratuities + vacation
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
