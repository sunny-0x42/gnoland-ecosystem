import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminDesk } from "@/components/AdminDesk";
import { authState, isAuthed } from "@/lib/auth";
import { readSubmissions } from "@/lib/submissions";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Admin · Gnoland Ecosystem Tracker" };

export default async function AdminPage() {
  if ((await authState()) !== "ready" || !(await isAuthed())) redirect("/admin/login");
  const store = await readStore();
  const submissions = await readSubmissions();
  return <AdminDesk initial={store} initialSubmissions={submissions} />;
}
