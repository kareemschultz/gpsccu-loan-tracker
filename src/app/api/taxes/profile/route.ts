import { NextRequest, NextResponse } from "next/server";
import { db, taxProfiles } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-cache";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await db.query.taxProfiles.findFirst({
    where: eq(taxProfiles.userId, user.id),
  });

  return NextResponse.json(profile || null);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const existing = await db.query.taxProfiles.findFirst({
    where: eq(taxProfiles.userId, user.id),
  });

  const data = {
    positionPreset: body.positionPreset || null,
    positionTitle: body.positionTitle || null,
    baseSalary: String(body.baseSalary || 0),
    paymentFrequency: body.paymentFrequency || "monthly",
    taxableAllowances: String(body.taxableAllowances || 0),
    nonTaxableAllowances: String(body.nonTaxableAllowances || 0),
    vacationAllowance: String(body.vacationAllowance || 0),
    qualificationType: body.qualificationType || "none",
    overtimeIncome: String(body.overtimeIncome || 0),
    secondJobIncome: String(body.secondJobIncome || 0),
    childCount: body.childCount || 0,
    insuranceType: body.insuranceType || "none",
    customInsurancePremium: String(body.customInsurancePremium || 0),
    loanPayment: String(body.loanPayment || 0),
    creditUnionDeduction: String(body.creditUnionDeduction || 0),
    gratuityRate: String(body.gratuityRate || 22.5),
    updatedAt: new Date(),
  };

  let profile;
  if (existing) {
    [profile] = await db
      .update(taxProfiles)
      .set(data)
      .where(eq(taxProfiles.id, existing.id))
      .returning();
  } else {
    [profile] = await db
      .insert(taxProfiles)
      .values({ ...data, userId: user.id })
      .returning();
  }

  return NextResponse.json(profile, { status: existing ? 200 : 201 });
}
