import { redirect } from "next/navigation";
import { pageMetadata } from "@/lib/site";
import { LoginPanel } from "@/components/LoginPanel";
import { authState, isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Sign in",
  description: "Sign in to an existing Gnoland Ecosystem Tracker admin account.",
  path: "/admin/login",
  index: false,
});

export default async function LoginPage() {
  if (await isAuthed()) redirect("/admin");
  const mode = await authState();
  return <LoginPanel mode={mode} />;
}
