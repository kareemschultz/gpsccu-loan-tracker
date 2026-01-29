"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button-variants";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/constants";

interface TaxSummary {
  hasProfile: boolean;
  monthlyNIS: number;
  monthlyPAYE: number;
  ytdNIS: number;
  ytdPAYE: number;
  ytdTotalTax: number;
  effectiveTaxRate: number;
  monthlyNetPay: number;
  monthlyGrossIncome: number;
  annualNIS?: number;
  annualPAYE?: number;
  annualNetPay?: number;
  annualTotal?: number;
}

export function TaxDashboardWidget() {
  const [data, setData] = useState<TaxSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/taxes/summary")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="h-8 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!data?.hasProfile) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">🇬🇾 Tax Summary</CardTitle>
          <CardDescription>Track your tax deductions</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-4">
          <p className="text-sm text-muted-foreground text-center mb-3">
            Set up your salary profile to see tax deductions
          </p>
          <Link
            href="/taxes"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Set Up Tax Profile →
          </Link>
        </CardContent>
      </Card>
    );
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const ytdProgress = (currentMonth / 12) * 100;
  const projectedAnnualTax = data.ytdTotalTax > 0
    ? (data.ytdTotalTax / currentMonth) * 12
    : (data.monthlyNIS + data.monthlyPAYE) * 12;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">🇬🇾 Tax Summary</CardTitle>
            <CardDescription>
              Monthly deductions &amp; YTD tax paid
            </CardDescription>
          </div>
          <Link
            href="/taxes"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Details →
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Monthly Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">NIS (Monthly)</p>
            <p className="text-lg font-bold tabular-nums">
              {formatCurrency(data.monthlyNIS)}
            </p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">PAYE (Monthly)</p>
            <p className="text-lg font-bold tabular-nums">
              {formatCurrency(data.monthlyPAYE)}
            </p>
          </div>
        </div>

        {/* YTD */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">YTD Tax Paid</span>
            <span className="font-semibold tabular-nums text-red-600 dark:text-red-400">
              {formatCurrency(data.ytdTotalTax)}
            </span>
          </div>
          <Progress value={ytdProgress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{currentMonth}/12 months</span>
            <span>
              Projected: {formatCurrency(Math.round(projectedAnnualTax))}
            </span>
          </div>
        </div>

        {/* Effective Rate & Net */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Effective Tax Rate</p>
            <p className="text-sm font-semibold">
              {data.effectiveTaxRate.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Monthly Net Pay</p>
            <p className="text-sm font-semibold text-green-600 dark:text-green-400 tabular-nums">
              {formatCurrency(data.monthlyNetPay)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
