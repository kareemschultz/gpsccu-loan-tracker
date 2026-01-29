// ============================================================================
// Application Constants
// ============================================================================

export const APP_NAME = "FundSight";
export const APP_SHORT_NAME = "FundSight";
export const APP_DESCRIPTION =
  "Track loans, plan payments, model scenarios, and take control of your financial future.";
export const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

// Currency formatting
export const DEFAULT_CURRENCY = "GYD";
export const DEFAULT_LOCALE = "en-GY";

// Format currency in GYD (or any currency)
export function formatCurrency(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format percentage
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// Navigation items (single source of truth)
export const NAVIGATION = [
  { name: "Dashboard", href: "/home", description: "Financial overview" },
  { name: "Accounts", href: "/accounts", description: "Financial accounts" },
  { name: "Transactions", href: "/transactions", description: "Income & expenses" },
  { name: "Budgets", href: "/budgets", description: "Monthly budgets" },
  { name: "Savings Goals", href: "/goals", description: "Goal tracking" },
  { name: "Bills", href: "/bills", description: "Recurring bills" },
  { name: "My Loans", href: "/loans", description: "Manage loans" },
  { name: "Payments", href: "/tracker", description: "Record payments" },
  { name: "Planning", href: "/planning", description: "Payment strategy" },
  { name: "Scenarios", href: "/scenarios", description: "What-if analysis" },
  { name: "Analytics", href: "/analytics", description: "Charts & insights" },
  { name: "Reports", href: "/reports", description: "Export data" },
  { name: "Tax Centre", href: "/taxes", description: "GY Tax Calculator" },
] as const;
