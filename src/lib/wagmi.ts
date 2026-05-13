import { createConfig, http, injected } from "wagmi";
import { arcTestnet } from "./arc";

export const wagmiConfig = createConfig({
  chains: [arcTestnet],
  connectors: [injected({ shimDisconnect: true })],
  transports: {
    [arcTestnet.id]: http(),
  },
  ssr: true,
});
