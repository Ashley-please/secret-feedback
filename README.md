# 🗣️ Encrypted Feedback Box

> Anonymous feedback collection with Fully Homomorphic Encryption on Ethereum

A privacy-first decentralized application for collecting anonymous feedback using blockchain and FHE technology. Think of it as Google Forms, but truly private and decentralized!

[![Built with Zama](https://img.shields.io/badge/Built%20with-Zama%20FHE-blue)](https://zama.ai/)
[![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-purple)](https://sepolia.etherscan.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## ✨ Features

### For Box Owners
- 📦 Create unlimited feedback boxes with custom settings
- 📊 View aggregate statistics (ratings, sentiment distribution)
- 🔓 Decrypt individual feedback submissions
- 🎛️ Manage boxes (open/close, view stats)
- 📋 Share box IDs for easy access

### For Feedback Submitters
- 🎭 Submit completely anonymous feedback
- 🔐 Client-side encryption before blockchain submission
- ⭐ Optional ratings (1-5 stars)
- 😊 Optional sentiment tags (Positive/Neutral/Negative)
- 🚫 No identity tracking or linking

### Privacy & Security
- 🔒 Feedback text encrypted with FHE before leaving browser
- 🎯 Only box owners can decrypt their feedback
- 🌐 Decentralized storage on Ethereum blockchain
- 🛡️ True anonymity - no way to link wallet to feedback content
- ✅ Immutable and tamper-proof submissions

## 🚀 Quick Start

See [BUILD.md](BUILD.md) for detailed build and deployment instructions.

```bash
# Install dependencies
npm install && cd frontend && npm install && cd ..

# Deploy contract
npx hardhat run scripts/deployFeedback.js --network sepolia

# Run frontend
cd frontend && npm run dev
```

## 📖 How It Works

1. **Owner creates feedback box** → Gets unique Box ID
2. **Share Box ID** with team/customers/audience
3. **Users submit encrypted feedback** → Anonymous & private
4. **Owner decrypts submissions** → Read feedback securely

## 🏗️ Tech Stack

- **Smart Contracts**: Solidity 0.8.24 + Zama FHE
- **Frontend**: React 18 + TypeScript + Vite
- **Web3**: Wagmi + RainbowKit
- **Styling**: TailwindCSS
- **Network**: Ethereum Sepolia Testnet

## 📱 Live Demo

**Contract Address**: `0x72E5F1BfD1cC6d4Ff67E7Ef755c3cBc58F3EfDbF`  
**Network**: Sepolia Testnet

## 📚 Documentation

- [Build Guide](BUILD.md) - Complete setup and deployment
- [How It Works](frontend/src/pages/HowItWorksPage.tsx) - In-app guide

## 🤝 Contributing

Contributions welcome! Feel free to submit a Pull Request.

## 📄 License

MIT License

## 🙏 Acknowledgments

Built with [Zama FHE](https://zama.ai/), [Hardhat](https://hardhat.org/), and [RainbowKit](https://www.rainbowkit.com/)

---

**Built with ❤️ for privacy-first feedback collection**
