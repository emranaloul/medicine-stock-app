import { NextRequest, NextResponse } from "next/server";
import { prisma } from "./prisma";
import { getSessionUser } from "./auth";

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      ),
    };
  }
  return { user, response: null };
}

export async function getAuthorizedScope(
  request: NextRequest,
  userId: string
) {
  const scope = request.headers.get("x-pharmacy-scope") === "family"
    ? "family"
    : "personal";
  const familyId = request.headers.get("x-family-id");

  if (scope === "personal") {
    return { scope, familyId: null, userId, valid: true };
  }

  if (!familyId) {
    return { scope, familyId: null, userId, valid: false };
  }

  const membership = await prisma.familyMember.findUnique({
    where: { userId_familyId: { userId, familyId } },
  });

  return {
    scope,
    familyId,
    userId,
    valid: Boolean(membership),
  };
}
