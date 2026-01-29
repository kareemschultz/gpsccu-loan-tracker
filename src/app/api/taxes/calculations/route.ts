import { NextRequest, NextResponse } from "next/server";
import { db, taxCalculations } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-cache";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const year = parseInt(url.searchParams.get("year") || String(new Date().getFullYear()));

  const calculations = await db.query.taxCalculations.findMany({
    where: and(
      eq(taxCalculations.userId, user.id),
      eq(taxCalculations.year, year)
    ),
    orderBy: [desc(taxCalculations.month)],
  });

  return NextResponse.json(calculations);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { month, year, grossIncome, nisContribution, incomeTax, netPay, taxableIncome, personalAllowance, childAllowance, insuranceDeduction, gratuityAmount, effectiveTaxRate, metadata } = body;

  if (!month || !year) {
    return NextResponse.json({ error: "Month and year are required" }, { status: 400 });
  }

  // Upsert: check existing
  const existing = await db.query.taxCalculations.findFirst({
    where: and(
      eq(taxCalculations.userId, user.id),
      eq(taxCalculations.month, month),
      eq(taxCalculations.year, year)
    ),
  });

  let calculation;
  const data = {
    grossIncome: String(grossIncome || 0),
    nisContribution: String(nisContribution || 0),
    incomeTax: String(incomeTax || 0),
    netPay: String(netPay || 0),
    taxableIncome: String(taxableIncome || 0),
    personalAllowance: String(personalAllowance || 0),
    childAllowance: String(childAllowance || 0),
    insuranceDeduction: String(insuranceDeduction || 0),
    gratuityAmount: String(gratuityAmount || 0),
    effectiveTaxRate: String(effectiveTaxRate || 0),
    metadata: metadata || {},
  };

  if (existing) {
    [calculation] = await db
      .update(taxCalculations)
      .set(data)
      .where(eq(taxCalculations.id, existing.id))
      .returning();
  } else {
    [calculation] = await db
      .insert(taxCalculations)
      .values({ ...data, userId: user.id, month, year })
      .returning();
  }

  return NextResponse.json(calculation, { status: existing ? 200 : 201 });
}
