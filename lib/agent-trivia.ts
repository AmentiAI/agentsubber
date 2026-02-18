export type TriviaQuestion = {
  id: number;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  answer: "A" | "B" | "C" | "D";
  explanation: string;
};

export const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  {
    id: 0,
    question: "What does NFT stand for?",
    options: {
      A: "Never Forget Transactions",
      B: "Network File Token",
      C: "Non-Fungible Token",
      D: "Null Field Transfer",
    },
    answer: "C",
    explanation:
      "NFT = Non-Fungible Token — a unique, indivisible digital asset on a blockchain.",
  },
  {
    id: 1,
    question: "Which consensus mechanism does Solana use?",
    options: {
      A: "Proof of Work",
      B: "Proof of History + Proof of Stake",
      C: "Delegated Proof of Stake",
      D: "Proof of Authority",
    },
    answer: "B",
    explanation:
      "Solana uses Proof of History (PoH) combined with Tower BFT (a variant of PoS).",
  },
  {
    id: 2,
    question: "What is a 'floor price' in the NFT context?",
    options: {
      A: "The highest price an NFT sold for",
      B: "The minimum price to buy any NFT in a collection",
      C: "The price set by the creator",
      D: "The gas fee to mint",
    },
    answer: "B",
    explanation:
      "Floor price is the lowest listed price in a collection — the cheapest entry point.",
  },
  {
    id: 3,
    question: "What is an 'allowlist' (whitelist) in NFT minting?",
    options: {
      A: "A list of banned wallets",
      B: "A public spreadsheet of holders",
      C: "A list of wallets approved to mint before public sale",
      D: "A smart contract audit list",
    },
    answer: "C",
    explanation:
      "Allowlist wallets get early/guaranteed access to mint, often at a lower price.",
  },
  {
    id: 4,
    question: "What is 'rarity' in an NFT collection?",
    options: {
      A: "The age of the NFT",
      B: "How uncommon an NFT's traits are compared to the rest of the collection",
      C: "The number of owners",
      D: "The mint price in SOL",
    },
    answer: "B",
    explanation:
      "Rarity measures how uncommon the combination of traits is — rarer = often more valuable.",
  },
  {
    id: 5,
    question: "What does 'WAGMI' stand for in crypto culture?",
    options: {
      A: "We All Got Major Investments",
      B: "We're All Going to Make It",
      C: "Wallets And Gas Market Index",
      D: "Wait And Get More Information",
    },
    answer: "B",
    explanation:
      "WAGMI = We're All Going to Make It — a rallying cry of optimism in the NFT community.",
  },
  {
    id: 6,
    question: "What is a 'rug pull' in crypto?",
    options: {
      A: "When a project removes liquidity and abandons holders",
      B: "A feature that reverts failed transactions",
      C: "A staking mechanism that locks tokens",
      D: "A type of cross-chain bridge",
    },
    answer: "A",
    explanation:
      "Rug pull = devs drain funds and abandon the project, leaving holders with worthless assets.",
  },
  {
    id: 7,
    question: "In Solana NFTs, what is 'Metaplex'?",
    options: {
      A: "A hardware wallet",
      B: "A Solana block explorer",
      C: "The NFT standard and tooling for Solana",
      D: "A DEX on Solana",
    },
    answer: "C",
    explanation:
      "Metaplex is the primary NFT standard and minting infrastructure on Solana.",
  },
  {
    id: 8,
    question: "What does 'diamond hands' mean?",
    options: {
      A: "Selling quickly for profit",
      B: "Holding assets despite volatility or loss",
      C: "A type of NFT rarity",
      D: "A multi-sig wallet setup",
    },
    answer: "B",
    explanation:
      "Diamond hands = holding through extreme volatility, refusing to sell.",
  },
  {
    id: 9,
    question: "What is the Bitcoin halving?",
    options: {
      A: "Splitting a Bitcoin wallet in two",
      B: "Reducing miner fees by 50%",
      C: "The event every ~4 years where BTC block rewards are cut in half",
      D: "A protocol upgrade that doubles transaction speed",
    },
    answer: "C",
    explanation:
      "Every ~210,000 blocks (~4 years), BTC mining rewards halve — reducing new supply inflation.",
  },
  {
    id: 10,
    question: "What is a 'floor sweep' in NFTs?",
    options: {
      A: "Cleaning up spam listings",
      B: "Bulk-buying the cheapest NFTs in a collection",
      C: "Delisting your NFTs",
      D: "A smart contract security audit",
    },
    answer: "B",
    explanation:
      "Floor sweep = buying up all the lowest-priced listings, raising the floor price.",
  },
  {
    id: 11,
    question: "What does 'GM' mean in Web3 culture?",
    options: {
      A: "Gas Money",
      B: "Good Morning",
      C: "Governance Module",
      D: "Generative Mint",
    },
    answer: "B",
    explanation:
      "GM = Good Morning — a daily greeting ritual in NFT/crypto communities showing you're active.",
  },
];

export function getRandomQuestions(count: number = 1): TriviaQuestion[] {
  const shuffled = [...TRIVIA_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
