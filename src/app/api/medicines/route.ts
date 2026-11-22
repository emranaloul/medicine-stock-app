import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureSeeded } from "@/lib/ensure-seeded";

export async function GET(request: NextRequest) {
  try {
    await ensureSeeded();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const category = searchParams.get("category") || "all";
    const status = searchParams.get("status") || "all";

    const where: Record<string, unknown> = {};

    if (category !== "all") {
      where.category = category;
    }

    if (status === "expired") {
      where.status = "expired";
    } else if (status === "valid") {
      where.status = "valid";
    } else if (status === "rx") {
      where.rxRequired = true;
    } else if (status === "low") {
      where.quantity = { lte: 1 };
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { activeIngredient: { contains: search } },
        { usage: { contains: search } },
        { subCategory: { contains: search } },
        { notes: { contains: search } },
      ];
    }

    const medicines = await prisma.medicine.findMany({
      where,
      orderBy: [{ status: "asc" }, { category: "asc" }, { id: "asc" }],
    });

    return NextResponse.json(medicines);
  } catch (error) {
    console.error("GET /api/medicines error:", error);
    return NextResponse.json(
      { error: "Failed to fetch medicines" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const created = await prisma.medicine.create({
      data: {
        name: String(body.name || "").trim(),
        activeIngredient: String(body.activeIngredient || "").trim(),
        category: String(body.category || "أدوية متخصصة ومستلزمات طبية").trim(),
        subCategory: String(body.subCategory || "عام").trim(),
        usage: String(body.usage || "").trim(),
        quantity: Number(body.quantity ?? 1),
        expiryDate: String(body.expiryDate || "").trim(),
        status: body.status === "expired" ? "expired" : "valid",
        rxRequired: Boolean(body.rxRequired),
        notes: String(body.notes || "").trim(),
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/medicines error:", error);
    return NextResponse.json(
      { error: "Failed to create medicine" },
      { status: 500 }
    );
  }
}
