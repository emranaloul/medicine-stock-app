export async function logoutUser(errorMessage: string): Promise<void> {
  const response = await fetch("/api/auth/logout", { method: "POST" });
  if (!response.ok) throw new Error(errorMessage);
}
