# 🛡️ FreelanceGuard

> AI-powered USDC escrow for cross-border freelancers, built on Arc blockchain.

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://freelanceguard.vercel.app)
[![Arc](https://img.shields.io/badge/Built_on-Arc-blue)](https://arc.network)
[![Circle](https://img.shields.io/badge/Powered_by-Circle-2e77d0)](https://developers.circle.com)
[![Hackathon](https://img.shields.io/badge/Programmable_Money-Hackathon_2026-orange)](https://encodeclub.com)

## 🎯 The Problem

- 1.5M+ Vietnamese freelancers lose **15-20% to Upwork/Fiverr fees** + 3-5% to wire transfers
- Payments take **2-4 weeks** to arrive across borders
- Platform disputes are opaque and often unfair
- Reputation is trapped inside walled gardens

## 💡 The Solution

FreelanceGuard makes cross-border freelance payments **fast, fair, and cheap**:

- ⚡ **Sub-3-second settlement** — USDC on Arc blockchain
- 💰 **2% platform fee** — vs 15-20% on Upwork
- 🤖 **AI Judge Agent** — impartial dispute resolution using GPT-4o-mini
- 🛡️ **On-chain reputation** — portable via ERC-8004-inspired AgentRegistry
- 📧 **Email onboarding** — no wallet, no seed phrase (Circle User-Controlled Wallets)
- ⚡ **Gasless UX** — Circle Paymaster sponsors all transactions

## 🎬 Demo

- **Live**: [https://freelanceguard.vercel.app](https://freelanceguard.vercel.app)
- **Demo Mode**: Click "Try Demo" on landing page — no signup required
- **Video Pitch**: [Coming soon]

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│   User (Web)    │────▶│  Next.js 16  │────▶│  Circle Wallet  │
└─────────────────┘     └──────┬───────┘     └────────┬────────┘
                               │                       │
                    ┌──────────┼──────────┐           │
                    ▼          ▼          ▼           ▼
              ┌──────────┐ ┌────────┐ ┌────────┐ ┌──────────┐
              │ Supabase │ │ OpenAI │ │  Arc   │ │ AI Judge │
              │ Postgres │ │ GPT-4o │ │Testnet │ │  (API)   │
              └──────────┘ └────────┘ └────────┘ └──────────┘
                                          │
                          ┌───────────────┴──────────────┐
                          ▼                              ▼
                  ┌────────────────┐            ┌────────────────┐
                  │  JobEscrow.sol │            │AgentRegistry.sol│
                  │  (ERC-8183)    │◀──records──│  (ERC-8004)    │
                  └────────────────┘            └────────────────┘
```

## 🔧 Tech Stack

- **Frontend**: Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS, shadcn/ui
- **Blockchain**: Arc Testnet, Viem, Hardhat, Solidity 0.8.24, OpenZeppelin
- **Wallet**: Circle User-Controlled Wallets (SCA, gasless, email auth)
- **AI**: OpenAI GPT-4o-mini with structured JSON output
- **Database**: Supabase (Postgres + Realtime for chat)
- **Auth**: JWT sessions with `jose` (HTTP-only cookies)
- **Deployment**: Vercel + GitHub

## 📜 Smart Contracts (Arc Testnet, Chain ID 5042002)

| Contract | Address | Standard |
|----------|---------|----------|
| JobEscrow | [`0xE0a2BDd5b0b0E75aFfAEcf331bEE13FE7a3D9803`](https://testnet.arcscan.app/address/0xE0a2BDd5b0b0E75aFfAEcf331bEE13FE7a3D9803) | ERC-8183-inspired |
| AgentRegistry | [`0xb8b2e7D1c46D5BdC49BBb4ab2fE72e6a21FD9C21`](https://testnet.arcscan.app/address/0xb8b2e7D1c46D5BdC49BBb4ab2fE72e6a21FD9C21) | ERC-8004-inspired |

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Supabase account
- OpenAI API key
- Circle Developer Console account
- Arc Testnet wallet with USDC (via [Circle Faucet](https://faucet.circle.com))

### Setup

```bash
git clone https://github.com/tranhop26/freelanceguard.git
cd freelanceguard
npm install
cp .env.example .env.local
# Edit .env.local with your credentials
npm run dev
```

### Deploy Contracts

```bash
cd contracts
npm install
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.ts --network arcTestnet
```

## 🏆 Hackathon Submission

- **Event**: Programmable Money Hackathon (July 13 – Aug 20, 2026)
- **Organizers**: Encode Club × Arc × Circle
- **Track**: Agentic Economy
- **Team**: [@tranhop26](https://github.com/tranhop26)

## 📄 License

MIT

---

Built with ❤️ for freelancers everywhere.
