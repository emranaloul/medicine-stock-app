import { prisma } from "./prisma";
import { INITIAL_MEDICINES } from "./seed-data";

export async function ensureSeeded(familyId: string | null = null, userId: string | null = null) {
  try {
    const where =
      familyId
        ? { familyId, userId: null }
        : userId
          ? { userId, familyId: null }
          : { familyId: null, userId: null };
    const count = await prisma.medicine.count({ where });
    if (count === 0) {
      await prisma.medicine.createMany({
        data: INITIAL_MEDICINES.map((item) => ({
          ...item,
          familyId,
          userId,
        })),
      });
    }
  } catch (err) {
    console.error("Auto-seed check failed:", err);
  }
}
