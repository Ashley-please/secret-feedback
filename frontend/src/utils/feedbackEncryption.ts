import {
  initSDK,
  createInstance,
  SepoliaConfig
} from "https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.js";

let fheInstance: any = null;

async function initializeFHE() {
  if (fheInstance) return fheInstance;

  console.log("🔐 Initializing Zama FHE SDK...");
  await initSDK();

  const config = {
    ...SepoliaConfig,
    relayerUrl: "https://relayer.testnet.zama.cloud",
    network: window.ethereum
  };

  fheInstance = await createInstance(config);
  console.log("✅ Zama FHE initialized successfully");
  return fheInstance;
}

/**
 * Encrypt feedback text into chunks for on-chain storage
 */
export async function encryptFeedbackContent(
  contractAddress: string,
  content: string,
  userAddress: string
): Promise<{ encryptedChunks: string[], inputProof: string }> {
  try {
    const fhe = await initializeFHE();
    console.log(`🔐 Encrypting feedback content (${content.length} chars)...`);

    // Create encrypted input
    const input = fhe.createEncryptedInput(contractAddress, userAddress);
    
    // Convert string to bytes
    const encoder = new TextEncoder();
    const contentBytes = encoder.encode(content);
    
    // Split into 4-byte chunks (uint32)
    const chunks: number[] = [];
    for (let i = 0; i < contentBytes.length; i += 4) {
      const chunk =
        (contentBytes[i] || 0) |
        ((contentBytes[i + 1] || 0) << 8) |
        ((contentBytes[i + 2] || 0) << 16) |
        ((contentBytes[i + 3] || 0) << 24);
      chunks.push(chunk >>> 0);
    }
    
    console.log(`📦 Split into ${chunks.length} chunks`);
    
    // Add each chunk to the encrypted input
    chunks.forEach((val) => input.add32(val));
    
    console.log("🔒 Encrypting feedback...");
    const encrypted = await input.encrypt();
    
    // Convert Uint8Array handles to hex strings (bytes32 format)
    const encryptedChunks = encrypted.handles.map((handle: Uint8Array) => {
      const hex = '0x' + Array.from(handle).map(b => b.toString(16).padStart(2, '0')).join('');
      return hex.padEnd(66, '0');
    });
    
    console.log("✅ Feedback encrypted successfully");
    
    // Convert inputProof to hex string
    const inputProofBytes = encrypted.inputProof as Uint8Array;
    const inputProofHex = '0x' + Array.from(inputProofBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return {
      encryptedChunks,
      inputProof: inputProofHex
    };
    
  } catch (error: any) {
    console.error("❌ Encryption failed:", error);
    throw new Error(`Encryption failed: ${error.message || "Unknown error occurred"}`);
  }
}

/**
 * Decrypt feedback content from encrypted handles
 */
export async function decryptFeedbackContent(
  contractAddress: string,
  handles: string[],
  signer: any
): Promise<string> {
  try {
    const fhe = await initializeFHE();
    console.log(`🔓 Decrypting feedback content...`);

    // Generate keypair for user decryption
    const keypair = fhe.generateKeypair();
    
    // Get user address
    let userAddress: string;
    if (typeof signer.getAddress === 'function') {
      userAddress = await signer.getAddress();
    } else if (signer.address) {
      userAddress = signer.address;
    } else {
      throw new Error('Could not get user address from signer');
    }
    
    const startTimeStamp = Math.floor(Date.now() / 1000).toString();
    const durationDays = '10';
    const contractAddresses = [contractAddress];

    console.log("🔐 Creating EIP-712 signature for relayer...");
    
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
    
    // Convert handles to bytes
    const handleBytes = handles.map(h => {
      const hex = h.startsWith('0x') ? h.slice(2) : h;
      return new Uint8Array(hex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
    });

    const handleContractPairs = handleBytes.map(handle => ({ 
      handle, 
      contractAddress 
    }));
    
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

    console.log("📦 Relayer response received");

    // Decrypt each chunk
    const decryptedChunks: number[] = [];
    for (const handle of handles) {
      const decryptedValue = result[handle];
      if (decryptedValue) {
        decryptedChunks.push(decryptedValue);
      }
    }

    // Convert uint32 chunks back to string
    const bytes: number[] = [];
    decryptedChunks.forEach(chunk => {
      // Convert BigInt to Number for bitwise operations
      const chunkNum = typeof chunk === 'bigint' ? Number(chunk) : chunk;
      bytes.push(chunkNum & 0xFF);
      bytes.push((chunkNum >> 8) & 0xFF);
      bytes.push((chunkNum >> 16) & 0xFF);
      bytes.push((chunkNum >> 24) & 0xFF);
    });

    const plaintext = new TextDecoder().decode(new Uint8Array(bytes.filter(b => b !== 0)));
    console.log("✅ Feedback decrypted successfully");
    return plaintext;

  } catch (error: any) {
    console.error("❌ Decryption failed:", error);
    throw new Error(`Decryption failed: ${error.message || "Unknown error occurred"}`);
  }
}
