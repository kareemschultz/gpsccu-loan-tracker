import { auth } from "@/lib/auth";
import { db, loans } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const loanId = searchParams.get("loanId");

        const userLoans = await db.query.loans.findMany({
            where: eq(loans.userId, session.user.id),
            with: { lender: true }
        });

        const projections = userLoans
            .filter(l => !loanId || l.id === loanId)
            .filter(l => l.isActive)
            .map(loan => {
                const currentBalance = parseFloat(loan.currentBalance);
                const rate = parseFloat(loan.interestRate); // Annual rate
                const monthlyPayment = parseFloat(loan.monthlyPayment);
                const monthlyRate = rate / 12;

                // Simple amortization to find months remaining
                // Formula: n = -log(1 - (r*P)/A) / log(1+r)
                // P = principal, A = monthly payment, r = monthly rate

                let monthsRemaining = 0;

                // Edge case: Payment doesn't cover interest
                if (monthlyPayment <= currentBalance * monthlyRate) {
                    monthsRemaining = 999; // Indefinite
                } else {
                    monthsRemaining = -Math.log(1 - (monthlyRate * currentBalance) / monthlyPayment) / Math.log(1 + monthlyRate);
                }

                const payoffDate = new Date();
                payoffDate.setMonth(payoffDate.getMonth() + Math.ceil(monthsRemaining));

                return {
                    loanId: loan.id,
                    vehicle: loan.vehicleDescription,
                    lender: loan.lender?.shortName,
                    currentBalance,
                    monthsRemaining: Math.ceil(monthsRemaining),
                    projectedDate: payoffDate.toISOString(),
                };
            });

        return NextResponse.json(projections);

    } catch (error) {
        console.error("[PAYOFF_PROJECTION]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
