"use client";

import { useState, useEffect } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/constants";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

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
  annualNIS: number;
  annualPAYE: number;
  annualNetPay: number;
}

// NIS pension eligibility: 750 contributions (roughly 62.5 years of continuous employment)
// In reality, you need to be 60+ with at least 750 weekly contributions
const NIS_PENSION_WEEKLY_CONTRIBUTIONS = 750;
const NIS_WEEKS_PER_YEAR = 52;

export function NISTracker() {
  const [data, setData] = useState<TaxSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [yearsWorked, setYearsWorked] = useState(5);

  useEffect(() => {
    fetch("/api/taxes/summary")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="py-8">
              <div className="h-8 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data?.hasProfile) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-4xl mb-4">🏛️</div>
          <h3 className="text-lg font-semibold mb-2">No Tax Profile Set Up</h3>
          <p className="text-muted-foreground text-center max-w-sm">
            Set up your salary details in the Salary Calculator tab to track NIS
            contributions.
          </p>
        </CardContent>
      </Card>
    );
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const nisCeiling = 280000;

  // Monthly NIS chart
  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    month: new Date(2026, i, 1).toLocaleString("default", { month: "short" }),
    contribution: i < currentMonth ? data.monthlyNIS : 0,
    projected: i >= currentMonth ? data.monthlyNIS : 0,
  }));

  // Pension eligibility
  const totalWeeklyContributions = yearsWorked * NIS_WEEKS_PER_YEAR;
  const pensionProgress = Math.min(
    (totalWeeklyContributions / NIS_PENSION_WEEKLY_CONTRIBUTIONS) * 100,
    100
  );
  const weeksRemaining = Math.max(
    0,
    NIS_PENSION_WEEKLY_CONTRIBUTIONS - totalWeeklyContributions
  );
  const yearsRemaining = (weeksRemaining / NIS_WEEKS_PER_YEAR).toFixed(1);

  return (
    <div className="space-y-6">
      {/* NIS Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Monthly NIS (5.6%)</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {formatCurrency(data.monthlyNIS)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Ceiling: {formatCurrency(nisCeiling)}/mo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Year-to-Date NIS</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {formatCurrency(data.ytdNIS)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {currentMonth} month{currentMonth > 1 ? "s" : ""} of contributions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Projected Annual NIS</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {formatCurrency(data.annualNIS || data.monthlyNIS * 12)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Employee portion (5.6%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Employer NIS (8.4%)</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {formatCurrency(
                Math.round((data.annualNIS || data.monthlyNIS * 12) * (8.4 / 5.6))
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Total NIS:{" "}
              {formatCurrency(
                Math.round(
                  (data.annualNIS || data.monthlyNIS * 12) * (1 + 8.4 / 5.6)
                )
              )}
              /yr
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Contributions Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Monthly NIS Contributions</CardTitle>
          <CardDescription>
            Tracking your {new Date().getFullYear()} NIS payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  className="text-xs"
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Bar
                  dataKey="contribution"
                  fill="hsl(var(--chart-1))"
                  name="Paid"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="projected"
                  fill="hsl(var(--chart-2))"
                  name="Projected"
                  radius={[4, 4, 0, 0]}
                  opacity={0.5}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Pension Eligibility */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🏖️ NIS Pension Eligibility</CardTitle>
          <CardDescription>
            Requires {NIS_PENSION_WEEKLY_CONTRIBUTIONS} weekly contributions (≈14.4 years) and age 60+
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Years of NIS Contributions
            </label>
            <input
              type="range"
              min={0}
              max={40}
              value={yearsWorked}
              onChange={(e) => setYearsWorked(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 years</span>
              <span className="font-medium text-foreground">
                {yearsWorked} years ({totalWeeklyContributions} weeks)
              </span>
              <span>40 years</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Pension Progress</span>
              <span className="font-medium tabular-nums">
                {pensionProgress.toFixed(0)}%
              </span>
            </div>
            <Progress value={pensionProgress} className="h-3" />
          </div>

          <div className="grid gap-3 sm:grid-cols-3 pt-2">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Contributions Made</p>
              <p className="text-lg font-bold tabular-nums">
                {totalWeeklyContributions}
              </p>
              <p className="text-[10px] text-muted-foreground">weekly contributions</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className="text-lg font-bold tabular-nums">
                {weeksRemaining}
              </p>
              <p className="text-[10px] text-muted-foreground">
                ≈ {yearsRemaining} years
              </p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Status</p>
              <div className="mt-1">
                {pensionProgress >= 100 ? (
                  <Badge className="bg-green-500">Eligible ✓</Badge>
                ) : pensionProgress >= 75 ? (
                  <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                    Almost There
                  </Badge>
                ) : (
                  <Badge variant="secondary">In Progress</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
