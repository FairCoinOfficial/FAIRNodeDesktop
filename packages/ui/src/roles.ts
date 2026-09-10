import type { NodeRole } from "./types";
import { MASTERNODE_COLLATERAL } from "../../common/src/ipc";

export type RoleMeta = {
  role: NodeRole;
  /** Short title shown on cards and headers. */
  title: string;
  /** One-line plain-language summary. */
  tagline: string;
  /** Longer description for the welcome card. */
  description: string;
  /** Bullet points highlighting what this role does. */
  highlights: string[];
  /** A single emphasised takeaway (e.g. the reward / requirement). */
  reward: string;
  /** Difficulty / effort hint for non-technical users. */
  effort: "Easiest" | "Recommended" | "Advanced";
};

export const ROLE_META: Record<NodeRole, RoleMeta> = {
  node: {
    role: "node",
    title: "Node",
    tagline: "Support the FairCoin network",
    description:
      "Run the FairCoin daemon to help relay and validate transactions. No coins, no wallet setup, nothing to manage — just keep it running and you strengthen the network.",
    highlights: [
      "Relays and validates transactions for everyone",
      "No wallet or coins required",
      "Set it and forget it",
    ],
    reward: "Strengthens and decentralises the network",
    effort: "Easiest",
  },
  staking: {
    role: "staking",
    title: "Staking",
    tagline: "Earn rewards by keeping coins online",
    description:
      "Run a node with your wallet and FAIR coins, with staking switched on. Your online coins help produce blocks and you earn staking rewards in return. Your coins never leave your wallet.",
    highlights: [
      "Earn FAIR staking rewards",
      "Your coins stay in your own wallet",
      "Coins must stay online and mature (~2 hours) before they can stake",
    ],
    reward: "Earn staking rewards on coins you already hold",
    effort: "Recommended",
  },
  masternode: {
    role: "masternode",
    title: "Masternode",
    tagline: "Provide services for bigger rewards",
    description: `Lock ${MASTERNODE_COLLATERAL.toLocaleString()} FAIR as a refundable collateral (a deposit — it is never spent and stays yours) to run a masternode. Masternodes provide extra network services and earn masternode rewards. A guided wizard walks you through every step.`,
    highlights: [
      `${MASTERNODE_COLLATERAL.toLocaleString()} FAIR refundable collateral (a deposit, not a fee)`,
      "Earns masternode rewards and provides network services",
      "Guided step-by-step wizard",
    ],
    reward: `${MASTERNODE_COLLATERAL.toLocaleString()} FAIR deposit → masternode rewards`,
    effort: "Advanced",
  },
};

export const ROLE_ORDER: NodeRole[] = ["node", "staking", "masternode"];
