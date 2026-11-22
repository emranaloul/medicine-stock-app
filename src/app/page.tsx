import { prisma } from "@/lib/prisma";
import { ensureSeeded } from "@/lib/ensure-seeded";
import MedicineDashboard from "@/components/MedicineDashboard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await ensureSeeded();
  const medicines = await prisma.medicine.findMany({
    orderBy: [{ status: "asc" }, { category: "asc" }, { id: "asc" }],
  });

  return <MedicineDashboard initialMedicines={medicines} />;
}
