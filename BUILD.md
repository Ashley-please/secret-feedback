# 🚀 Build & Deployment Guide - Encrypted Feedback Box

## 📋 Prerequisites

- Node.js v24+
- MetaMask or compatible Web3 wallet
- Sepolia testnet ETH (for gas fees)
- Infura API key (or other RPC provider)

## 🏗️ Project Structure

```
saver/
├── contracts/              # Smart contracts
│   └── EncryptedFeedback.sol
├── frontend/              # React frontend
│   ├── src/
│   │   ├── pages/        # Main pages
│   │   ├── components/   # Reusable components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── utils/        # Encryption utilities
│   │   └── abi/          # Contract ABIs
│   └── .env              # Environment variables
├── scripts/              # Deployment scripts
│   └── deployFeedback.js
└── hardhat.config.js     # Hardhat configuration
```

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
# Install root dependencies (Hardhat, contracts)
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Configure Environment Variables

**Root `.env` file:**
```env
INFURA_API_KEY=your_infura_key_here
PRIVATE_KEY=your_wallet_private_key_here
ETHERSCAN_API_KEY=your_etherscan_key_here  # Optional for verification
```

**Frontend `.env` file:**
```env
VITE_INFURA_API_KEY=your_infura_key_here
VITE_FEEDBACK_CONTRACT_ADDRESS=deployed_contract_address
```

### 3. Compile Smart Contracts

```bash
# Compile contracts
npx hardhat compile

# Expected output:
# ✓ Compiled 1 Solidity file successfully
```

### 4. Deploy to Sepolia Testnet

```bash
# Deploy EncryptedFeedback contract
npx hardhat run scripts/deployFeedback.js --network sepolia

# The script will:
# 1. Deploy the contract
# 2. Save deployment info to deployment-feedback.json
# 3. Update frontend/.env with contract address
```

**Expected output:**
```
Deploying EncryptedFeedback contract...
EncryptedFeedback deployed to: 0x...
Deployment info saved to deployment-feedback.json
Frontend .env updated with contract address
```

### 5. Verify Contract (Optional)

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

### 6. Build Frontend

```bash
cd frontend

# Development mode
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## 🌐 Running the Application

### Development Mode

```bash
# Terminal 1: Keep this running
cd frontend
npm run dev

# Access at: http://localhost:5173
```

### Production Build

```bash
cd frontend
npm run build

# Output will be in frontend/dist/
# Deploy this folder to your hosting provider
```

## 📦 Deployment Options

### Option 1: Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables in Vercel dashboard:
   - `VITE_INFURA_API_KEY`
   - `VITE_FEEDBACK_CONTRACT_ADDRESS`
4. Deploy!

### Option 2: Netlify

1. Build the frontend: `cd frontend && npm run build`
2. Deploy the `frontend/dist` folder to Netlify
3. Set environment variables in Netlify dashboard

### Option 3: IPFS (Decentralized)

```bash
cd frontend
npm run build

# Install IPFS CLI
npm install -g ipfs

# Add to IPFS
ipfs add -r dist/

# Pin to Pinata or other pinning service
```

## 🧪 Testing the Application

### 1. Create a Feedback Box

1. Connect your wallet (MetaMask on Sepolia)
2. Click "👤 My Boxes"
3. Click "+ New Box"
4. Fill in details and create

### 2. Submit Feedback

1. Copy the Box ID from your created box
2. Switch to a different wallet address
3. Click "📝 Submit Feedback"
4. Enter the Box ID
5. Write feedback and submit

### 3. Decrypt Feedback

1. Switch back to the box owner wallet
2. Go to "👤 My Boxes"
3. Select your box
4. Click "🔓 Decrypt feedback" on any submission
5. Sign the decryption request

## 🔍 Troubleshooting

### Contract Deployment Issues

**Error: Insufficient funds**
- Get Sepolia ETH from faucets:
  - https://sepoliafaucet.com/
  - https://www.alchemy.com/faucets/ethereum-sepolia

**Error: Invalid API key**
- Check your Infura API key in `.env`
- Ensure it's for the correct network (Sepolia)

### Frontend Issues

**Error: Contract not configured**
- Ensure `VITE_FEEDBACK_CONTRACT_ADDRESS` is set in `frontend/.env`
- Restart the dev server after changing `.env`

**Error: Wrong network**
- Switch MetaMask to Sepolia testnet
- Network ID should be 11155111

**Encryption/Decryption fails**
- Ensure you're connected to Sepolia
- Check browser console for detailed errors
- Verify Zama FHE SDK is loading correctly

### Build Issues

**Node version mismatch**
```bash
# Use Node 24
nvm use 24
# or
nvm install 24
nvm use 24
```

**Module not found errors**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# For frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## 📊 Contract Details

**Network:** Ethereum Sepolia Testnet
**Contract:** EncryptedFeedback.sol
**Current Address:** `0x72E5F1BfD1cC6d4Ff67E7Ef755c3cBc58F3EfDbF`

**Key Features:**
- Unlimited feedback boxes per owner
- FHE encryption for feedback content
- Public ratings and sentiment tags
- Owner-only decryption
- Box management (open/close)

## 🔐 Security Notes

1. **Never commit private keys** - Use `.env` files (gitignored)
2. **Testnet only** - This is deployed on Sepolia testnet
3. **Wallet security** - Only connect to trusted dApps
4. **Encryption** - Feedback is encrypted client-side before blockchain submission

## 📝 Environment Variables Reference

### Root `.env`
```env
INFURA_API_KEY=         # Infura project API key
PRIVATE_KEY=            # Deployer wallet private key (with 0x prefix)
ETHERSCAN_API_KEY=      # Optional: for contract verification
```

### Frontend `.env`
```env
VITE_INFURA_API_KEY=                # Infura API key for RPC
VITE_FEEDBACK_CONTRACT_ADDRESS=     # Deployed contract address
```

## 🎯 Next Steps

1. ✅ Deploy contract to Sepolia
2. ✅ Build and test frontend locally
3. ✅ Deploy frontend to hosting provider
4. ✅ Share feedback box IDs with users
5. ✅ Collect and decrypt feedback

## 📚 Additional Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Zama FHE Documentation](https://docs.zama.ai/)
- [Vite Documentation](https://vitejs.dev/)
- [Sepolia Faucets](https://sepoliafaucet.com/)

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review browser console logs
3. Check contract on Sepolia Etherscan
4. Verify all environment variables are set correctly

---

**Built with ❤️ using Zama FHE, Hardhat, React, and Vite**
