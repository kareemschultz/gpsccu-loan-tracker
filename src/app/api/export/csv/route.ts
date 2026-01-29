import { auth } from "@/lib/auth";
import { db, loans, payments } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { type } = await req.json(); // 'loans' or 'payments'

        let csvContent = "";

        if (type === 'loans') {
            const userLoans = await db.query.loans.findMany({
                where: eq(loans.userId, session.user.id),
                with: { lender: true }
            });

            const headers = ["Loan ID", "Lender", "Vehicle", "Original Amount", "Current Balance", "Interest Rate", "Monthly Payment", "Status"];
            csvContent = headers.join(",") + "\\n";

            userLoans.forEach(loan => {
                const row = [
                    loan.id,
                    loan.lender?.name || "Unknown",
                    `"${loan.vehicleDescription || ""}"`, // Quote to handle commas
                    loan.originalAmount,
                    loan.currentBalance,
                    loan.interestRate,
                    loan.monthlyPayment,
                    loan.isActive ? "Active" : "Paid Off"
                ];
                csvContent += row.join(",") + "\\n";
            });
        } else if (type === 'payments') {
            const userPayments = await db.query.payments.findMany({
                where: eq(payments.userId, session.user.id),
                orderBy: (payments, { desc }) => [desc(payments.paymentDate)],
            });

            const headers = ["Payment ID", "Date", "Amount", "Type", "Source", "Notes"];
            csvContent = headers.join(",") + "\\n";

            userPayments.forEach(payment => {
                const row = [
                    payment.id,
                    payment.paymentDate ? new Date(payment.paymentDate).toISOString().split('T')[0] : "",
                    payment.amount,
                    payment.paymentType,
                    payment.source,
                    `"${payment.notes || ""}"`
                ];
                csvContent += row.join(",") + "\\n";
            });
        } else {
            return new NextResponse("Invalid export type", { status: 400 });
        }

        // Return as a downloadable CSV file
        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="loan-tracker-${type}-${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });

    } catch (error) {
        console.error("[EXPORT_CSV]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
