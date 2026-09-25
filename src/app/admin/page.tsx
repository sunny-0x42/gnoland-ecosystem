import { redirect } from "next/navigation";
import { pageMetadata } from "@/lib/site";
import { AdminDesk } from "@/components/AdminDesk";
import { authState, isAuthed, listUsernames, sessionUsername } from "@/lib/auth";
import { readSubmissions } from "@/lib/submissions";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Admin",
  description: "Edit the Gnoland Ecosystem Tracker.",
  path: "/admin",
  index: false,
});

export default async function AdminPage() {
  if ((await authState()) !== "ready" || !(await isAuthed())) redirect("/admin/login");
  const currentUser = await sessionUsername();
  if (!currentUser) redirect("/admin/login");
  const store = await readStore();
  const submissions = await readSubmissions();
  const accounts = await listUsernames();
  return <AdminDesk initial={store} initialSubmissions={submissions} accounts={accounts} currentUser={currentUser} />;
}
