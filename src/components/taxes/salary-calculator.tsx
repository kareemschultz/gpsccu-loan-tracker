"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/constants";
import { calculateTax, type TaxInputs, type TaxResults } from "@/lib/tax-calculator";
import {
  POSITION_PRESETS,
  PAYMENT_FREQUENCIES,
  INSURANCE_LABELS,
  QUALIFICATION_LABELS,
} from "@/lib/tax-constants";
import { NetPayChart } from "./net-pay-chart";
import { GratuityBreakdown } from "./gratuity-breakdown";

const DEFAULT_INPUTS: TaxInputs = {
  paymentFrequency: "monthly",
  basicSalary: 0,
  taxableAllowances: 0,
  nonTaxableAllowances: 0,
  vacationAllowance: 0,
  qualificationType: "none",
  overtimeIncome: 0,
  secondJobIncome: 0,
  childCount: 0,
  loanPayment: 0,
  creditUnionDeduction: 0,
  insuranceType: "none",
  customInsurancePremium: 0,
  gratuityRate: 22.5,
  gratuityPeriod: 6,
};

export function SalaryCalculator() {
  const [inputs, setInputs] = useState<TaxInputs>(DEFAULT_INPUTS);
  const [results, setResults] = useState<TaxResults | null>(null);
  const [saving, setSaving] = useState(false);

  // Load saved profile
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
      })
      .catch(() => {});
  }, []);

  // Auto-calculate when inputs change
  useEffect(() => {
    if (inputs.basicSalary > 0) {
      const r = calculateTax(inputs);
      setResults(r);
    } else {
      setResults(null);
    }
  }, [inputs]);

  const updateInput = useCallback(
    (key: keyof TaxInputs, value: string | number) => {
      setInputs((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handlePresetChange = useCallback((presetId: string | null) => {
    if (!presetId || presetId === "custom") {
      setInputs((prev) => ({
        ...prev,
        basicSalary: 0,
        taxableAllowances: 0,
        nonTaxableAllowances: 0,
      }));
      return;
    }
    const preset = POSITION_PRESETS[presetId];
    if (preset) {
      setInputs((prev) => ({
        ...prev,
        basicSalary: preset.baseSalary,
        taxableAllowances: preset.totalTaxableAllowances,
        nonTaxableAllowances: preset.totalNonTaxableAllowances,
        paymentFrequency: "monthly",
      }));
    }
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await fetch("/api/taxes/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputs),
      });

      // Also save current month's calculation
      if (results) {
        const now = new Date();
        await fetch("/api/taxes/calculations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            grossIncome: results.monthlyGrossIncome,
            nisContribution: results.monthlyNIS,
            incomeTax: results.monthlyPAYE,
            netPay: results.monthlyNetPay,
            taxableIncome: results.taxableIncome,
            personalAllowance: results.personalAllowance,
            childAllowance: results.childAllowance,
            insuranceDeduction: results.actualInsuranceDeduction,
            gratuityAmount: results.sixMonthGratuity,
            effectiveTaxRate: results.effectiveTaxRate,
          }),
        });
      }
    } catch {
      // silent fail
    } finally {
      setSaving(false);
    }
  };

  const frequencyConfig = PAYMENT_FREQUENCIES[inputs.paymentFrequency];

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Salary Inputs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Salary Details</CardTitle>
            <CardDescription>
              Enter your salary information or select a government position preset
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Position Preset */}
            <div className="space-y-2">
              <Label>Position Preset</Label>
              <Select onValueChange={handlePresetChange} defaultValue="custom">
                <SelectTrigger>
                  <SelectValue placeholder="Select position or Custom" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom Salary</SelectItem>
                  {Object.entries(POSITION_PRESETS).map(([id, preset]) => (
                    <SelectItem key={id} value={id}>
                      {preset.title} — {formatCurrency(preset.baseSalary)}/mo
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Frequency */}
            <div className="space-y-2">
              <Label>Payment Frequency</Label>
              <Select
                value={inputs.paymentFrequency}
                onValueChange={(v) => v && updateInput("paymentFrequency", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_FREQUENCIES).map(([id, cfg]) => (
                    <SelectItem key={id} value={id}>
                      {cfg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Basic Salary */}
            <div className="space-y-2">
              <Label>
                Basic Salary ({frequencyConfig?.periodLabel || "per month"})
              </Label>
              <Input
                type="number"
                value={inputs.basicSalary || ""}
                onChange={(e) => updateInput("basicSalary", parseFloat(e.target.value) || 0)}
                placeholder="e.g., 247451"
              />
            </div>

            {/* Allowances */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Taxable Allowances</Label>
                <Input
                  type="number"
                  value={inputs.taxableAllowances || ""}
                  onChange={(e) =>
                    updateInput("taxableAllowances", parseFloat(e.target.value) || 0)
                  }
                  placeholder="Duty, Uniform, etc."
                />
              </div>
              <div className="space-y-2">
                <Label>Non-Taxable Allowances</Label>
                <Input
                  type="number"
                  value={inputs.nonTaxableAllowances || ""}
                  onChange={(e) =>
                    updateInput("nonTaxableAllowances", parseFloat(e.target.value) || 0)
                  }
                  placeholder="Travel, Telecom, etc."
                />
              </div>
            </div>

            {/* Vacation Allowance */}
            <div className="space-y-2">
              <Label>Annual Vacation Allowance</Label>
              <Input
                type="number"
                value={inputs.vacationAllowance || ""}
                onChange={(e) =>
                  updateInput("vacationAllowance", parseFloat(e.target.value) || 0)
                }
                placeholder="Paid annually in December"
              />
            </div>

            {/* Qualification */}
            <div className="space-y-2">
              <Label>Qualification Allowance</Label>
              <Select
                value={inputs.qualificationType}
                onValueChange={(v) => v && updateInput("qualificationType", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(QUALIFICATION_LABELS).map(([id, label]) => (
                    <SelectItem key={id} value={id}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Deductions & Additional */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Deductions & Additional Income</CardTitle>
            <CardDescription>
              Overtime, children, insurance, and other deductions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Children */}
            <div className="space-y-2">
              <Label>Number of Children (under 18)</Label>
              <Input
                type="number"
                min={0}
                max={20}
                value={inputs.childCount || ""}
                onChange={(e) =>
                  updateInput("childCount", parseInt(e.target.value) || 0)
                }
                placeholder="0"
              />
              {inputs.childCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  Child allowance: {formatCurrency(inputs.childCount * (frequencyConfig?.childAllowance || 10000))}{" "}
                  {frequencyConfig?.periodLabel}
                </p>
              )}
            </div>

            {/* Insurance */}
            <div className="space-y-2">
              <Label>Insurance Premium</Label>
              <Select
                value={inputs.insuranceType}
                onValueChange={(v) => v && updateInput("insuranceType", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(INSURANCE_LABELS).map(([id, label]) => (
                    <SelectItem key={id} value={id}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {inputs.insuranceType === "custom" && (
                <Input
                  type="number"
                  value={inputs.customInsurancePremium || ""}
                  onChange={(e) =>
                    updateInput("customInsurancePremium", parseFloat(e.target.value) || 0)
                  }
                  placeholder="Custom premium amount"
                  className="mt-2"
                />
              )}
            </div>

            {/* Overtime & Second Job */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Overtime Income</Label>
                <Input
                  type="number"
                  value={inputs.overtimeIncome || ""}
                  onChange={(e) =>
                    updateInput("overtimeIncome", parseFloat(e.target.value) || 0)
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Second Job Income</Label>
                <Input
                  type="number"
                  value={inputs.secondJobIncome || ""}
                  onChange={(e) =>
                    updateInput("secondJobIncome", parseFloat(e.target.value) || 0)
                  }
                  placeholder="0"
                />
              </div>
            </div>

            {/* Loan & Credit Union */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Loan Payment</Label>
                <Input
                  type="number"
                  value={inputs.loanPayment || ""}
                  onChange={(e) =>
                    updateInput("loanPayment", parseFloat(e.target.value) || 0)
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Credit Union Deduction</Label>
                <Input
                  type="number"
                  value={inputs.creditUnionDeduction || ""}
                  onChange={(e) =>
                    updateInput("creditUnionDeduction", parseFloat(e.target.value) || 0)
                  }
                  placeholder="0"
                />
              </div>
            </div>

            {/* Gratuity Rate */}
            <div className="space-y-2">
              <Label>Gratuity Rate (%)</Label>
              <Input
                type="number"
                step="0.5"
                value={inputs.gratuityRate || ""}
                onChange={(e) =>
                  updateInput("gratuityRate", parseFloat(e.target.value) || 22.5)
                }
                placeholder="22.5"
              />
              <p className="text-xs text-muted-foreground">
                Standard government rate is 22.5%
              </p>
            </div>

            {/* Save Button */}
            <Button onClick={saveProfile} disabled={saving || !results} className="w-full">
              {saving ? "Saving..." : "💾 Save Tax Profile"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-green-500/30">
              <CardHeader className="pb-2">
                <CardDescription>
                  Net Pay ({frequencyConfig?.periodLabel})
                </CardDescription>
                <CardTitle className="text-2xl tabular-nums text-green-600 dark:text-green-400">
                  {formatCurrency(Math.round(results.netPay))}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  After all deductions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>
                  Gross ({frequencyConfig?.periodLabel})
                </CardDescription>
                <CardTitle className="text-2xl tabular-nums">
                  {formatCurrency(Math.round(results.grossIncome))}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Base + Allowances + Other
                </p>
              </CardContent>
            </Card>

            <Card className="border-red-500/30">
              <CardHeader className="pb-2">
                <CardDescription>
                  Total Deductions ({frequencyConfig?.periodLabel})
                </CardDescription>
                <CardTitle className="text-2xl tabular-nums text-red-600 dark:text-red-400">
                  {formatCurrency(Math.round(results.totalDeductions))}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span>NIS: {formatCurrency(Math.round(results.nisContribution))}</span>
                  <span>•</span>
                  <span>PAYE: {formatCurrency(Math.round(results.incomeTax))}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Effective Tax Rate</CardDescription>
                <CardTitle className="text-2xl tabular-nums">
                  {results.effectiveTaxRate.toFixed(1)}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  NIS + PAYE as % of gross
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Chart + Breakdown */}
          <div className="grid gap-6 lg:grid-cols-2">
            <NetPayChart results={results} />

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detailed Breakdown</CardTitle>
                <CardDescription>
                  How your pay is calculated ({frequencyConfig?.periodLabel})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <BreakdownRow label="Basic Salary" value={results.basicSalary} />
                  {results.taxableAllowances > 0 && (
                    <BreakdownRow label="Taxable Allowances" value={results.taxableAllowances} />
                  )}
                  {results.nonTaxableAllowances > 0 && (
                    <BreakdownRow
                      label="Non-Taxable Allowances"
                      value={results.nonTaxableAllowances}
                      badge="Tax Free"
                    />
                  )}
                  {results.qualificationAllowance > 0 && (
                    <BreakdownRow
                      label="Qualification Allowance"
                      value={results.qualificationAllowance}
                      badge="Included above"
                    />
                  )}
                  {results.overtimeIncome > 0 && (
                    <BreakdownRow label="Overtime" value={results.overtimeIncome} />
                  )}
                  {results.secondJobIncome > 0 && (
                    <BreakdownRow label="Second Job" value={results.secondJobIncome} />
                  )}
                  <div className="border-t pt-2">
                    <BreakdownRow label="Gross Income" value={results.grossIncome} bold />
                  </div>

                  <div className="border-t pt-2 space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Deductions
                    </p>
                    <BreakdownRow label="Personal Allowance" value={-results.personalAllowance} sub />
                    <BreakdownRow label="NIS (5.6%)" value={-results.nisContribution} sub negative />
                    {results.childAllowance > 0 && (
                      <BreakdownRow label={`Child Allowance (×${results.childCount})`} value={-results.childAllowance} sub />
                    )}
                    {results.actualInsuranceDeduction > 0 && (
                      <BreakdownRow label="Insurance Premium" value={-results.actualInsuranceDeduction} sub />
                    )}
                    <BreakdownRow label="Chargeable Income" value={results.taxableIncome} bold />
                    <BreakdownRow label="PAYE Income Tax" value={-results.incomeTax} sub negative />
                    {results.loanPayment > 0 && (
                      <BreakdownRow label="Loan Payment" value={-results.loanPayment} sub negative />
                    )}
                    {results.creditUnionDeduction > 0 && (
                      <BreakdownRow label="Credit Union" value={-results.creditUnionDeduction} sub negative />
                    )}
                  </div>

                  <div className="border-t pt-2 border-green-500/30">
                    <BreakdownRow
                      label={`Net Pay (${frequencyConfig?.periodLabel})`}
                      value={results.netPay}
                      bold
                      highlight
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gratuity & Annual */}
          <GratuityBreakdown results={results} />

          {/* Annual Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📊 Annual Summary</CardTitle>
              <CardDescription>
                Projected annual figures based on your current salary
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <AnnualStat label="Annual Gross" value={results.annualGrossIncome} />
                <AnnualStat label="Annual NIS" value={results.annualNIS} negative />
                <AnnualStat label="Annual PAYE" value={results.annualPAYE} negative />
                <AnnualStat label="Annual Net Pay" value={results.annualNetPay} highlight />
                <AnnualStat label="Annual Gratuity" value={results.annualGratuityTotal} />
                <AnnualStat
                  label="Total Annual (Net + Gratuity + Vacation)"
                  value={results.annualTotal}
                  highlight
                  bold
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  bold,
  highlight,
  sub,
  negative,
  badge,
}: {
  label: string;
  value: number;
  bold?: boolean;
  highlight?: boolean;
  sub?: boolean;
  negative?: boolean;
  badge?: string;
}) {
  return (
    <div className={`flex justify-between items-center ${sub ? "pl-2" : ""}`}>
      <span
        className={`text-sm ${bold ? "font-semibold" : ""} ${highlight ? "text-green-600 dark:text-green-400" : ""}`}
      >
        {label}
        {badge && (
          <Badge variant="secondary" className="ml-1 text-[10px]">
            {badge}
          </Badge>
        )}
      </span>
      <span
        className={`text-sm tabular-nums ${bold ? "font-semibold" : ""} ${
          negative ? "text-red-600 dark:text-red-400" : ""
        } ${highlight ? "text-green-600 dark:text-green-400 font-bold" : ""}`}
      >
        {formatCurrency(Math.round(Math.abs(value)))}
        {value < 0 && !negative ? "" : ""}
      </span>
    </div>
  );
}

function AnnualStat({
  label,
  value,
  highlight,
  negative,
  bold,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  negative?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="text-center p-3 rounded-lg bg-muted/50">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p
        className={`text-lg tabular-nums ${bold ? "font-bold" : "font-semibold"} ${
          highlight ? "text-green-600 dark:text-green-400" : ""
        } ${negative ? "text-red-600 dark:text-red-400" : ""}`}
      >
        {formatCurrency(Math.round(value))}
      </p>
    </div>
  );
}
