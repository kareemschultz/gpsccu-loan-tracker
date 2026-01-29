import { NextRequest, NextResponse } from "next/server";
import { db, savingsGoals } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-cache";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const [updated] = await db.update(savingsGoals)
    .set({
      name: body.name,
      targetAmount: body.targetAmount !== undefined ? String(body.targetAmount) : undefined,
      currentAmount: body.currentAmount !== undefined ? String(body.currentAmount) : undefined,
      deadline: body.deadline,
      icon: body.icon,
      color: body.color,
      accountId: body.accountId,
      notes: body.notes,
      isCompleted: body.isCompleted,
      updatedAt: new Date(),
    })
    .where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, user.id)))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  await db.delete(savingsGoals).where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, user.id)));
  return NextResponse.json({ success: true });
}
