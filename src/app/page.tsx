import type { Metadata } from "next";
import { Tracker } from "@/components/Tracker";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const store = await readStore();
  return { title: store.copy.title, description: store.copy.subtitle };
}

export default async function HomePage() {
  const store = await readStore();
  return <Tracker store={store} />;
}
