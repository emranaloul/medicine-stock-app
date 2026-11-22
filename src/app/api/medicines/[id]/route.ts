import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, getAuthorizedScope } from "@/lib/pharmacy";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { user, response } = await requireUser();
    if (!user) return response;
    const scope = await getAuthorizedScope(request, user.id);
    if (!scope.valid) {
      return NextResponse.json({ error: "ليس لديك صلاحية لهذا المخزون" }, { status: 403 });
    }

    const { id } = await context.params;
    const medicineId = Number(id);
    if (Number.isNaN(medicineId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.activeIngredient !== undefined)
      data.activeIngredient = String(body.activeIngredient).trim();
    if (body.category !== undefined) data.category = String(body.category).trim();
    if (body.subCategory !== undefined)
      data.subCategory = String(body.subCategory).trim();
    if (body.usage !== undefined) data.usage = String(body.usage).trim();
    if (body.quantity !== undefined)
      data.quantity = Math.max(0, Number(body.quantity));
    if (body.expiryDate !== undefined)
      data.expiryDate = String(body.expiryDate).trim();
    if (body.status !== undefined)
      data.status = body.status === "expired" ? "expired" : "valid";
    if (body.rxRequired !== undefined) data.rxRequired = Boolean(body.rxRequired);
    if (body.notes !== undefined) data.notes = String(body.notes).trim();

    const existing = await prisma.medicine.findFirst({
      where: scope.scope === "family"
        ? { id: medicineId, familyId: scope.familyId, userId: null }
        : { id: medicineId, userId: user.id, familyId: null },
    });
    if (!existing) {
      return NextResponse.json({ error: "الدواء غير موجود في هذا المخزون" }, { status: 404 });
    }

    const updated = await prisma.medicine.update({
      where: { id: medicineId },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/medicines/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update medicine" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { user, response } = await requireUser();
    if (!user) return response;
    const scope = await getAuthorizedScope(request, user.id);
    if (!scope.valid) {
      return NextResponse.json({ error: "ليس لديك صلاحية لهذا المخزون" }, { status: 403 });
    }

    const { id } = await context.params;
    const medicineId = Number(id);
    if (Number.isNaN(medicineId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const existing = await prisma.medicine.findFirst({
      where: scope.scope === "family"
        ? { id: medicineId, familyId: scope.familyId, userId: null }
        : { id: medicineId, userId: user.id, familyId: null },
    });
    if (!existing) {
      return NextResponse.json({ error: "الدواء غير موجود في هذا المخزون" }, { status: 404 });
    }

    if (Number.isNaN(medicineId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await prisma.medicine.delete({
      where: { id: medicineId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/medicines/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete medicine" },
      { status: 500 }
    );
  }
}
