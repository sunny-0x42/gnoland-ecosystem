import { Tracker } from "@/components/Tracker";
import { pageMetadata, SITE_NAME, SITE_URL } from "@/lib/site";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const store = await readStore();
  const description = `${store.copy.subtitle} Directory of realms, packages, and off-chain tools on ${store.meta.chain}.`;
  return pageMetadata({ title: store.copy.title, description, path: "/", absoluteTitle: true });
}

export default async function HomePage() {
  const store = await readStore();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: store.copy.title || SITE_NAME,
    url: SITE_URL,
    description: store.copy.subtitle,
    inLanguage: "en",
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Tracker store={store} />
    </>
  );
}
