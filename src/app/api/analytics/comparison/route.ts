import { auth } from "@/lib/auth";
import { db, loans } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const userLoans = await db.query.loans.findMany({
            where: eq(loans.userId, session.user.id),
            with: { lender: true }
        });

        // Prepare data for comparison chart (e.g., Interest Rate vs Total Amount)
        const comparisonData = userLoans.map(loan => ({
            name: loan.vehicleDescription || "Loan",
            lender: loan.lender?.shortName,
            originalAmount: parseFloat(loan.originalAmount),
            currentBalance: parseFloat(loan.currentBalance),
            interestRate: parseFloat(loan.interestRate) * 100, // Convert to percentage
            monthlyPayment: parseFloat(loan.monthlyPayment)
        }));

        return NextResponse.json(comparisonData);

    } catch (error) {
        console.error("[ANALYTICS_COMPARISON]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
