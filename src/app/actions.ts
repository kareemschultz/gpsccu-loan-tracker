"use server";

import { db, payments, loans } from "@/lib/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { z } from "zod";

const paymentSchema = z.object({
    loanId: z.string().uuid(),
    paymentDate: z.string(),
    amount: z.number().positive(),
    paymentType: z.enum(["regular", "extra"]),
    source: z.enum(["salary", "gratuity", "bonus", "investment", "savings", "other"]),
    notes: z.string().optional(),
});

export async function addPayment(data: z.infer<typeof paymentSchema>) {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    const result = paymentSchema.safeParse(data);

    if (!result.success) {
        return { error: "Invalid data" };
    }

    const { loanId, paymentDate, amount, paymentType, source, notes } = result.data;

    try {
        // strict check ownership
        const loan = await db.query.loans.findFirst({
            where: eq(loans.id, loanId),
        });

        if (!loan || loan.userId !== session.user.id) {
            return { error: "Loan not found" };
        }

        // Insert payment
        await db.insert(payments).values({
            loanId,
            userId: session.user.id,
            paymentDate,
            amount: amount.toString(),
            paymentType,
            source,
            notes: notes || null,
        });

        // Update loan balance
        const currentBalance = parseFloat(loan.currentBalance);
        const newBalance = currentBalance - amount;

        await db
            .update(loans)
            .set({
                currentBalance: newBalance.toFixed(2),
                updatedAt: new Date(),
                // Check if paid off
                paidOffDate: newBalance <= 0 ? paymentDate : undefined,
                isActive: newBalance > 0
            })
            .where(eq(loans.id, loanId));

        revalidatePath("/tracker");
        revalidatePath("/loans");
        revalidatePath(`/loans/${loanId}`);

        return { success: true };
    } catch (error) {
        console.error("Failed to add payment:", error);
        return { error: "Failed to record payment" };
    }
}
