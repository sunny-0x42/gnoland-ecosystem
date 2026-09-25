import { SubmitForm } from "@/components/SubmitForm";
import { pageMetadata } from "@/lib/site";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Submit a project",
  description: "Send public details for a Gno.land project. Listings stay off the board until they are reviewed.",
  path: "/submit",
});

export default async function SubmitPage() {
  const store = await readStore();
  return (
    <main className="sheet submit-page">
      <p className="eyebrow">
        <i className="dot" aria-hidden />
        Gnoland Ecosystem Tracker
      </p>
      <h1>Submit a project</h1>
      <p className="subtitle">
        Send the public details for a project on Gno.land. It stays off the board until it is reviewed.
      </p>
      <SubmitForm categories={store.categories} />
      <p className="hint">
        <a href="/">Back to the board</a>
      </p>
    </main>
  );
}
