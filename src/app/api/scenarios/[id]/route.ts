import { auth } from "@/lib/auth";
import { db, paymentScenarios } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateScenarioSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    extraAmount: z.number().positive().optional(),
    frequency: z.number().int().min(1).optional(),
    startMonth: z.number().int().min(1).optional(),
    isActive: z.boolean().optional(),
});

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;

        const scenario = await db.query.paymentScenarios.findFirst({
            where: and(
                eq(paymentScenarios.id, id),
                eq(paymentScenarios.userId, session.user.id)
            ),
        });

        if (!scenario) {
            return new NextResponse("Not Found", { status: 404 });
        }

        return NextResponse.json(scenario);
    } catch (error) {
        console.error("[SCENARIO_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const validation = updateScenarioSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(validation.error.flatten(), { status: 400 });
        }

        const { extraAmount, ...otherFields } = validation.data;

        // Check ownership
        const existingScenario = await db.query.paymentScenarios.findFirst({
            where: and(
                eq(paymentScenarios.id, id),
                eq(paymentScenarios.userId, session.user.id)
            ),
        });

        if (!existingScenario) {
            return new NextResponse("Not Found", { status: 404 });
        }

        const updatedScenario = await db
            .update(paymentScenarios)
            .set({
                ...otherFields,
                ...(extraAmount ? { extraAmount: extraAmount.toString() } : {}),
                updatedAt: new Date(),
            })
            .where(eq(paymentScenarios.id, id))
            .returning();

        return NextResponse.json(updatedScenario[0]);
    } catch (error) {
        console.error("[SCENARIO_PUT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;

        // Check ownership
        const existingScenario = await db.query.paymentScenarios.findFirst({
            where: and(
                eq(paymentScenarios.id, id),
                eq(paymentScenarios.userId, session.user.id)
            ),
        });

        if (!existingScenario) {
            return new NextResponse("Not Found", { status: 404 });
        }

        await db.delete(paymentScenarios).where(eq(paymentScenarios.id, id));

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[SCENARIO_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
