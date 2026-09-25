export const STATUSES = [
  "Live",
  "Beta",
  "Alpha",
  "Dev",
  "Experimental",
  "Announced",
  "Pending GPAO",
] as const;
export const CATEGORIES = [
  "Infra",
  "Wallet",
  "Explorer",
  "Validators",
  "DeFi",
  "Bridge",
  "Launchpad",
  "Marketplace",
  "Social",
  "Game",
  "NFT",
  "DevTool",
  "Governance",
  "Community",
] as const;

export const CATEGORY_BLURBS: Record<string, string> = {
  Infra: "Nodes, clients, and the software that keeps the chain running.",
  Wallet: "Keys and apps that hold coins and sign transactions.",
  Explorer: "Read blocks, transactions, and realms.",
  Validators: "Watch validator sets and node health.",
  DeFi: "Swap, lend, and move value on-chain.",
  Bridge: "Move assets between Gno and other chains.",
  Launchpad: "Create and trade new tokens.",
  Marketplace: "List and buy unique items.",
  Social: "Forums, claims, and social apps.",
  Game: "Games and on-chain play.",
  NFT: "Collections and minting.",
  DevTool: "Editors, clients, and local development.",
  Governance: "DAOs, voting, and chain governance.",
  Community: "Hubs, events, and contribution tools.",
};

export type Status = (typeof STATUSES)[number];
export type Category = (typeof CATEGORIES)[number];
export type CategoryFilter = Category | "All";

export const ADMIN_USERNAME = "admin";
export const COOKIE_NAME = "gnoland_admin";
export const SESSION_MS = 7 * 24 * 60 * 60 * 1000;
