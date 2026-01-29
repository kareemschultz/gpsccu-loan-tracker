import { NextRequest, NextResponse } from "next/server";
import { db, budgets, budgetItems } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-cache";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  // Update a single budget item's spent amount
  if (body.itemId && body.spent !== undefined) {
    const [updated] = await db.update(budgetItems)
      .set({ spent: String(body.spent), updatedAt: new Date() })
      .where(eq(budgetItems.id, body.itemId))
      .returning();
    return NextResponse.json(updated);
  }

  // Update budget itself
  const [updated] = await db.update(budgets)
    .set({
      totalIncome: body.totalIncome !== undefined ? String(body.totalIncome) : undefined,
      notes: body.notes,
      updatedAt: new Date(),
    })
    .where(and(eq(budgets.id, id), eq(budgets.userId, user.id)))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  await db.delete(budgets).where(and(eq(budgets.id, id), eq(budgets.userId, user.id)));
  return NextResponse.json({ success: true });
}
