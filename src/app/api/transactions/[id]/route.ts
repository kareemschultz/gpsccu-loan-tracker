import { NextRequest, NextResponse } from "next/server";
import { db, transactions } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-cache";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  await db.delete(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, user.id)));
  return NextResponse.json({ success: true });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const [updated] = await db.update(transactions)
    .set({
      type: body.type,
      amount: body.amount !== undefined ? String(body.amount) : undefined,
      description: body.description,
      merchant: body.merchant,
      date: body.date,
      notes: body.notes,
      categoryId: body.categoryId,
      accountId: body.accountId,
      updatedAt: new Date(),
    })
    .where(and(eq(transactions.id, id), eq(transactions.userId, user.id)))
    .returning();

  return NextResponse.json(updated);
}
