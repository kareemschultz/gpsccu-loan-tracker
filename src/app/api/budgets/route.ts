import { NextRequest, NextResponse } from "next/server";
import { db, budgets, budgetItems, budgetCategories } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-cache";

// Default budget categories
const DEFAULT_BUDGET_CATEGORIES = [
  { name: "Housing", icon: "home", color: "#3b82f6", sortOrder: 1 },
  { name: "Food & Groceries", icon: "utensils", color: "#22c55e", sortOrder: 2 },
  { name: "Transportation", icon: "car", color: "#f59e0b", sortOrder: 3 },
  { name: "Utilities", icon: "zap", color: "#06b6d4", sortOrder: 4 },
  { name: "Entertainment", icon: "film", color: "#8b5cf6", sortOrder: 5 },
  { name: "Healthcare", icon: "heart", color: "#ef4444", sortOrder: 6 },
  { name: "Education", icon: "book", color: "#6366f1", sortOrder: 7 },
  { name: "Shopping", icon: "shopping-bag", color: "#ec4899", sortOrder: 8 },
  { name: "Personal Care", icon: "user", color: "#14b8a6", sortOrder: 9 },
  { name: "Insurance", icon: "shield", color: "#64748b", sortOrder: 10 },
  { name: "Savings & Debt", icon: "piggy-bank", color: "#10b981", sortOrder: 11 },
  { name: "Other", icon: "more-horizontal", color: "#6b7280", sortOrder: 12 },
];

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json([], { status: 401 });

  const url = new URL(req.url);
  const month = parseInt(url.searchParams.get("month") || String(new Date().getMonth() + 1));
  const year = parseInt(url.searchParams.get("year") || String(new Date().getFullYear()));

  const budget = await db.query.budgets.findFirst({
    where: and(
      eq(budgets.userId, user.id),
      eq(budgets.month, month),
      eq(budgets.year, year)
    ),
    with: {
      items: {
        with: { category: true },
      },
    },
  });

  // Also return budget categories
  let cats = await db.query.budgetCategories.findMany({
    where: eq(budgetCategories.userId, user.id),
    orderBy: (bc, { asc }) => [asc(bc.sortOrder)],
  });

  // Seed defaults if none exist
  if (cats.length === 0) {
    cats = await db.insert(budgetCategories).values(
      DEFAULT_BUDGET_CATEGORIES.map((c) => ({
        ...c,
        userId: user.id,
        isSystem: true,
      }))
    ).returning();
  }

  return NextResponse.json({ budget, categories: cats });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { month, year, totalIncome, items } = body;

  if (!month || !year) {
    return NextResponse.json({ error: "Month and year are required" }, { status: 400 });
  }

  // Check if budget already exists
  const existing = await db.query.budgets.findFirst({
    where: and(eq(budgets.userId, user.id), eq(budgets.month, month), eq(budgets.year, year)),
  });

  let budget;
  if (existing) {
    // Update existing
    [budget] = await db.update(budgets)
      .set({ totalIncome: String(totalIncome || 0), updatedAt: new Date() })
      .where(eq(budgets.id, existing.id))
      .returning();

    // Delete existing items and re-insert
    await db.delete(budgetItems).where(eq(budgetItems.budgetId, existing.id));
  } else {
    [budget] = await db.insert(budgets).values({
      userId: user.id,
      month,
      year,
      totalIncome: String(totalIncome || 0),
    }).returning();
  }

  // Insert budget items
  if (items && items.length > 0) {
    await db.insert(budgetItems).values(
      items.map((item: { categoryId: string; budgeted: number; rollover?: boolean }) => ({
        budgetId: budget.id,
        categoryId: item.categoryId,
        budgeted: String(item.budgeted || 0),
        spent: "0",
        rollover: item.rollover || false,
      }))
    );
  }

  // Return the full budget with items
  const fullBudget = await db.query.budgets.findFirst({
    where: eq(budgets.id, budget.id),
    with: { items: { with: { category: true } } },
  });

  return NextResponse.json(fullBudget, { status: existing ? 200 : 201 });
}
