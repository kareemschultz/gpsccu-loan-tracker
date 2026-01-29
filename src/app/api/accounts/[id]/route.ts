import { NextRequest, NextResponse } from "next/server";
import { db, accounts, accountBalances } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-cache";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const account = await db.query.accounts.findFirst({
    where: and(eq(accounts.id, id), eq(accounts.userId, user.id)),
  });

  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(account);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const existing = await db.query.accounts.findFirst({
    where: and(eq(accounts.id, id), eq(accounts.userId, user.id)),
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const balanceChanged = body.balance !== undefined && String(body.balance) !== existing.balance;

  const [updated] = await db.update(accounts)
    .set({
      name: body.name ?? existing.name,
      type: body.type ?? existing.type,
      institution: body.institution !== undefined ? body.institution : existing.institution,
      balance: body.balance !== undefined ? String(body.balance) : existing.balance,
      color: body.color ?? existing.color,
      icon: body.icon ?? existing.icon,
      notes: body.notes !== undefined ? body.notes : existing.notes,
      isActive: body.isActive !== undefined ? body.isActive : existing.isActive,
      includeInNetWorth: body.includeInNetWorth !== undefined ? body.includeInNetWorth : existing.includeInNetWorth,
      updatedAt: new Date(),
    })
    .where(and(eq(accounts.id, id), eq(accounts.userId, user.id)))
    .returning();

  // Record balance history if changed
  if (balanceChanged) {
    await db.insert(accountBalances).values({
      accountId: id,
      balance: String(body.balance),
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  await db.delete(accounts).where(and(eq(accounts.id, id), eq(accounts.userId, user.id)));
  return NextResponse.json({ success: true });
}
