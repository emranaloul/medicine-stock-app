import { prisma } from "./prisma";
import { INITIAL_MEDICINES } from "./seed-data";

let seededChecked = false;

export async function ensureSeeded() {
  if (seededChecked) return;
  try {
    const count = await prisma.medicine.count();
    if (count === 0) {
      await prisma.medicine.createMany({
        data: INITIAL_MEDICINES,
      });
    }
    seededChecked = true;
  } catch (err) {
    console.error("Auto-seed check failed:", err);
  }
}
