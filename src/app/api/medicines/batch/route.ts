import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, getAuthorizedScope } from "@/lib/pharmacy";

export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requireUser();
    if (!user) return response;
    const scope = await getAuthorizedScope(request, user.id);
    if (!scope.valid) {
      return NextResponse.json({ error: "ليس لديك صلاحية لهذا المخزون" }, { status: 403 });
    }

    const body = await request.json();
    const items = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) {
      return NextResponse.json({ error: "لا توجد عناصر للحفظ" }, { status: 400 });
    }

    const created = await prisma.$transaction(
      items.map((item: Record<string, unknown>) =>
        prisma.medicine.create({
          data: {
            name: String(item.name || "").trim(),
            activeIngredient: String(item.activeIngredient || "").trim(),
            category: String(item.category || "أدوية متخصصة ومستلزمات طبية").trim(),
            subCategory: String(item.subCategory || "عام").trim(),
            usage: String(item.usage || "").trim(),
            quantity: Math.max(0, Number(item.quantity ?? 1)),
            expiryDate: String(item.expiryDate || "").trim(),
            status: item.status === "expired" ? "expired" : "valid",
            rxRequired: Boolean(item.rxRequired),
            notes: String(item.notes || "").trim(),
            familyId: scope.familyId,
            userId: scope.scope === "personal" ? user.id : null,
          },
        })
      )
    );

    return NextResponse.json({ created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/medicines/batch error:", error);
    return NextResponse.json({ error: "تعذر حفظ العناصر المحددة" }, { status: 500 });
  }
}
