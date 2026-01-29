import { NextResponse } from "next/server";
import { db, taxProfiles, taxCalculations } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-cache";
import { calculateTax, type TaxInputs } from "@/lib/tax-calculator";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Get tax profile
  const profile = await db.query.taxProfiles.findFirst({
    where: eq(taxProfiles.userId, user.id),
  });

  if (!profile) {
    return NextResponse.json({
      hasProfile: false,
      monthlyNIS: 0,
      monthlyPAYE: 0,
      ytdNIS: 0,
      ytdPAYE: 0,
      ytdTotalTax: 0,
      effectiveTaxRate: 0,
      monthlyNetPay: 0,
      monthlyGrossIncome: 0,
    });
  }

  // Calculate current tax
  const inputs: TaxInputs = {
    paymentFrequency: profile.paymentFrequency,
    basicSalary: parseFloat(profile.baseSalary),
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
  };

  const results = calculateTax(inputs);

  // Get YTD from tax_calculations table
  const ytdCalcs = await db.query.taxCalculations.findMany({
    where: and(
      eq(taxCalculations.userId, user.id),
      eq(taxCalculations.year, currentYear)
    ),
  });

  let ytdNIS = 0;
  let ytdPAYE = 0;

  if (ytdCalcs.length > 0) {
    ytdNIS = ytdCalcs.reduce((sum, c) => sum + parseFloat(c.nisContribution), 0);
    ytdPAYE = ytdCalcs.reduce((sum, c) => sum + parseFloat(c.incomeTax), 0);
  } else {
    // Estimate from current monthly figures
    ytdNIS = results.monthlyNIS * currentMonth;
    ytdPAYE = results.monthlyPAYE * currentMonth;
  }

  return NextResponse.json({
    hasProfile: true,
    monthlyNIS: Math.round(results.monthlyNIS),
    monthlyPAYE: Math.round(results.monthlyPAYE),
    monthlyNetPay: Math.round(results.monthlyNetPay),
    monthlyGrossIncome: Math.round(results.monthlyGrossIncome),
    ytdNIS: Math.round(ytdNIS),
    ytdPAYE: Math.round(ytdPAYE),
    ytdTotalTax: Math.round(ytdNIS + ytdPAYE),
    effectiveTaxRate: parseFloat(results.effectiveTaxRate.toFixed(1)),
    annualNIS: Math.round(results.annualNIS),
    annualPAYE: Math.round(results.annualPAYE),
    annualNetPay: Math.round(results.annualNetPay),
    annualTotal: Math.round(results.annualTotal),
  });
}
