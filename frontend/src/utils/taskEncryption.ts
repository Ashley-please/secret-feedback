import {
  initSDK,
  createInstance,
  SepoliaConfig
} from "https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.js";

let fheInstance: any = null;

export async function initializeFHE() {
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

// Convert string to bytes
function stringToBytes(str: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

// Convert bytes to hex string
function bytesToHex(bytes: Uint8Array): string {
  return '0x' + Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function encryptTaskDescription(
  contractAddress: string,
  userAddress: string,
  description: string
): Promise<{ encryptedChunks: string[]; inputProof: string }> {
  const fhe = await initializeFHE();

  console.log("🔐 Creating encrypted input for contract:", contractAddress);
  console.log("🔐 Authorizing decryption for user:", userAddress);
  
  const input = fhe.createEncryptedInput(contractAddress, userAddress);
  const msgBytes = stringToBytes(description);

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

  // Add each chunk to the encrypted input
  chunks.forEach((val) => input.add32(val));

  console.log("🔒 Encrypting task description...");
  const encrypted = await input.encrypt();

  console.log("✅ Task description encrypted successfully");
  console.log("📦 Chunks:", encrypted.handles.length);
  console.log("📦 Raw handles:", encrypted.handles);

  // Convert Uint8Array handles to hex strings (bytes32 format)
  const formattedHandles = encrypted.handles.map((handle: Uint8Array) => {
    const hex = '0x' + Array.from(handle).map(b => b.toString(16).padStart(2, '0')).join('');
    // Pad to 32 bytes (64 hex chars + 0x = 66 total)
    return hex.padEnd(66, '0');
  });

  console.log("📦 Formatted handles:", formattedHandles);

  return {
    encryptedChunks: formattedHandles,
    inputProof: bytesToHex(encrypted.inputProof)
  };
}

export async function decryptTaskDescription(
  contractAddress: string,
  handles: string[],
  signer: any
): Promise<string> {
  try {
    const fhe = await initializeFHE();
    console.log(`🔓 Decrypting task description...`);

    // Generate keypair for user decryption
    const keypair = fhe.generateKeypair();
    
    // Get user address - handle both Promise and direct signer
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

    // Reconstruct the message from chunks
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
    console.log("✅ Task description decrypted successfully");
    return plaintext;

  } catch (error: any) {
    console.error("❌ Decryption failed:", error);
    throw new Error(`Decryption failed: ${error.message || "Unknown error occurred"}`);
  }
}
