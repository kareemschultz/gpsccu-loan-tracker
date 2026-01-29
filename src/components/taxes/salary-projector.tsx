"use client";

import { useState, useEffect } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/constants";
import { projectSalaryIncrease, type TaxInputs } from "@/lib/tax-calculator";
import { COMMON_SALARY_INCREASES, PAYMENT_FREQUENCIES } from "@/lib/tax-constants";
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, BarChart, Bar,
} from "recharts";

export function SalaryProjector() {
  const [inputs, setInputs] = useState<TaxInputs | null>(null);
  const [increasePercent, setIncreasePercent] = useState(8);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/taxes/profile")
      .then((r) => r.json())
      .then((profile) => {
        if (profile && profile.baseSalary) {
          setInputs({
            paymentFrequency: profile.paymentFrequency || "monthly",
            basicSalary: parseFloat(profile.baseSalary) || 0,
            taxableAllowances: parseFloat(profile.taxableAllowances || "0"),
            nonTaxableAllowances: parseFloat(profile.nonTaxableAllowances || "0"),
            vacationAllowance: parseFloat(profile.vacationAllowance || "0"),
            qualificationType: profile.qualificationType || "none",
            overtimeIncome: parseFloat(profile.overtimeIncome || "0"),
            secondJobIncome: parseFloat(profile.secondJobIncome || "0"),
            childCount: profile.childCount || 0,
            loanPayment: parseFloat(profile.loanPayment || "0"),
            creditUnionDeduction: parseFloat(profile.creditUnionDeduction || "0"),
            insuranceType: profile.insuranceType || "none",
            customInsurancePremium: parseFloat(profile.customInsurancePremium || "0"),
            gratuityRate: parseFloat(profile.gratuityRate || "22.5"),
            gratuityPeriod: 6,
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
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

  if (!inputs || inputs.basicSalary <= 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-4xl mb-4">📈</div>
          <h3 className="text-lg font-semibold mb-2">No Salary Profile</h3>
          <p className="text-muted-foreground text-center max-w-sm">
            Set up your salary details in the Salary Calculator tab first to
            project salary increases.
          </p>
        </CardContent>
      </Card>
    );
  }

  const projection = projectSalaryIncrease(inputs, increasePercent);
  const { current, projected, projections } = projection;
  const freq = PAYMENT_FREQUENCIES[inputs.paymentFrequency];

  const salaryDifference = projected.netPay - current.netPay;
  const annualDifference = projected.annualTotal - current.annualTotal;

  return (
    <div className="space-y-6">
      {/* Increase Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📈 Salary Increase Projector</CardTitle>
          <CardDescription>
            See how a salary increase affects your take-home pay
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Select Increase</Label>
              <Select
                value={String(increasePercent)}
                onValueChange={(v) => v && setIncreasePercent(parseFloat(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_SALARY_INCREASES.map((inc) => (
                    <SelectItem key={inc.value} value={String(inc.value)}>
                      {inc.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Custom Percentage (%)</Label>
              <Input
                type="number"
                value={increasePercent}
                onChange={(e) =>
                  setIncreasePercent(parseFloat(e.target.value) || 0)
                }
                min={0}
                max={100}
                step={0.5}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Current Net ({freq?.periodLabel})</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {formatCurrency(Math.round(current.netPay))}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-green-500/30">
          <CardHeader className="pb-2">
            <CardDescription>
              After +{increasePercent}% ({freq?.periodLabel})
            </CardDescription>
            <CardTitle className="text-2xl tabular-nums text-green-600 dark:text-green-400">
              {formatCurrency(Math.round(projected.netPay))}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-green-600 dark:text-green-400">
              +{formatCurrency(Math.round(salaryDifference))} {freq?.periodLabel}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Current Annual Total</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {formatCurrency(Math.round(current.annualTotal))}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-green-500/30">
          <CardHeader className="pb-2">
            <CardDescription>Projected Annual Total</CardDescription>
            <CardTitle className="text-2xl tabular-nums text-green-600 dark:text-green-400">
              {formatCurrency(Math.round(projected.annualTotal))}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-green-600 dark:text-green-400">
              +{formatCurrency(Math.round(annualDifference))}/yr
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Before/After Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Before vs. After Comparison</CardTitle>
          <CardDescription>
            Side-by-side breakdown with {increasePercent}% increase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium">Item</th>
                  <th className="text-right py-2 px-3 font-medium">Current</th>
                  <th className="text-right py-2 px-3 font-medium">
                    After +{increasePercent}%
                  </th>
                  <th className="text-right py-2 px-3 font-medium">
                    Difference
                  </th>
                </tr>
              </thead>
              <tbody>
                <ComparisonRow
                  label="Base Salary"
                  current={current.basicSalary}
                  projected={projected.basicSalary}
                />
                <ComparisonRow
                  label="Gross Income"
                  current={current.grossIncome}
                  projected={projected.grossIncome}
                />
                <ComparisonRow
                  label="NIS"
                  current={current.nisContribution}
                  projected={projected.nisContribution}
                  negative
                />
                <ComparisonRow
                  label="PAYE"
                  current={current.incomeTax}
                  projected={projected.incomeTax}
                  negative
                />
                <ComparisonRow
                  label="Net Pay"
                  current={current.netPay}
                  projected={projected.netPay}
                  highlight
                />
                <ComparisonRow
                  label="Effective Tax Rate"
                  current={current.effectiveTaxRate}
                  projected={projected.effectiveTaxRate}
                  isPercent
                />
                <ComparisonRow
                  label="Annual Net"
                  current={current.annualNetPay}
                  projected={projected.annualNetPay}
                  highlight
                />
                <ComparisonRow
                  label="Annual Total (incl. gratuity)"
                  current={current.annualTotal}
                  projected={projected.annualTotal}
                  highlight
                  bold
                />
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Projection Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">12-Month Take-Home Projection</CardTitle>
          <CardDescription>
            Monthly net pay after +{increasePercent}% increase (including gratuity months)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projections}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" className="text-xs" />
                <YAxis
                  tickFormatter={(v) =>
                    v >= 1000000
                      ? `${(v / 1000000).toFixed(1)}M`
                      : `${(v / 1000).toFixed(0)}k`
                  }
                  className="text-xs"
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatCurrency(Math.round(value)),
                    name,
                  ]}
                />
                <Legend />
                <Bar
                  dataKey="netPay"
                  name="Net Pay"
                  fill="hsl(var(--chart-1))"
                  radius={[4, 4, 0, 0]}
                  stackId="a"
                />
                <Bar
                  dataKey="gratuityAmount"
                  name="Gratuity/Vacation"
                  fill="hsl(var(--chart-5))"
                  radius={[4, 4, 0, 0]}
                  stackId="a"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ComparisonRow({
  label,
  current,
  projected,
  negative,
  highlight,
  bold,
  isPercent,
}: {
  label: string;
  current: number;
  projected: number;
  negative?: boolean;
  highlight?: boolean;
  bold?: boolean;
  isPercent?: boolean;
}) {
  const diff = projected - current;
  const fmt = isPercent
    ? (v: number) => `${v.toFixed(1)}%`
    : (v: number) => formatCurrency(Math.round(v));

  return (
    <tr className={`border-b last:border-0 ${highlight ? "bg-muted/30" : ""}`}>
      <td className={`py-2 px-3 ${bold ? "font-semibold" : ""}`}>{label}</td>
      <td className="py-2 px-3 text-right tabular-nums">{fmt(current)}</td>
      <td className="py-2 px-3 text-right tabular-nums font-medium">
        {fmt(projected)}
      </td>
      <td
        className={`py-2 px-3 text-right tabular-nums font-medium ${
          diff > 0
            ? negative
              ? "text-red-600"
              : "text-green-600 dark:text-green-400"
            : diff < 0
              ? "text-red-600"
              : ""
        }`}
      >
        {diff > 0 ? "+" : ""}
        {fmt(diff)}
      </td>
    </tr>
  );
}
