import { NextRequest, NextResponse } from "next/server";
import { db, accounts, accountBalances } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-cache";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json([], { status: 401 });

  const userAccounts = await db.query.accounts.findMany({
    where: eq(accounts.userId, user.id),
    orderBy: [desc(accounts.createdAt)],
  });

  return NextResponse.json(userAccounts);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, type, institution, balance, color, icon, notes, includeInNetWorth } = body;

  if (!name || !type) {
    return NextResponse.json({ error: "Name and type are required" }, { status: 400 });
  }

  const [account] = await db.insert(accounts).values({
    userId: user.id,
    name,
    type,
    institution: institution || null,
    balance: String(balance || 0),
    color: color || "#3b82f6",
    icon: icon || "wallet",
    notes: notes || null,
    includeInNetWorth: includeInNetWorth !== false,
  }).returning();

  // Record initial balance
  await db.insert(accountBalances).values({
    accountId: account.id,
    balance: String(balance || 0),
  });

  return NextResponse.json(account, { status: 201 });
}
