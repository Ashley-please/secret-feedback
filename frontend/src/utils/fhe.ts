// SPDX-License-Identifier: BSD-3-Clause-Clear
import {
  initSDK,
  createInstance,
  SepoliaConfig
} from "https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.js";
import { ethers } from "ethers";
import { stringToBytes, bytesToHex, hexToBytes } from "./hexUtils";

let fheInstance: any = null;

/* ----------------------------------------------------------
   ⚙️ Initialize Zama FHE SDK (Testnet)
---------------------------------------------------------- */
export async function initializeFHE() {
  if (fheInstance) return fheInstance;

  console.log("🔐 Initializing Zama FHE SDK...");
  await initSDK();

  const config = {
    ...SepoliaConfig,
    relayerUrl: "https://relayer.testnet.zama.cloud", // ✅ Latest relayer
    network: window.ethereum
  };

  console.log("🔧 Using FHE config:", config);

  fheInstance = await createInstance(config);
  console.log("✅ Zama FHE initialized successfully");
  return fheInstance;
}

/* ----------------------------------------------------------
   🔒 Encrypt and Store Message
---------------------------------------------------------- */
export async function encryptAndStoreMessage(
  contractAddress: string,
  inboxId: number,
  signer: ethers.Signer,
  plaintext: string
): Promise<{ txHash: string; handle: string }> {
  console.log(`🧩 Encrypting message for inbox ${inboxId}...`);
  const fhe = await initializeFHE();

  const hub = new ethers.Contract(
    contractAddress,
    ["function inboxes(uint256) view returns (uint256,address,string,uint256,bool)"],
    signer.provider
  );

  const inbox = await hub.inboxes(inboxId);
  const ownerAddress = inbox[1];
  const senderAddress = await signer.getAddress();
  console.log("👤 Inbox owner:", ownerAddress);
  console.log("👤 Message sender:", senderAddress);

  // Create encrypted input - grant decryption rights to the INBOX OWNER
  // Per Zama docs: createEncryptedInput(contractAddress, userAddress)
  // where userAddress is the entity allowed to decrypt (inbox owner)
  console.log("🔐 Creating encrypted input for contract:", contractAddress);
  console.log("🔐 Authorizing decryption for inbox owner:", ownerAddress);
  const input = fhe.createEncryptedInput(contractAddress, ownerAddress);
  const msgBytes = stringToBytes(plaintext);

  // Convert to uint32 chunks for encryption
  const chunks: number[] = [];
  for (let i = 0; i < msgBytes.length; i += 4) {
    const chunk =
      (msgBytes[i] || 0) |
      ((msgBytes[i + 1] || 0) << 8) |
      ((msgBytes[i + 2] || 0) << 16) |
      ((msgBytes[i + 3] || 0) << 24);
    chunks.push(chunk >>> 0);
  }

  chunks.forEach((val) => input.add32(val));

  console.log("🔒 Encrypting message...");
  const encrypted = await input.encrypt();

  const handleHex = ethers.hexlify(encrypted.handles[0]).padEnd(66, "0");
  const proofHex = bytesToHex(encrypted.inputProof);

  console.log("📤 Storing encrypted message on-chain...");
  const hubWithSigner = new ethers.Contract(
    contractAddress,
    ["function storeMessage(uint256, bytes32, bytes) payable"],
    signer
  );

  const tx = await hubWithSigner.storeMessage(inboxId, handleHex, proofHex);
  await tx.wait();

  console.log("✅ Stored encrypted message:", tx.hash);
  return { txHash: tx.hash, handle: handleHex };
}

/* ----------------------------------------------------------
   🔓 Decrypt Message (Owner)
---------------------------------------------------------- */
export async function ownerDecryptMessage(
  contractAddress: string,
  inboxId: number,
  msgIndex: number,
  signer: ethers.Signer
) {
  try {
    const fhe = await initializeFHE();
    console.log(`🔓 Decrypting message #${msgIndex}...`);

    const hub = new ethers.Contract(
      contractAddress,
      [
        "function inboxes(uint256) view returns (uint256,address,string,uint256,bool)",
        "function getMessage(uint256,uint256) view returns (bytes32,bytes,address,uint256,bool)"
      ],
      signer.provider
    );

    const currentUser = await signer.getAddress();
    const inbox = await hub.inboxes(inboxId);
    const inboxOwner = inbox[1];

    if (currentUser.toLowerCase() !== inboxOwner.toLowerCase()) {
      throw new Error("Access denied — only inbox owner can decrypt messages.");
    }

    const message = await hub.getMessage(inboxId, msgIndex);
    const handleBytes = hexToBytes(message[0]);

    console.log("🧩 Handle bytes:", handleBytes.length, "bytes");
    console.log("🧩 Handle hex:", message[0]);
    console.log("🧩 Message sender:", message[2]);
    console.log("🧩 Current user:", currentUser);
    console.log("🧩 Inbox owner:", inboxOwner);

    // Generate keypair for user decryption
    const keypair = fhe.generateKeypair();
    const userAddress = await signer.getAddress();
    
    // CRITICAL: timestamp and durationDays must be STRINGS per Zama docs
    const startTimeStamp = Math.floor(Date.now() / 1000).toString();
    const durationDays = '10';  // String: 10 days expiration
    const contractAddresses = [contractAddress];

    console.log("🔐 Creating EIP-712 signature for relayer...");
    console.log("⏰ Using timestamp:", startTimeStamp);
    console.log("⏰ Duration days:", durationDays);
    
    const eip712 = fhe.createEIP712(
      keypair.publicKey,
      contractAddresses,
      startTimeStamp,
      durationDays
    );

    const signature = await signer.signTypedData(
      eip712.domain,
      {
        UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
      },
      eip712.message
    );

    console.log("🌐 Requesting decryption from relayer...");
    console.log("📋 Decryption request params:");
    console.log("  - Handle:", message[0]);
    console.log("  - Contract:", contractAddress);
    console.log("  - User:", userAddress);
    console.log("  - Timestamp:", startTimeStamp);
    console.log("  - Duration:", durationDays);
    
    // Per Zama docs: userDecrypt expects timestamp and durationDays as strings
    const handleContractPairs = [{ handle: handleBytes, contractAddress }];
    
    const result = await fhe.userDecrypt(
      handleContractPairs,
      keypair.privateKey,
      keypair.publicKey,
      signature.replace("0x", ""),
      contractAddresses,
      userAddress,
      startTimeStamp,
      durationDays
    );

    console.log("📦 Relayer response:", result);
    console.log("📦 Response type:", typeof result);
    console.log("📦 Response keys:", Object.keys(result || {}));

    // Per Zama docs: result is an object with handle as key
    const handleHex = message[0];
    console.log("🔑 Looking for handle:", handleHex);
    
    const decryptedValue = result[handleHex];
    console.log("📦 Decrypted value:", decryptedValue);
    
    if (!decryptedValue) {
      console.error("❌ Handle not found in result. Available keys:", Object.keys(result || {}));
      throw new Error("Relayer returned empty result. Check ACL permissions.");
    }

    // Convert result to plaintext
    console.log("🔄 Converting to plaintext...");
    const bytes = new Uint8Array(Object.values(decryptedValue));
    console.log("📦 Bytes:", bytes);
    const plaintext = new TextDecoder().decode(bytes);
    console.log("✅ Decrypted message:", plaintext);
    return plaintext;

  } catch (error: any) {
    console.error("❌ Decryption failed:", error);
    
    // Provide clear error messages to user
    if (error.message?.includes("Access denied")) {
      throw new Error("Access denied: Only the inbox owner can decrypt messages");
    } else if (error.message?.includes("ACL")) {
      throw new Error("Permission denied: Message not authorized for decryption. The sender may need to grant ACL permissions.");
    } else if (error.message?.includes("relayer") || error.message?.includes("network")) {
      throw new Error("Network error: Unable to connect to Zama relayer. Please check your connection and try again.");
    } else if (error.message?.includes("signature")) {
      throw new Error("Signature error: Please try signing the decryption request again.");
    } else {
      throw new Error(`Decryption failed: ${error.message || "Unknown error occurred"}`);
    }
  }
}

/* ----------------------------------------------------------
   📨 Mark Message as Read (on-chain)
---------------------------------------------------------- */
export async function markMessageAsRead(
  contractAddress: string,
  inboxId: number,
  msgIndex: number,
  signer: ethers.Signer
): Promise<string> {
  console.log("📖 Marking message as read...");

  const hubWithSigner = new ethers.Contract(
    contractAddress,
    ["function markMessageRead(uint256, uint256)"],
    signer
  );

  const tx = await hubWithSigner.markMessageRead(inboxId, msgIndex);
  await tx.wait();

  console.log("✅ Message marked as read:", tx.hash);
  return tx.hash;
}
