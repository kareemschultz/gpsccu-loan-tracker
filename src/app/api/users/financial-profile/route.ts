import { auth } from "@/lib/auth";
import { db, financialProfiles } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const financialProfileSchema = z.object({
    monthlyIncome: z.number().nonnegative().optional(),
    emergencyFund: z.number().nonnegative().optional(),
    investmentPortfolio: z.number().nonnegative().optional(),
    targetExtraPayment: z.number().nonnegative().optional(),
    currentSavingsProgress: z.number().nonnegative().optional(),
    expectedGratuity: z.number().nonnegative().optional(),
    nextGratuityDate: z.string().optional(), // ISO date string
});

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        let profile = await db.query.financialProfiles.findFirst({
            where: eq(financialProfiles.userId, session.user.id),
        });

        // If no profile exists, create one with default values
        if (!profile) {
            const [newProfile] = await db
                .insert(financialProfiles)
                .values({
                    userId: session.user.id,
                })
                .returning();

            profile = newProfile;
        }

        return NextResponse.json(profile);
    } catch (error) {
        console.error("[FINANCIAL_PROFILE_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const validation = financialProfileSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(validation.error.flatten(), { status: 400 });
        }

        const data = validation.data;

        // Check if profile exists
        const existingProfile = await db.query.financialProfiles.findFirst({
            where: eq(financialProfiles.userId, session.user.id),
        });

        let updatedProfile;

        if (existingProfile) {
            // Update existing profile
            [updatedProfile] = await db
                .update(financialProfiles)
                .set({
                    ...(data.monthlyIncome !== undefined ? { monthlyIncome: data.monthlyIncome.toString() } : {}),
                    ...(data.emergencyFund !== undefined ? { emergencyFund: data.emergencyFund.toString() } : {}),
                    ...(data.investmentPortfolio !== undefined ? { investmentPortfolio: data.investmentPortfolio.toString() } : {}),
                    ...(data.targetExtraPayment !== undefined ? { targetExtraPayment: data.targetExtraPayment.toString() } : {}),
                    ...(data.currentSavingsProgress !== undefined ? { currentSavingsProgress: data.currentSavingsProgress.toString() } : {}),
                    ...(data.expectedGratuity !== undefined ? { expectedGratuity: data.expectedGratuity.toString() } : {}),
                    ...(data.nextGratuityDate ? { nextGratuityDate: data.nextGratuityDate } : {}),
                    updatedAt: new Date(),
                })
                .where(eq(financialProfiles.userId, session.user.id))
                .returning();
        } else {
            // Create new profile
            [updatedProfile] = await db
                .insert(financialProfiles)
                .values({
                    userId: session.user.id,
                    ...(data.monthlyIncome !== undefined ? { monthlyIncome: data.monthlyIncome.toString() } : {}),
                    ...(data.emergencyFund !== undefined ? { emergencyFund: data.emergencyFund.toString() } : {}),
                    ...(data.investmentPortfolio !== undefined ? { investmentPortfolio: data.investmentPortfolio.toString() } : {}),
                    ...(data.targetExtraPayment !== undefined ? { targetExtraPayment: data.targetExtraPayment.toString() } : {}),
                    ...(data.currentSavingsProgress !== undefined ? { currentSavingsProgress: data.currentSavingsProgress.toString() } : {}),
                    ...(data.expectedGratuity !== undefined ? { expectedGratuity: data.expectedGratuity.toString() } : {}),
                    ...(data.nextGratuityDate ? { nextGratuityDate: data.nextGratuityDate } : {}),
                })
                .returning();
        }

        return NextResponse.json(updatedProfile);
    } catch (error) {
        console.error("[FINANCIAL_PROFILE_PUT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
