import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/pharmacy";

export async function GET() {
  const { user, response } = await requireUser();
  if (!user) return response;

  const memberships = await prisma.familyMember.findMany({
    where: { userId: user.id },
    include: { family: { include: { members: { include: { user: true } } } } },
  });

  return NextResponse.json({
    families: memberships.map((membership) => ({
      id: membership.family.id,
      name: membership.family.name,
      inviteCode: membership.family.inviteCode,
      role: membership.role,
      members: membership.family.members.map((member) => ({
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        role: member.role,
      })),
    })),
  });
}

export async function POST(request: NextRequest) {
  const { user, response } = await requireUser();
  if (!user) return response;

  try {
    const body = await request.json();
    const action = body.action;

    if (action === "create") {
      const name = String(body.name || "").trim();
      if (!name) {
        return NextResponse.json({ error: "اسم الصيدلية مطلوب" }, { status: 400 });
      }

      const family = await prisma.family.create({
        data: {
          name,
          inviteCode: randomBytes(4).toString("hex").toUpperCase(),
          members: {
            create: { userId: user.id, role: "ADMIN" },
          },
        },
      });

      await prisma.medicine.updateMany({
        where: { familyId: null, userId: null },
        data: { familyId: family.id },
      });

      return NextResponse.json({ family }, { status: 201 });
    }

    if (action === "join") {
      const inviteCode = String(body.inviteCode || "").trim().toUpperCase();
      const family = await prisma.family.findUnique({ where: { inviteCode } });
      if (!family) {
        return NextResponse.json({ error: "رمز الدعوة غير صحيح" }, { status: 404 });
      }

      await prisma.familyMember.upsert({
        where: { userId_familyId: { userId: user.id, familyId: family.id } },
        update: {},
        create: { userId: user.id, familyId: family.id, role: "MEMBER" },
      });

      return NextResponse.json({ family });
    }

    return NextResponse.json({ error: "الإجراء غير معروف" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/families error:", error);
    return NextResponse.json({ error: "تعذر تنفيذ طلب العائلة" }, { status: 500 });
  }
}
