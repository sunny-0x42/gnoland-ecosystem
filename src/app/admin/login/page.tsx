import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginPanel } from "@/components/LoginPanel";
import { authState, isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Sign in · Gnoland Ecosystem Tracker" };

export default async function LoginPage() {
  if (await isAuthed()) redirect("/admin");
  const mode = await authState();
  return <LoginPanel mode={mode} />;
}
