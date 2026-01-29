import { NextResponse } from "next/server";
import { db, notifications, taxProfiles } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth-cache";
import { TAX_DEADLINES, NIS_PAYMENT_DUE_DAY } from "@/lib/tax-constants";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const currentYear = now.getFullYear();
  const created: string[] = [];

  // Check if user has a tax profile
  const profile = await db.query.taxProfiles.findFirst({
    where: eq(taxProfiles.userId, user.id),
  });

  // Generate tax deadline reminders
  for (const deadline of TAX_DEADLINES) {
    const deadlineDate = new Date(currentYear, deadline.month - 1, deadline.day);
    const daysUntil = Math.ceil(
      (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Create reminder 30 days before and 7 days before
    if (daysUntil > 0 && (daysUntil <= 30)) {
      const urgency = daysUntil <= 7 ? "⚠️ " : "📅 ";
      await db.insert(notifications).values({
        userId: user.id,
        type: "tax_reminder",
        title: `${urgency}${deadline.name}`,
        message: `${deadline.description}. Due: ${deadlineDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} (${daysUntil} days away)`,
        actionUrl: "/taxes",
        metadata: { deadlineType: deadline.type, dueDate: deadlineDate.toISOString() },
      });
      created.push(deadline.name);
    }
  }

  // Generate NIS payment reminders (14th of each month)
  if (profile) {
    const nisDate = new Date(currentYear, now.getMonth(), NIS_PAYMENT_DUE_DAY);
    // If past this month's date, look at next month
    if (nisDate < now) {
      nisDate.setMonth(nisDate.getMonth() + 1);
    }
    const nisDaysUntil = Math.ceil(
      (nisDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (nisDaysUntil <= 7 && nisDaysUntil > 0) {
      await db.insert(notifications).values({
        userId: user.id,
        type: "tax_reminder",
        title: "💰 NIS Payment Due",
        message: `NIS contribution payment due on the ${NIS_PAYMENT_DUE_DAY}th (${nisDaysUntil} day${nisDaysUntil > 1 ? "s" : ""} away). Don't miss it!`,
        actionUrl: "/taxes",
        metadata: { deadlineType: "nis_payment", dueDate: nisDate.toISOString() },
      });
      created.push("NIS Payment");
    }
  }

  return NextResponse.json({
    created: created.length,
    reminders: created,
  });
}
