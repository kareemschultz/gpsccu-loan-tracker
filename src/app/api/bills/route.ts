import { NextRequest, NextResponse } from "next/server";
import { db, bills } from "@/lib/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-cache";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json([], { status: 401 });

  const url = new URL(req.url);
  const upcoming = url.searchParams.get("upcoming");

  const conditions = [eq(bills.userId, user.id), eq(bills.isActive, true)];

  if (upcoming) {
    const days = parseInt(upcoming);
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + days);
    conditions.push(gte(bills.dueDate, now.toISOString().split("T")[0]));
    conditions.push(lte(bills.dueDate, future.toISOString().split("T")[0]));
  }

  const userBills = await db.query.bills.findMany({
    where: and(...conditions),
    with: { category: true, account: true },
    orderBy: (b, { asc }) => [asc(b.dueDate)],
  });

  return NextResponse.json(userBills);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, amount, dueDate, frequency, categoryId, accountId, isAutoPay, icon, color, notes } = body;

  if (!name || !amount || !dueDate) {
    return NextResponse.json({ error: "Name, amount, and due date are required" }, { status: 400 });
  }

  const [bill] = await db.insert(bills).values({
    userId: user.id,
    name,
    amount: String(amount),
    dueDate,
    frequency: frequency || "monthly",
    categoryId: categoryId || null,
    accountId: accountId || null,
    isAutoPay: isAutoPay || false,
    icon: icon || "receipt",
    color: color || "#ef4444",
    notes: notes || null,
  }).returning();

  return NextResponse.json(bill, { status: 201 });
}
