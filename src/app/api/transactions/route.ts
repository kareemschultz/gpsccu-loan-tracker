import { NextRequest, NextResponse } from "next/server";
import { db, transactions, accounts } from "@/lib/db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-cache";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json([], { status: 401 });

  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const type = url.searchParams.get("type");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const accountId = url.searchParams.get("accountId");

  const conditions = [eq(transactions.userId, user.id)];
  if (type) conditions.push(eq(transactions.type, type));
  if (accountId) conditions.push(eq(transactions.accountId, accountId));
  if (from) conditions.push(gte(transactions.date, from));
  if (to) conditions.push(lte(transactions.date, to));

  const result = await db.query.transactions.findMany({
    where: and(...conditions),
    with: { category: true, account: true },
    orderBy: [desc(transactions.date), desc(transactions.createdAt)],
    limit,
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { type, amount, description, merchant, date, notes, categoryId, accountId, toAccountId, isRecurring, recurringFrequency, recurringEndDate } = body;

  if (!type || !amount || !date) {
    return NextResponse.json({ error: "Type, amount, and date are required" }, { status: 400 });
  }

  const [txn] = await db.insert(transactions).values({
    userId: user.id,
    type,
    amount: String(amount),
    description: description || null,
    merchant: merchant || null,
    date,
    notes: notes || null,
    categoryId: categoryId || null,
    accountId: accountId || null,
    toAccountId: type === "transfer" ? (toAccountId || null) : null,
    isRecurring: isRecurring || false,
    recurringFrequency: recurringFrequency || null,
    recurringEndDate: recurringEndDate || null,
  }).returning();

  // Update account balance
  if (accountId) {
    const delta = type === "income" ? parseFloat(amount) : -parseFloat(amount);
    await db.update(accounts)
      .set({ balance: sql`${accounts.balance}::numeric + ${delta}`, updatedAt: new Date() })
      .where(eq(accounts.id, accountId));
  }

  // For transfers, also update destination
  if (type === "transfer" && toAccountId) {
    await db.update(accounts)
      .set({ balance: sql`${accounts.balance}::numeric + ${parseFloat(amount)}`, updatedAt: new Date() })
      .where(eq(accounts.id, toAccountId));
  }

  return NextResponse.json(txn, { status: 201 });
}
