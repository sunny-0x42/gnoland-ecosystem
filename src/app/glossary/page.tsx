import { Guide } from "@/components/Guide";
import { pageMetadata } from "@/lib/site";
import { STATUSES } from "@/lib/constants";

const STATUS_HELP: Record<(typeof STATUSES)[number], string> = {
  Live: "A public product people can use.",
  Beta: "Usable, with features still changing.",
  Alpha: "Early and incomplete.",
  Dev: "In active development. Often a repository rather than a finished site.",
  Experimental: "A trial. It may be reset or abandoned.",
  Announced: "Named in public, not shipped as a product yet.",
  "Pending GPAO": "Waiting on a Gno package approval step before it can ship on-chain.",
};

export const metadata = pageMetadata({
  title: "Glossary",
  description: "What the status words, network dots, realms, and token names mean on this board.",
  path: "/glossary",
});

export default function GlossaryPage() {
  return (
    <Guide
      title="Glossary"
      lede="The words on the board. A green or yellow dot on a logo is the network. This page writes those words out."
    >
      <h2>Status</h2>
      <dl>
        {STATUSES.map((status) => (
          <div key={status}>
            <dt>{status}</dt>
            <dd>{STATUS_HELP[status]}</dd>
          </div>
        ))}
      </dl>
      <h2>Network dots</h2>
      <p>
        A green dot on the logo means Mainnet. A yellow dot means Testnet. No dot means this tracker has not confirmed
        a network. Hover the dot to read the word. The project card also prints Mainnet or Testnet next to the status.
      </p>
      <h2>Code</h2>
      <dl>
        <div>
          <dt>Realm</dt>
          <dd>An on-chain package under /r/ that can hold state and render a page.</dd>
        </div>
        <div>
          <dt>Package</dt>
          <dd>A pure library under /p/. Other code imports it. It does not keep its own account state.</dd>
        </div>
        <div>
          <dt>GRC20</dt>
          <dd>The fungible token pattern: name, symbol, decimals, and transfer.</dd>
        </div>
        <div>
          <dt>GRC721</dt>
          <dd>The name used for non-fungible tokens. The demo package is not a finished standard.</dd>
        </div>
      </dl>
    </Guide>
  );
}
