import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { INITIAL_MEDICINES } from "@/lib/seed-data";

export async function POST() {
  try {
    await prisma.medicine.deleteMany();
    await prisma.medicine.createMany({
      data: INITIAL_MEDICINES,
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
