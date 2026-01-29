import { auth } from "@/lib/auth";
import { db, loans, financialProfiles, payments } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const userId = session.user.id;

        const [userLoans, userProfile, userPayments] = await Promise.all([
            db.query.loans.findMany({ where: eq(loans.userId, userId) }),
            db.query.financialProfiles.findFirst({ where: eq(financialProfiles.userId, userId) }),
            db.query.payments.findMany({ where: eq(payments.userId, userId) })
        ]);

        let score = 500; // Base score (credit-score style)
        const maxScore = 850;

        // 1. Loan Progress Impact
        const totalOriginal = userLoans.reduce((sum, l) => sum + parseFloat(l.originalAmount), 0);
        const totalCurrent = userLoans.reduce((sum, l) => sum + parseFloat(l.currentBalance), 0);
        const totalPaid = totalOriginal - totalCurrent;
        const percentPaid = totalOriginal > 0 ? (totalPaid / totalOriginal) : 0;

        score += Math.min(200, percentPaid * 200);

        // 2. Active Loans Impact
        const activeLoans = userLoans.filter(l => l.isActive).length;
        // Slight deduction for too many active loans, or bonus for few
        if (activeLoans === 0 && userLoans.length > 0) score += 100; // Debt free!
        else if (activeLoans === 1) score += 50;
        else if (activeLoans > 3) score -= 20;

        // 3. Payment Consistency (Simple heuristic: has payments in last 3 months?)
        // This is a placeholder logic as we don't have full history analysis yet
        if (userPayments.length > 0) {
            score += 30;
        }

        // 4. Financial Cushion
        if (userProfile) {
            const emergencyFund = parseFloat(userProfile.emergencyFund || "0");
            if (emergencyFund > 100000) score += 50; // Arbitrary threshold for GYD
        }

        return NextResponse.json({
            score: Math.min(Math.round(score), maxScore),
            maxScore,
            details: {
                activeLoans,
                totalDebt: totalCurrent,
                progress: percentPaid,
            }
        });

    } catch (error) {
        console.error("[HEALTH_SCORE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
