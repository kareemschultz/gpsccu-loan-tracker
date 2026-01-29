import { NextResponse } from "next/server";
import { db, accounts, transactions, savingsGoals, bills, budgets } from "@/lib/db";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-cache";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
  const next7Days = new Date(now.getTime() + 7 * 86400000).toISOString().split("T")[0];
  const today = now.toISOString().split("T")[0];

  // Net worth from accounts
  const userAccounts = await db.query.accounts.findMany({
    where: and(eq(accounts.userId, user.id), eq(accounts.isActive, true)),
  });

  const assets = userAccounts
    .filter(a => ["checking", "savings", "cash", "investment"].includes(a.type))
    .reduce((sum, a) => sum + parseFloat(a.balance), 0);

  const liabilities = userAccounts
    .filter(a => ["credit_card", "loan"].includes(a.type))
    .reduce((sum, a) => sum + Math.abs(parseFloat(a.balance)), 0);

  const netWorth = assets - liabilities;

  // Monthly income & expenses
  const monthlyTransactions = await db.query.transactions.findMany({
    where: and(
      eq(transactions.userId, user.id),
      gte(transactions.date, startOfMonth),
      lte(transactions.date, endOfMonth)
    ),
  });

  const monthlyIncome = monthlyTransactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const monthlyExpenses = monthlyTransactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  // Recent transactions
  const recentTransactions = await db.query.transactions.findMany({
    where: eq(transactions.userId, user.id),
    with: { category: true, account: true },
    orderBy: [desc(transactions.date), desc(transactions.createdAt)],
    limit: 10,
  });

  // Upcoming bills (next 7 days)
  const upcomingBills = await db.query.bills.findMany({
    where: and(
      eq(bills.userId, user.id),
      eq(bills.isActive, true),
      gte(bills.dueDate, today),
      lte(bills.dueDate, next7Days)
    ),
    orderBy: (b, { asc }) => [asc(b.dueDate)],
  });

  // Overdue bills
  const overdueBills = await db.query.bills.findMany({
    where: and(
      eq(bills.userId, user.id),
      eq(bills.isActive, true),
      lte(bills.dueDate, today)
    ),
  });

  // Savings goals
  const goals = await db.query.savingsGoals.findMany({
    where: and(eq(savingsGoals.userId, user.id), eq(savingsGoals.isCompleted, false)),
    orderBy: [desc(savingsGoals.createdAt)],
    limit: 5,
  });

  // Current month budget
  const currentBudget = await db.query.budgets.findFirst({
    where: and(
      eq(budgets.userId, user.id),
      eq(budgets.month, now.getMonth() + 1),
      eq(budgets.year, now.getFullYear())
    ),
    with: { items: { with: { category: true } } },
  });

  // Spending by category this month
  const spendingByCategory: Record<string, number> = {};
  monthlyTransactions
    .filter(t => t.type === "expense" && t.categoryId)
    .forEach(t => {
      const catId = t.categoryId!;
      spendingByCategory[catId] = (spendingByCategory[catId] || 0) + parseFloat(t.amount);
    });

  return NextResponse.json({
    netWorth,
    assets,
    liabilities,
    monthlyIncome,
    monthlyExpenses,
    cashFlow: monthlyIncome - monthlyExpenses,
    recentTransactions,
    upcomingBills,
    overdueBills: overdueBills.length,
    goals,
    currentBudget,
    spendingByCategory,
    accountCount: userAccounts.length,
  });
}
