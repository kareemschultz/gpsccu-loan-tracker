import { NextRequest, NextResponse } from "next/server";
import { db, transactionCategories } from "@/lib/db";
import { eq, or, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-cache";

// Default system categories to seed
const DEFAULT_CATEGORIES = [
  { name: "Housing", icon: "home", color: "#3b82f6", type: "expense" },
  { name: "Food & Groceries", icon: "utensils", color: "#22c55e", type: "expense" },
  { name: "Transportation", icon: "car", color: "#f59e0b", type: "expense" },
  { name: "Utilities", icon: "zap", color: "#06b6d4", type: "expense" },
  { name: "Entertainment", icon: "film", color: "#8b5cf6", type: "expense" },
  { name: "Healthcare", icon: "heart", color: "#ef4444", type: "expense" },
  { name: "Education", icon: "book", color: "#6366f1", type: "expense" },
  { name: "Shopping", icon: "shopping-bag", color: "#ec4899", type: "expense" },
  { name: "Personal Care", icon: "user", color: "#14b8a6", type: "expense" },
  { name: "Gifts & Donations", icon: "gift", color: "#f97316", type: "expense" },
  { name: "Insurance", icon: "shield", color: "#64748b", type: "expense" },
  { name: "Savings", icon: "piggy-bank", color: "#10b981", type: "expense" },
  { name: "Other", icon: "more-horizontal", color: "#6b7280", type: "both" },
  { name: "Salary", icon: "briefcase", color: "#22c55e", type: "income" },
  { name: "Freelance", icon: "laptop", color: "#3b82f6", type: "income" },
  { name: "Investments", icon: "trending-up", color: "#8b5cf6", type: "income" },
  { name: "Gifts Received", icon: "gift", color: "#f59e0b", type: "income" },
  { name: "Other Income", icon: "plus-circle", color: "#6b7280", type: "income" },
];

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json([], { status: 401 });

  // Get system + user categories
  let categories = await db.query.transactionCategories.findMany({
    where: or(
      isNull(transactionCategories.userId),
      eq(transactionCategories.userId, user.id)
    ),
    orderBy: (tc, { asc }) => [asc(tc.name)],
  });

  // Seed defaults if none exist
  if (categories.length === 0) {
    const values = DEFAULT_CATEGORIES.map((c) => ({
      ...c,
      userId: null as string | null,
      isSystem: true,
    }));
    categories = await db.insert(transactionCategories).values(values).returning();
  }

  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, icon, color, type } = body;

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const [category] = await db.insert(transactionCategories).values({
    userId: user.id,
    name,
    icon: icon || "tag",
    color: color || "#6b7280",
    type: type || "expense",
    isSystem: false,
  }).returning();

  return NextResponse.json(category, { status: 201 });
}
