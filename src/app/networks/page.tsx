import { Guide } from "@/components/Guide";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Networks",
  description: "Mainnet, Pearl, and staging on gno.land. Chain ids and what each network is for.",
  path: "/networks",
});

export default function NetworksPage() {
  return (
    <Guide
      title="Networks"
      lede="Three public networks matter for day-to-day use. Older testnets are archives. Facts below follow the networks page in the official docs."
    >
      <table>
        <thead>
          <tr>
            <th>Network</th>
            <th>Chain ID</th>
            <th>RPC</th>
            <th>Use it for</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Mainnet</td>
            <td>gnoland-1</td>
            <td>rpc.gno.land:443</td>
            <td>Real coins. Launched 12 Sep 2026. No faucet. Transfers started locked.</td>
          </tr>
          <tr>
            <td>Pearl</td>
            <td>pearl-1</td>
            <td>rpc.pearl.testnets.gno.land:443</td>
            <td>The current testnet when you need state that stays. Released 26 Aug 2026.</td>
          </tr>
          <tr>
            <td>Staging</td>
            <td>staging</td>
            <td>rpc.staging.gno.land:443</td>
            <td>Latest master. A breaking change can drop data. Block height is not reliable.</td>
          </tr>
        </tbody>
      </table>
      <p>
        A local <code>gnodev</code> chain is for learning on your own machine. Betanet <code>gnoland1</code> is retired.
        Sapphire, Topaz, and earlier TestN networks are archives.
      </p>
      <p>
        <a href="https://docs.gno.land/resources/gnoland-networks" target="_blank" rel="noreferrer">
          Official networks page
        </a>
      </p>
    </Guide>
  );
}
