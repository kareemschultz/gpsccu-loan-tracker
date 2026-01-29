// ============================================================================
// Guyana Tax Constants 2026
// ============================================================================

// Tax rates
export const TAX_RATE_1 = 0.25; // 25% on income up to threshold
export const TAX_RATE_2 = 0.35; // 35% on income above threshold

// Monthly thresholds
export const TAX_THRESHOLD_MONTHLY = 260000;
export const PERSONAL_ALLOWANCE_MONTHLY = 140000;
export const CHILD_ALLOWANCE_PER_CHILD = 10000;
export const OVERTIME_ALLOWANCE_MAX = 50000;
export const SECOND_JOB_ALLOWANCE_MAX = 50000;

// NIS
export const NIS_RATE = 0.056; // 5.6%
export const NIS_CEILING_MONTHLY = 280000;

// Insurance premiums
export const INSURANCE_PREMIUMS: Record<string, number | "custom"> = {
  none: 0,
  employee: 1469,
  "employee-one": 3182,
  family: 4970,
  custom: "custom",
};

export const INSURANCE_LABELS: Record<string, string> = {
  none: "No Insurance",
  employee: "Employee Only ($1,469/mo)",
  "employee-one": "Employee + One ($3,182/mo)",
  family: "Family ($4,970/mo)",
  custom: "Custom Amount",
};

// Qualification allowances (monthly)
export const QUALIFICATION_ALLOWANCES: Record<string, number> = {
  none: 0,
  acca: 15000,
  masters: 22000,
  phd: 32000,
};

export const QUALIFICATION_LABELS: Record<string, string> = {
  none: "None",
  acca: "ACCA ($15,000/mo)",
  masters: "Master's Degree ($22,000/mo)",
  phd: "PhD ($32,000/mo)",
};

// Payment frequency configurations
export interface FrequencyConfig {
  label: string;
  factor: number;
  personalAllowance: number;
  taxThreshold: number;
  nisRate: number;
  nisCeiling: number;
  childAllowance: number;
  overtimeMax: number;
  secondJobMax: number;
  insuranceMaxMonthly: number;
  periodLabel: string;
  periodsPerYear: number;
}

export const PAYMENT_FREQUENCIES: Record<string, FrequencyConfig> = {
  daily: {
    label: "Daily",
    factor: 1 / 21.67,
    personalAllowance: 6460,
    taxThreshold: 8548,
    nisRate: 0.056,
    nisCeiling: 12923,
    childAllowance: 462,
    overtimeMax: 2308,
    secondJobMax: 2308,
    insuranceMaxMonthly: 2308,
    periodLabel: "per day",
    periodsPerYear: 260,
  },
  weekly: {
    label: "Weekly",
    factor: 1 / 4.33,
    personalAllowance: 32333,
    taxThreshold: 60000,
    nisRate: 0.056,
    nisCeiling: 64615,
    childAllowance: 2308,
    overtimeMax: 11538,
    secondJobMax: 11538,
    insuranceMaxMonthly: 11538,
    periodLabel: "per week",
    periodsPerYear: 52,
  },
  fortnightly: {
    label: "Fortnightly",
    factor: 1 / 2.17,
    personalAllowance: 64516,
    taxThreshold: 120000,
    nisRate: 0.056,
    nisCeiling: 129231,
    childAllowance: 4615,
    overtimeMax: 23077,
    secondJobMax: 23077,
    insuranceMaxMonthly: 23077,
    periodLabel: "per fortnight",
    periodsPerYear: 26,
  },
  monthly: {
    label: "Monthly",
    factor: 1,
    personalAllowance: 140000,
    taxThreshold: 260000,
    nisRate: 0.056,
    nisCeiling: 280000,
    childAllowance: 10000,
    overtimeMax: 50000,
    secondJobMax: 50000,
    insuranceMaxMonthly: 50000,
    periodLabel: "per month",
    periodsPerYear: 12,
  },
  yearly: {
    label: "Yearly",
    factor: 12,
    personalAllowance: 1680000,
    taxThreshold: 3120000,
    nisRate: 0.056,
    nisCeiling: 3360000,
    childAllowance: 120000,
    overtimeMax: 600000,
    secondJobMax: 600000,
    insuranceMaxMonthly: 600000,
    periodLabel: "per year",
    periodsPerYear: 1,
  },
};

// Qualification allowances by frequency
export const QUALIFICATION_ALLOWANCES_BY_FREQUENCY: Record<string, Record<string, number>> = {
  daily: { none: 0, acca: 692, masters: 1015, phd: 1477 },
  weekly: { none: 0, acca: 3462, masters: 5077, phd: 7385 },
  fortnightly: { none: 0, acca: 6923, masters: 10154, phd: 14769 },
  monthly: { none: 0, acca: 15000, masters: 22000, phd: 32000 },
  yearly: { none: 0, acca: 180000, masters: 264000, phd: 384000 },
};

// Position presets (government positions)
export interface PositionPreset {
  title: string;
  baseSalary: number;
  taxableAllowances: Record<string, number>;
  nonTaxableAllowances: Record<string, number>;
  totalTaxableAllowances: number;
  totalNonTaxableAllowances: number;
}

export const POSITION_PRESETS: Record<string, PositionPreset> = {
  "it-officer-2": {
    title: "IT Officer II",
    baseSalary: 247451,
    taxableAllowances: { duty: 15000, uniform: 5000 },
    nonTaxableAllowances: { travel: 0, telecom: 0 },
    totalTaxableAllowances: 20000,
    totalNonTaxableAllowances: 0,
  },
  "it-officer-3": {
    title: "IT Officer III",
    baseSalary: 266000,
    taxableAllowances: { duty: 15000, uniform: 5000 },
    nonTaxableAllowances: { travel: 0, telecom: 0 },
    totalTaxableAllowances: 20000,
    totalNonTaxableAllowances: 0,
  },
  "ict-tech-1": {
    title: "ICT Technician I",
    baseSalary: 222804,
    taxableAllowances: { duty: 0, uniform: 5000 },
    nonTaxableAllowances: { travel: 5000, telecom: 5000 },
    totalTaxableAllowances: 5000,
    totalNonTaxableAllowances: 10000,
  },
  "ict-tech-2": {
    title: "ICT Technician II",
    baseSalary: 176564,
    taxableAllowances: { duty: 12000, uniform: 5000 },
    nonTaxableAllowances: { travel: 0, telecom: 0 },
    totalTaxableAllowances: 17000,
    totalNonTaxableAllowances: 0,
  },
  "ict-tech-3": {
    title: "ICT Technician III",
    baseSalary: 148051,
    taxableAllowances: { duty: 10000, uniform: 5000 },
    nonTaxableAllowances: { travel: 0, telecom: 0 },
    totalTaxableAllowances: 15000,
    totalNonTaxableAllowances: 0,
  },
  "assist-ict-eng-3": {
    title: "Assistant ICT Engineer III",
    baseSalary: 308540,
    taxableAllowances: { duty: 0, uniform: 5000 },
    nonTaxableAllowances: { travel: 5000, telecom: 5000 },
    totalTaxableAllowances: 5000,
    totalNonTaxableAllowances: 10000,
  },
  "ict-eng-3": {
    title: "ICT Engineer III",
    baseSalary: 393301,
    taxableAllowances: { uniform: 5000 },
    nonTaxableAllowances: { travel: 10000, telecom: 5000 },
    totalTaxableAllowances: 5000,
    totalNonTaxableAllowances: 15000,
  },
  "admin-officer-2": {
    title: "Administrative Officer II",
    baseSalary: 180000,
    taxableAllowances: { duty: 10000, uniform: 3000 },
    nonTaxableAllowances: { travel: 0, telecom: 0 },
    totalTaxableAllowances: 13000,
    totalNonTaxableAllowances: 0,
  },
  "accounts-clerk-1": {
    title: "Accounts Clerk I",
    baseSalary: 150000,
    taxableAllowances: { duty: 8000, uniform: 3000 },
    nonTaxableAllowances: { travel: 0, telecom: 0 },
    totalTaxableAllowances: 11000,
    totalNonTaxableAllowances: 0,
  },
  "teacher-primary": {
    title: "Primary School Teacher",
    baseSalary: 185000,
    taxableAllowances: { duty: 0, uniform: 0 },
    nonTaxableAllowances: { travel: 15000, station: 5000 },
    totalTaxableAllowances: 0,
    totalNonTaxableAllowances: 20000,
  },
  "nurse-staff": {
    title: "Staff Nurse",
    baseSalary: 220000,
    taxableAllowances: { duty: 20000, uniform: 5000 },
    nonTaxableAllowances: { travel: 8000, station: 5000 },
    totalTaxableAllowances: 25000,
    totalNonTaxableAllowances: 13000,
  },
};

// Salary increase presets
export const COMMON_SALARY_INCREASES = [
  { value: 6, label: "6% (Standard Government)" },
  { value: 8, label: "8% (July 2026 Increase)" },
  { value: 10, label: "10% (Performance Based)" },
  { value: 12, label: "12% (Promotion)" },
  { value: 15, label: "15% (Significant Promotion)" },
];

// Property tax constants
export const PROPERTY_TAX_RATES = {
  georgetown: {
    label: "Georgetown",
    residential: 0.005, // 0.5% of ARV
    commercial: 0.0075,
  },
  municipality: {
    label: "Other Municipalities",
    residential: 0.004,
    commercial: 0.006,
  },
  rural: {
    label: "Rural / NDC Areas",
    residential: 0.003,
    commercial: 0.005,
  },
};

// Tax calendar deadlines
export const TAX_DEADLINES = [
  {
    name: "Individual Income Tax Filing",
    description: "Annual income tax return deadline for individuals",
    month: 4,
    day: 30,
    type: "gra_filing" as const,
  },
  {
    name: "Company Tax Filing",
    description: "Annual tax return deadline for companies",
    month: 3,
    day: 31,
    type: "gra_filing" as const,
  },
  {
    name: "Property Tax Due",
    description: "Annual property tax payment deadline",
    month: 6,
    day: 30,
    type: "property_tax" as const,
  },
];

// NIS payment due on the 14th of the following month
export const NIS_PAYMENT_DUE_DAY = 14;
