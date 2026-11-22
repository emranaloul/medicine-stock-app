import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { INITIAL_MEDICINES } from "@/lib/seed-data";
import { requireUser, getAuthorizedScope } from "@/lib/pharmacy";

export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requireUser();
    if (!user) return response;
    const scope = await getAuthorizedScope(request, user.id);
    if (!scope.valid) {
      return NextResponse.json({ error: "ليس لديك صلاحية لهذا المخزون" }, { status: 403 });
    }

    await prisma.medicine.deleteMany({
      where: scope.scope === "family"
        ? { familyId: scope.familyId, userId: null }
        : { userId: user.id, familyId: null },
    });
    await prisma.medicine.createMany({
      data: INITIAL_MEDICINES.map((item) => ({
        ...item,
        familyId: scope.familyId,
        userId: scope.scope === "personal" ? user.id : null,
      })),
    });
    return NextResponse.json({
      success: true,
      count: INITIAL_MEDICINES.length,
    });
  } catch (error) {
    console.error("POST /api/seed error:", error);
    return NextResponse.json(
      { error: "Failed to reset seed data" },
      { status: 500 }
    );
  }
}
