import { NextRequest, NextResponse } from "next/server";
import { db, bills } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-cache";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  // Handle "mark as paid" — advance the due date
  if (body.markPaid) {
    const bill = await db.query.bills.findFirst({
      where: and(eq(bills.id, id), eq(bills.userId, user.id)),
    });
    if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const currentDue = new Date(bill.dueDate);
    const nextDue = new Date(currentDue);

    switch (bill.frequency) {
      case "weekly": nextDue.setDate(nextDue.getDate() + 7); break;
      case "biweekly": nextDue.setDate(nextDue.getDate() + 14); break;
      case "monthly": nextDue.setMonth(nextDue.getMonth() + 1); break;
      case "quarterly": nextDue.setMonth(nextDue.getMonth() + 3); break;
      case "semi_annual": nextDue.setMonth(nextDue.getMonth() + 6); break;
      case "annual": nextDue.setFullYear(nextDue.getFullYear() + 1); break;
    }

    const [updated] = await db.update(bills)
      .set({
        lastPaidDate: currentDue.toISOString().split("T")[0],
        dueDate: nextDue.toISOString().split("T")[0],
        isPaid: false,
        updatedAt: new Date(),
      })
      .where(eq(bills.id, id))
      .returning();

    return NextResponse.json(updated);
  }

  const [updated] = await db.update(bills)
    .set({
      name: body.name,
      amount: body.amount !== undefined ? String(body.amount) : undefined,
      dueDate: body.dueDate,
      frequency: body.frequency,
      categoryId: body.categoryId,
      accountId: body.accountId,
      isAutoPay: body.isAutoPay,
      icon: body.icon,
      color: body.color,
      notes: body.notes,
      isActive: body.isActive,
      updatedAt: new Date(),
    })
    .where(and(eq(bills.id, id), eq(bills.userId, user.id)))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  await db.delete(bills).where(and(eq(bills.id, id), eq(bills.userId, user.id)));
  return NextResponse.json({ success: true });
}
