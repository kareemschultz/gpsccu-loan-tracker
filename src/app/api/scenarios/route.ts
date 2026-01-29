import { auth } from "@/lib/auth";
import { db, paymentScenarios } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const createScenarioSchema = z.object({
    loanId: z.string().uuid(),
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    extraAmount: z.number().positive("Extra amount must be positive"),
    frequency: z.number().int().min(1, "Frequency must be at least 1 month").default(1),
    startMonth: z.number().int().min(1).default(1),
});

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const loanId = searchParams.get("loanId");

        if (!loanId) {
            return new NextResponse("Loan ID is required", { status: 400 });
        }

        const scenarios = await db.query.paymentScenarios.findMany({
            where: eq(paymentScenarios.loanId, loanId),
            orderBy: (scenarios, { desc }) => [desc(scenarios.createdAt)],
        });

        // Filter by user ownership (though loanId check effectively does this if we trust the input, better to be safe)
        // The query above doesn't check userId, so let's check if the LOAN belongs to the user or if we should add userId to the where clause.
        // The schema has userId in paymentScenarios.
        const userScenarios = scenarios.filter(s => s.userId === session.user.id);

        return NextResponse.json(userScenarios);
    } catch (error) {
        console.error("[SCENARIOS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const validation = createScenarioSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(validation.error.flatten(), { status: 400 });
        }

        const { loanId, name, description, extraAmount, frequency, startMonth } = validation.data;

        // Verify loan ownership
        const loan = await db.query.loans.findFirst({
            where: (loans, { eq, and }) => and(eq(loans.id, loanId), eq(loans.userId, session.user.id))
        });

        if (!loan) {
            return new NextResponse("Loan not found or unauthorized", { status: 404 });
        }

        const newScenario = await db.insert(paymentScenarios).values({
            userId: session.user.id,
            loanId,
            name,
            description,
            extraAmount: extraAmount.toString(),
            frequency,
            startMonth,
            isActive: false, // Default to inactive
        }).returning();

        return NextResponse.json(newScenario[0]);
    } catch (error) {
        console.error("[SCENARIOS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
