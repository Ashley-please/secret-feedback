# 🔒 Encrypted Tasks - Privacy-First Task Management

A decentralized encrypted task manager using **Fully Homomorphic Encryption (FHE)** technology. Your task descriptions are encrypted on-chain and only you can decrypt them.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Solidity](https://img.shields.io/badge/solidity-^0.8.24-green.svg)
![FHE](https://img.shields.io/badge/FHE-Zama-yellow.svg)

## 🚀 Live Demo

**Contract Address (Sepolia):** `0x0ED1a54FEAA259BA110720D7ec420d76397343Ce`

## ✨ Features

### 🔒 Privacy-First
- **End-to-End Encryption**: Task descriptions are encrypted using FHE before being stored on-chain
- **Zero-Knowledge**: No one can read your task descriptions except you
- **Decentralized**: Your data lives on the blockchain, not on centralized servers
- **Selective Privacy**: Only descriptions are encrypted; titles and metadata remain public for easy organization

### ✅ Task Management
- **Create & Update**: Add tasks with encrypted descriptions
- **Status Tracking**: Todo → In Progress → Completed workflow
- **Priority Levels**: High, Medium, Low priority tasks
- **Due Dates**: Set deadlines and see "Today" or "Tomorrow" labels
- **Categories & Tags**: Organize tasks by project and tags
- **Favorites**: Star important tasks for quick access
- **Archive**: Keep your workspace clean

### 🎨 Modern UI
- **Linear-Inspired**: Clean, minimal design with dark mode
- **Keyboard Shortcuts**: ⌘K (command palette), ⌘N (new task), Esc (close)
- **Command Palette**: Quick actions and navigation
- **Responsive**: Works beautifully on desktop and mobile
- **Real-time Stats**: Dashboard showing task counts by status

## 🏗️ Architecture

### Smart Contract
- **EncryptedTasks.sol**: Main contract for storing encrypted tasks
- **Zama FHE**: Uses `euint32[]` for encrypted description chunks
- **Gas Optimized**: Efficient storage and retrieval

### Frontend
- **React + TypeScript**: Modern, type-safe frontend
- **Vite**: Lightning-fast development and builds
- **TailwindCSS**: Beautiful, responsive styling
- **Wagmi + RainbowKit**: Seamless wallet integration
- **fhevmjs**: Client-side FHE encryption/decryption

## 🚀 Quick Start

### Prerequisites
- Node.js v18+ and npm
- MetaMask or another Web3 wallet
- Sepolia testnet ETH (for deployment)
- Infura API key

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd saver

# Install dependencies
npm install
cd frontend && npm install && cd ..
```

### Configuration

1. **Create `.env` file in root:**
```env
PRIVATE_KEY=your_private_key_here
INFURA_API_KEY=your_infura_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key (optional)
```

2. **Create `frontend/.env` file:**
```env
VITE_CONTRACT_ADDRESS=will_be_set_after_deployment
VITE_INFURA_API_KEY=your_infura_api_key
```

### Deployment

```bash
# Compile contracts
npx hardhat compile

# Deploy to Sepolia testnet
npx hardhat run scripts/deploy.js --network sepolia

# The contract address will be automatically added to frontend/.env
```

### Run Locally

```bash
# Start the frontend
cd frontend
npm run dev

# Open http://localhost:5173 in your browser
```

## 📖 Usage

### Creating a Task

1. **Connect Wallet**: Click "Connect Wallet" in the top right
2. **New Task**: Click "+ New Task" or press ⌘N
3. **Fill Details**: 
   - Title (public)
   - Description (encrypted 🔐)
   - Priority, due date, category, tags, color
4. **Save**: Task description is encrypted and stored on-chain

### Managing Tasks

- **Change Status**: Click the circle icon to cycle through Todo → In Progress → Completed
- **Decrypt Description**: Click "🔓 Decrypt description" to view encrypted content
- **Favorite**: Click the star icon to mark as favorite
- **Delete**: Click the trash icon to remove a task
- **Filter Views**: All, Today, Upcoming, Completed

### Keyboard Shortcuts

- **⌘K**: Open command palette
- **⌘N**: Create new task
- **Esc**: Close modals

## 🔧 Smart Contract API

### Core Functions

```solidity
// Create a new encrypted task
function createTask(
    externalEuint32[] calldata encryptedChunks,
    bytes calldata inputProof,
    string calldata title,
    Priority priority,
    uint256 dueDate,
    string calldata category,
    string[] calldata tags,
    string calldata color
) external returns (uint256 taskId)

// Update task status
function updateTaskStatus(uint256 taskId, TaskStatus status) external

// Update task priority
function updateTaskPriority(uint256 taskId, Priority priority) external

// Delete a task
function deleteTask(uint256 taskId) external

// Toggle favorite
function toggleFavorite(uint256 taskId, bool favorite) external

// Toggle archive
function toggleArchive(uint256 taskId, bool archived) external

// Get all your tasks (metadata only)
function getMyTasks() external view returns (TaskMetadata[] memory)

// Get encrypted content for decryption
function getTaskContent(uint256 taskId) 
    external view 
    returns (bytes32[] memory handles, TaskMetadata memory metadata)

// Get user statistics
function getMyStats() external view returns (UserStats memory)
```

## 🛡️ Security

- **FHE Encryption**: Task descriptions are encrypted using Zama's FHE
- **On-Chain Storage**: Data is stored on the blockchain, not centralized servers
- **No Plaintext**: Plaintext descriptions never touch the blockchain
- **Client-Side Encryption**: Encryption happens in your browser before sending to chain

## 📊 What's Encrypted vs Public

### 🔐 Encrypted (Private)
- Task descriptions

### 📋 Public (On-Chain)
- Task titles
- Priority levels
- Due dates
- Categories
- Tags
- Colors
- Status (Todo, In Progress, Completed)
- Timestamps

## 🗺️ Roadmap

- [x] Basic task management
- [x] FHE encryption for descriptions
- [x] Linear-style UI
- [x] Command palette
- [x] Keyboard shortcuts
- [ ] Rich text editor for descriptions
- [ ] Task dependencies
- [ ] Recurring tasks
- [ ] Mobile app
- [ ] Export/import functionality
- [ ] Team workspaces with shared tasks

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Zama**: For the amazing FHE technology
- **Ethereum**: For the decentralized infrastructure
- **Linear**: For UI/UX inspiration

## 📞 Support

For questions or issues, please open an issue on GitHub.

---

**Built with ❤️ using Zama FHE**
