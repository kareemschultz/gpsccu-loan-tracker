import { NextRequest, NextResponse } from "next/server";
import { db, savingsGoals } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-cache";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json([], { status: 401 });

  const goals = await db.query.savingsGoals.findMany({
    where: eq(savingsGoals.userId, user.id),
    with: { account: true },
    orderBy: [desc(savingsGoals.createdAt)],
  });

  return NextResponse.json(goals);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, targetAmount, currentAmount, deadline, icon, color, accountId, notes } = body;

  if (!name || !targetAmount) {
    return NextResponse.json({ error: "Name and target amount are required" }, { status: 400 });
  }

  const [goal] = await db.insert(savingsGoals).values({
    userId: user.id,
    name,
    targetAmount: String(targetAmount),
    currentAmount: String(currentAmount || 0),
    deadline: deadline || null,
    icon: icon || "target",
    color: color || "#8b5cf6",
    accountId: accountId || null,
    notes: notes || null,
  }).returning();

  return NextResponse.json(goal, { status: 201 });
}
