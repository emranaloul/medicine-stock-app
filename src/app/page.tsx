import { prisma } from "@/lib/prisma";
import { ensureSeeded } from "@/lib/ensure-seeded";
import { getSessionUser } from "@/lib/auth";
import MedicineDashboard from "@/components/MedicineDashboard";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const memberships = await prisma.familyMember.findMany({
    where: { userId: user.id },
    include: {
      family: {
        include: {
          members: { include: { user: true } },
        },
      },
    },
  });

  await ensureSeeded(null, user.id);
  const medicines = await prisma.medicine.findMany({
    where: { userId: user.id, familyId: null },
    orderBy: [{ status: "asc" }, { category: "asc" }, { id: "asc" }],
  });

  const families = memberships.map((membership) => ({
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
  }));

  return (
    <MedicineDashboard
      initialMedicines={medicines}
      user={{ id: user.id, name: user.name, email: user.email }}
      families={families}
    />
  );
}
