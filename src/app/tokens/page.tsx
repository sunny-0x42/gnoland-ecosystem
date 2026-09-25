import type { Metadata } from "next";
import { Guide } from "@/components/Guide";

export const metadata: Metadata = {
  title: "Tokens · Gnoland Ecosystem Tracker",
  description: "GNOT is the fee unit. GRC20 is the fungible token pattern. No prices or supply figures.",
};

export default function TokensPage() {
  return (
    <Guide
      title="Tokens and standards"
      lede="This page names the fee unit and the token pattern. It does not list a price, a supply, or a market cap."
    >
      <h2>GNOT</h2>
      <p>
        GNOT is the coin used to pay fees. Amounts in transactions are written in <code>ugnot</code> (micro-GNOT). Gas
        price is a live network value, queried with <code>gnokey query auth/gasprice</code>, and it changes with
        demand. This tracker does not print that number.
      </p>
      <h2>GRC20</h2>
      <p>
        GRC20 is the fungible token pattern: name, symbol, decimals, and transfer. The package path used across the
        ecosystem is <code>gno.land/p/nt/grc20/v0</code>.
      </p>
      <h2>GRC721</h2>
      <p>
        GRC721 is the name used for non-fungible tokens. A demo package exists at{" "}
        <code>gno.land/p/demo/tokens/grc721</code>. That demo is not a finished standard.
      </p>
      <p>
        <a href="https://docs.gno.land/resources/gas-fees" target="_blank" rel="noreferrer">
          Gas fees
        </a>
        {" · "}
        <a href="https://docs.gno.land/resources/storage-deposit" target="_blank" rel="noreferrer">
          Storage deposit
        </a>
      </p>
    </Guide>
  );
}
