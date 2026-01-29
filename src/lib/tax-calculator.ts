// ============================================================================
// Guyana Tax Calculator Engine
// Ported from gy-taxcalc vanilla JS to TypeScript
// ============================================================================

import {
  TAX_RATE_1,
  TAX_RATE_2,
  PAYMENT_FREQUENCIES,
  INSURANCE_PREMIUMS,
  QUALIFICATION_ALLOWANCES_BY_FREQUENCY,
  type FrequencyConfig,
} from "./tax-constants";

export interface TaxInputs {
  paymentFrequency: string;
  basicSalary: number;
  taxableAllowances: number;
  nonTaxableAllowances: number;
  vacationAllowance: number;
  qualificationType: string;
  overtimeIncome: number;
  secondJobIncome: number;
  childCount: number;
  loanPayment: number;
  creditUnionDeduction: number;
  insuranceType: string;
  customInsurancePremium: number;
  gratuityRate: number;
  gratuityPeriod: number;
}

export interface TaxResults {
  // Input echo
  paymentFrequency: string;
  frequencyConfig: FrequencyConfig;
  basicSalary: number;
  monthlyBasicSalary: number;
  taxableAllowances: number;
  nonTaxableAllowances: number;
  vacationAllowance: number;
  qualificationType: string;
  qualificationAllowance: number;
  overtimeIncome: number;
  secondJobIncome: number;
  childCount: number;
  loanPayment: number;
  creditUnionDeduction: number;
  insurancePremium: number;
  actualInsuranceDeduction: number;
  gratuityRate: number;

  // Frequency-specific calculations
  grossIncome: number;
  grossIncomeForTaxableCalculation: number;
  personalAllowance: number;
  nisContribution: number;
  childAllowance: number;
  overtimeAllowance: number;
  secondJobAllowance: number;
  taxableIncome: number;
  incomeTax: number;
  netPay: number;
  totalDeductions: number;

  // Monthly equivalents
  monthlyGrossIncome: number;
  monthlyNetPay: number;
  monthlyNIS: number;
  monthlyPAYE: number;
  monthlyGratuityAccrual: number;

  // Special months
  sixMonthGratuity: number;
  monthSixTotal: number;
  monthTwelveTotal: number;

  // Annual calculations
  annualGrossIncome: number;
  annualNIS: number;
  annualPAYE: number;
  annualNetPay: number;
  annualGratuityTotal: number;
  annualTotal: number;

  // Effective rate
  effectiveTaxRate: number;
}

function convertFromMonthly(monthlyAmount: number, frequency: string): number {
  const config = PAYMENT_FREQUENCIES[frequency] || PAYMENT_FREQUENCIES.monthly;
  return monthlyAmount * config.factor;
}

function convertToMonthly(amount: number, frequency: string): number {
  const config = PAYMENT_FREQUENCIES[frequency] || PAYMENT_FREQUENCIES.monthly;
  return amount / config.factor;
}

export function calculateTax(inputs: TaxInputs): TaxResults {
  const {
    paymentFrequency,
    basicSalary,
    taxableAllowances,
    vacationAllowance,
    qualificationType,
    overtimeIncome,
    secondJobIncome,
    childCount,
    loanPayment,
    creditUnionDeduction,
    insuranceType,
    customInsurancePremium,
    gratuityRate,
  } = inputs;

  const frequencyConfig = PAYMENT_FREQUENCIES[paymentFrequency] || PAYMENT_FREQUENCIES.monthly;

  // Add qualification allowance to non-taxable
  const qualificationAllowance =
    QUALIFICATION_ALLOWANCES_BY_FREQUENCY[paymentFrequency]?.[qualificationType] || 0;
  const nonTaxableAllowances = inputs.nonTaxableAllowances + qualificationAllowance;

  // Insurance premium
  let insurancePremium = 0;
  if (insuranceType === "custom") {
    insurancePremium = customInsurancePremium;
  } else {
    const monthlyPremium = INSURANCE_PREMIUMS[insuranceType];
    if (typeof monthlyPremium === "number") {
      insurancePremium = convertFromMonthly(monthlyPremium, paymentFrequency);
    }
  }

  // Monthly basic salary for gratuity calculation
  const monthlyBasicSalary = convertToMonthly(basicSalary, paymentFrequency);

  // Gratuity accrual
  const monthlyGratuityAccrual = monthlyBasicSalary * (gratuityRate / 100);
  const sixMonthGratuity = monthlyGratuityAccrual * 6;

  // Gross income for frequency
  const grossIncome =
    basicSalary + taxableAllowances + nonTaxableAllowances + overtimeIncome + secondJobIncome;

  // Deductions
  const personalAllowance = Math.max(
    frequencyConfig.personalAllowance,
    grossIncome / 3
  );
  const nisContribution = Math.min(
    grossIncome * frequencyConfig.nisRate,
    frequencyConfig.nisCeiling * frequencyConfig.nisRate
  );
  const childAllowance = childCount * frequencyConfig.childAllowance;
  const overtimeAllowance = Math.min(overtimeIncome, frequencyConfig.overtimeMax);
  const secondJobAllowance = Math.min(secondJobIncome, frequencyConfig.secondJobMax);
  const actualInsuranceDeduction = Math.min(
    insurancePremium,
    grossIncome * 0.1,
    frequencyConfig.insuranceMaxMonthly
  );

  // Gross income for taxable calculation
  const grossIncomeForTaxableCalculation =
    grossIncome - nonTaxableAllowances - overtimeAllowance - secondJobAllowance;

  // Chargeable income
  const taxableIncome = Math.max(
    0,
    grossIncomeForTaxableCalculation -
      personalAllowance -
      nisContribution -
      childAllowance -
      actualInsuranceDeduction
  );

  // Income tax (PAYE)
  let incomeTax = 0;
  if (taxableIncome <= frequencyConfig.taxThreshold) {
    incomeTax = taxableIncome * TAX_RATE_1;
  } else {
    incomeTax =
      frequencyConfig.taxThreshold * TAX_RATE_1 +
      (taxableIncome - frequencyConfig.taxThreshold) * TAX_RATE_2;
  }

  const totalDeductions = nisContribution + incomeTax + loanPayment + creditUnionDeduction;

  // Net pay
  const netPay = grossIncome - nisContribution - incomeTax - loanPayment - creditUnionDeduction;

  // Monthly equivalents
  const monthlyGrossIncome = convertToMonthly(grossIncome, paymentFrequency);
  const monthlyNetPay = convertToMonthly(netPay, paymentFrequency);
  const monthlyNIS = convertToMonthly(nisContribution, paymentFrequency);
  const monthlyPAYE = convertToMonthly(incomeTax, paymentFrequency);

  // Special months
  const monthSixTotal = monthlyNetPay + sixMonthGratuity;
  const monthTwelveTotal = monthlyNetPay + sixMonthGratuity + vacationAllowance;

  // Annual
  const annualGrossIncome = grossIncome * frequencyConfig.periodsPerYear;
  const annualNIS = nisContribution * frequencyConfig.periodsPerYear;
  const annualPAYE = incomeTax * frequencyConfig.periodsPerYear;
  const annualNetPay = netPay * frequencyConfig.periodsPerYear;
  const annualGratuityTotal = sixMonthGratuity * 2;
  const annualTotal = annualNetPay + annualGratuityTotal + vacationAllowance;

  // Effective tax rate
  const effectiveTaxRate =
    annualGrossIncome > 0 ? ((annualPAYE + annualNIS) / annualGrossIncome) * 100 : 0;

  return {
    paymentFrequency,
    frequencyConfig,
    basicSalary,
    monthlyBasicSalary,
    taxableAllowances,
    nonTaxableAllowances,
    vacationAllowance,
    qualificationType,
    qualificationAllowance,
    overtimeIncome,
    secondJobIncome,
    childCount,
    loanPayment,
    creditUnionDeduction,
    insurancePremium,
    actualInsuranceDeduction,
    gratuityRate,

    grossIncome,
    grossIncomeForTaxableCalculation,
    personalAllowance,
    nisContribution,
    childAllowance,
    overtimeAllowance,
    secondJobAllowance,
    taxableIncome,
    incomeTax,
    netPay,
    totalDeductions,

    monthlyGrossIncome,
    monthlyNetPay,
    monthlyNIS,
    monthlyPAYE,
    monthlyGratuityAccrual,

    sixMonthGratuity,
    monthSixTotal,
    monthTwelveTotal,

    annualGrossIncome,
    annualNIS,
    annualPAYE,
    annualNetPay,
    annualGratuityTotal,
    annualTotal,

    effectiveTaxRate,
  };
}

// Salary increase projector
export interface SalaryProjection {
  month: number;
  label: string;
  grossIncome: number;
  netPay: number;
  nis: number;
  paye: number;
  isGratuityMonth: boolean;
  gratuityAmount: number;
  totalPay: number;
}

export function projectSalaryIncrease(
  currentInputs: TaxInputs,
  increasePercent: number,
  months: number = 12
): { current: TaxResults; projected: TaxResults; projections: SalaryProjection[] } {
  const current = calculateTax(currentInputs);

  const newInputs = {
    ...currentInputs,
    basicSalary: currentInputs.basicSalary * (1 + increasePercent / 100),
  };
  const projected = calculateTax(newInputs);

  const projections: SalaryProjection[] = [];
  for (let m = 1; m <= months; m++) {
    const isGratuityMonth = m === 6 || m === 12;
    const baseResults = calculateTax(newInputs);
    const monthlyNet = convertToMonthly(baseResults.netPay, newInputs.paymentFrequency);
    const gratuityAmount = isGratuityMonth ? baseResults.sixMonthGratuity : 0;
    const vacationAmount = m === 12 ? newInputs.vacationAllowance : 0;

    projections.push({
      month: m,
      label: new Date(2026, m - 1, 1).toLocaleString("default", { month: "short" }),
      grossIncome: convertToMonthly(baseResults.grossIncome, newInputs.paymentFrequency),
      netPay: monthlyNet,
      nis: convertToMonthly(baseResults.nisContribution, newInputs.paymentFrequency),
      paye: convertToMonthly(baseResults.incomeTax, newInputs.paymentFrequency),
      isGratuityMonth,
      gratuityAmount: gratuityAmount + vacationAmount,
      totalPay: monthlyNet + gratuityAmount + vacationAmount,
    });
  }

  return { current, projected, projections };
}

// Property tax calculator
export interface PropertyTaxResult {
  annualRentalValue: number;
  locationType: string;
  propertyType: string;
  taxRate: number;
  annualTax: number;
  quarterlyTax: number;
  monthlyEquivalent: number;
}

export function calculatePropertyTax(
  arv: number,
  locationType: "georgetown" | "municipality" | "rural",
  propertyType: "residential" | "commercial"
): PropertyTaxResult {
  const rates: Record<string, Record<string, number>> = {
    georgetown: { residential: 0.005, commercial: 0.0075 },
    municipality: { residential: 0.004, commercial: 0.006 },
    rural: { residential: 0.003, commercial: 0.005 },
  };

  const taxRate = rates[locationType]?.[propertyType] || 0.005;
  const annualTax = arv * taxRate;

  return {
    annualRentalValue: arv,
    locationType,
    propertyType,
    taxRate,
    annualTax,
    quarterlyTax: annualTax / 4,
    monthlyEquivalent: annualTax / 12,
  };
}
