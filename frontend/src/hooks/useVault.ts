import { useState, useEffect, useCallback } from 'react';
import { useAccount, useContractRead, useContractWrite, useWaitForTransaction, usePublicClient } from 'wagmi';
import { initializeFHE } from '../utils/fhe';
import toast from 'react-hot-toast';
import VaultABI from '../abi/EncryptedVault.json';

interface Note {
  id: number;
  title: string;
  category: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  chunkCount: number;
  isArchived: boolean;
  isFavorite: boolean;
  color: string;
  owner?: string; // For shared notes
}

interface UserStats {
  totalNotes: bigint;
  activeNotes: bigint;
  archivedNotes: bigint;
  favoriteNotes: bigint;
  totalStorage: bigint;
}

const VAULT_ABI = [
  {
    inputs: [
      { name: 'encryptedChunks', type: 'bytes32[]' },
      { name: 'inputProof', type: 'bytes' },
      { name: 'title', type: 'string' },
      { name: 'category', type: 'string' },
      { name: 'tags', type: 'string[]' },
      { name: 'color', type: 'string' },
    ],
    name: 'createNote',
    outputs: [{ name: 'noteId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'noteId', type: 'uint256' },
      { name: 'encryptedChunks', type: 'bytes32[]' },
      { name: 'inputProof', type: 'bytes' },
      { name: 'title', type: 'string' },
      { name: 'category', type: 'string' },
      { name: 'tags', type: 'string[]' },
      { name: 'color', type: 'string' },
    ],
    name: 'updateNote',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'noteId', type: 'uint256' }],
    name: 'deleteNote',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'noteId', type: 'uint256' },
      { name: 'archived', type: 'bool' },
    ],
    name: 'setArchived',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'noteId', type: 'uint256' },
      { name: 'favorite', type: 'bool' },
    ],
    name: 'setFavorite',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'noteId', type: 'uint256' },
      { name: 'recipient', type: 'address' },
    ],
    name: 'shareNote',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getMyNotes',
    outputs: [
      {
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'title', type: 'string' },
          { name: 'category', type: 'string' },
          { name: 'tags', type: 'string[]' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'updatedAt', type: 'uint256' },
          { name: 'chunkCount', type: 'uint8' },
          { name: 'isArchived', type: 'bool' },
          { name: 'isFavorite', type: 'bool' },
          { name: 'color', type: 'string' },
        ],
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'noteId', type: 'uint256' }],
    name: 'getNoteContent',
    outputs: [
      { name: 'handles', type: 'bytes32[]' },
      {
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'title', type: 'string' },
          { name: 'category', type: 'string' },
          { name: 'tags', type: 'string[]' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'updatedAt', type: 'uint256' },
          { name: 'chunkCount', type: 'uint8' },
          { name: 'isArchived', type: 'bool' },
          { name: 'isFavorite', type: 'bool' },
          { name: 'color', type: 'string' },
        ],
        name: 'metadata',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getMyStats',
    outputs: [
      {
        components: [
          { name: 'totalNotes', type: 'uint256' },
          { name: 'activeNotes', type: 'uint256' },
          { name: 'archivedNotes', type: 'uint256' },
          { name: 'favoriteNotes', type: 'uint256' },
          { name: 'totalStorage', type: 'uint256' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

export function useVault(contractAddress: string) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [fheInstance, setFheInstance] = useState<any>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize FHE instance
  useEffect(() => {
    const initFHE = async () => {
      try {
        const instance = await initializeFHE();
        setFheInstance(instance);
      } catch (error) {
        console.error('Failed to initialize FHE:', error);
        toast.error('Failed to initialize encryption');
      }
    };

    initFHE();
  }, []);

  // Fetch notes
  const { data: notesData, refetch: refetchNotes, error: notesError, isLoading: notesLoading } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: VaultABI.abi,
    functionName: 'getMyNotes',
    enabled: !!address,
    watch: true,
    cacheTime: 0, // Don't cache
    staleTime: 0, // Always fetch fresh data
  });

  useEffect(() => {
    if (notesError) {
      console.error('❌ Error fetching notes:', notesError);
    }
    if (notesLoading) {
      console.log('⏳ Loading notes...');
    }
  }, [notesError, notesLoading]);

  // Fetch stats
  const { data: statsData, refetch: refetchStats } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: VaultABI.abi,
    functionName: 'getMyStats',
    enabled: !!address,
  });

  // Manual fetch to bypass wagmi caching issues
  useEffect(() => {
    const fetchNotes = async () => {
      if (!address || !publicClient) return;
      
      try {
        console.log('🔄 Manually fetching notes...');
        const result = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: VaultABI.abi,
          functionName: 'getMyNotes',
          account: address,
        });
        
        console.log('📥 Manual fetch result:', result);
        
        if (result && Array.isArray(result)) {
          const parsedNotes = result.map((note: any) => ({
            id: Number(note.id),
            title: note.title,
            category: note.category,
            tags: note.tags,
            createdAt: Number(note.createdAt),
            updatedAt: Number(note.updatedAt),
            chunkCount: note.chunkCount,
            isArchived: note.isArchived,
            isFavorite: note.isFavorite,
            color: note.color,
          }));
          console.log('📋 Parsed notes:', parsedNotes.length, 'notes');
          setNotes(parsedNotes);
        }
      } catch (error) {
        console.error('❌ Error manually fetching notes:', error);
      }
    };

    fetchNotes();
  }, [address, publicClient, contractAddress]);

  useEffect(() => {
    console.log('📥 Notes data received (wagmi):', notesData);
    if (notesData && Array.isArray(notesData) && notesData.length > 0) {
      const parsedNotes = notesData.map((note: any) => ({
        id: Number(note.id),
        title: note.title,
        category: note.category,
        tags: note.tags,
        createdAt: Number(note.createdAt),
        updatedAt: Number(note.updatedAt),
        chunkCount: note.chunkCount,
        isArchived: note.isArchived,
        isFavorite: note.isFavorite,
        color: note.color,
      }));
      console.log('📋 Parsed notes from wagmi:', parsedNotes.length, 'notes');
      setNotes(parsedNotes);
    }
  }, [notesData]);

  useEffect(() => {
    if (statsData) {
      setStats(statsData as UserStats);
    }
  }, [statsData]);

  // Encrypt text to chunks
  const encryptText = useCallback(
    async (text: string, userAddress: string) => {
      if (!fheInstance) throw new Error('FHE not initialized');

      console.log('🔐 Starting encryption...');
      console.log('📝 Text length:', text.length, 'bytes');
      console.log('👤 User address:', userAddress);

      const encoder = new TextEncoder();
      const bytes = encoder.encode(text);
      console.log('📦 Encoded bytes:', bytes.length);

      // Create encrypted input for the contract and user
      const input = fheInstance.createEncryptedInput(contractAddress, userAddress);
      console.log('✅ Created encrypted input');

      // Split into 4-byte chunks (uint32) and add to input
      let chunkCount = 0;
      for (let i = 0; i < bytes.length; i += 4) {
        const value =
          (bytes[i] || 0) |
          ((bytes[i + 1] || 0) << 8) |
          ((bytes[i + 2] || 0) << 16) |
          ((bytes[i + 3] || 0) << 24);
        input.add32(value >>> 0);
        chunkCount++;
      }
      console.log('📊 Added', chunkCount, 'chunks to input');

      // Encrypt all chunks
      console.log('🔒 Encrypting...');
      const encrypted = await input.encrypt();
      console.log('✅ Encryption complete!');
      
      // Convert handles to hex strings (bytes32 format)
      const handleStrings = encrypted.handles.map((handle: Uint8Array) => {
        const hex = '0x' + Array.from(handle)
          .map((b) => (b as number).toString(16).padStart(2, '0'))
          .join('');
        return hex.padEnd(66, '0'); // Pad to 32 bytes (66 chars with 0x)
      });
      
      // Convert inputProof to hex string
      const proofHex = '0x' + Array.from(encrypted.inputProof)
        .map((b) => (b as number).toString(16).padStart(2, '0'))
        .join('');
      
      console.log('📋 Generated', handleStrings.length, 'encrypted handles');
      console.log('📋 Proof length:', proofHex.length, 'chars');
      console.log('🎉 Encryption ready for blockchain!');
      
      return {
        handles: handleStrings,
        inputProof: proofHex
      };
    },
    [fheInstance, contractAddress]
  );

  // Decrypt chunks to text using Zama relayer
  const decryptText = useCallback(
    async (handles: string[], userAddress: string) => {
      if (!fheInstance) throw new Error('FHE not initialized');
      if (!window.ethereum) throw new Error('No wallet provider');

      console.log('🔓 Starting decryption...');
      console.log('📋 Number of handles:', handles.length);

      // Generate keypair for decryption
      const keypair = fheInstance.generateKeypair();
      
      // Create EIP-712 signature for relayer
      const startTimeStamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = '10';
      const contractAddresses = [contractAddress];

      console.log('🔐 Creating EIP-712 signature...');
      const eip712 = fheInstance.createEIP712(
        keypair.publicKey,
        contractAddresses,
        startTimeStamp,
        durationDays
      );

      // Request signature from wallet
      const provider = new (await import('ethers')).BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const signature = await signer.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message
      );

      console.log('🌐 Requesting decryption from relayer...');
      
      // Convert handles to bytes and create pairs
      const handleContractPairs = handles.map(handle => {
        // Remove 0x prefix - keep full 32 bytes (64 hex chars)
        const hex = handle.startsWith('0x') ? handle.slice(2) : handle;
        // Take only first 64 hex characters (32 bytes) - remove any extra padding
        const hex32 = hex.substring(0, 64);
        const bytes = new Uint8Array(hex32.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
        console.log('📋 Handle:', handle);
        console.log('📋 Hex (32 bytes):', hex32, 'bytes length:', bytes.length);
        return { handle: bytes, contractAddress };
      });

      // Request decryption from relayer
      const result = await fheInstance.userDecrypt(
        handleContractPairs,
        keypair.privateKey,
        keypair.publicKey,
        signature.replace('0x', ''),
        contractAddresses,
        userAddress,
        startTimeStamp,
        durationDays
      );

      console.log('📦 Relayer response:', result);

      // Extract decrypted values - relayer returns BigInt values directly
      const chunks: number[] = [];
      for (const handle of handles) {
        const decryptedValue = result[handle];
        console.log('📦 Decrypted value for handle:', handle, '=', decryptedValue, typeof decryptedValue);
        
        if (decryptedValue !== undefined) {
          // Convert BigInt to number
          chunks.push(Number(decryptedValue));
        }
      }

      console.log('🔄 Converting', chunks.length, 'chunks to text...');
      
      // Convert chunks back to text
      const bytes = new Uint8Array(chunks.length * 4);
      chunks.forEach((chunk, i) => {
        const view = new DataView(new ArrayBuffer(4));
        view.setUint32(0, chunk, true);
        for (let j = 0; j < 4; j++) {
          bytes[i * 4 + j] = view.getUint8(j);
        }
      });

      const decoder = new TextDecoder();
      const plaintext = decoder.decode(bytes).replace(/\0/g, '');
      console.log('✅ Decryption complete!');
      console.log('📝 Decrypted text:', plaintext);
      
      return plaintext;
    },
    [fheInstance, contractAddress]
  );

  // Create note
  const { write: createNoteWrite, data: createData } = useContractWrite({
    address: contractAddress as `0x${string}`,
    abi: VaultABI.abi,
    functionName: 'createNote',
  });

  const { isLoading: isCreating } = useWaitForTransaction({
    hash: createData?.hash,
    onSuccess: async () => {
      console.log('✅ Transaction confirmed! Refreshing notes...');
      toast.success('Note created successfully!');
      
      // Wait for blockchain to update
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Manually fetch notes
      if (address && publicClient) {
        try {
          const result = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: VaultABI.abi,
            functionName: 'getMyNotes',
            account: address,
          });
          
          if (result && Array.isArray(result)) {
            const parsedNotes = result.map((note: any) => ({
              id: Number(note.id),
              title: note.title,
              category: note.category,
              tags: note.tags,
              createdAt: Number(note.createdAt),
              updatedAt: Number(note.updatedAt),
              chunkCount: note.chunkCount,
              isArchived: note.isArchived,
              isFavorite: note.isFavorite,
              color: note.color,
              owner: note.owner,
            }));
            setNotes(parsedNotes);
            console.log('🔄 Notes updated:', parsedNotes.length);
          }
        } catch (error) {
          console.error('Error fetching notes:', error);
        }
      }
      
      refetchNotes();
      refetchStats();
    },
    onError: (error) => {
      toast.error('Failed to create note');
      console.error(error);
    },
  });

  const createNote = useCallback(
    async (
      content: string,
      title: string,
      category: string,
      tags: string[],
      color: string
    ) => {
      if (!address) {
        toast.error('Please connect your wallet');
        return;
      }
      
      try {
        setIsLoading(true);
        const { handles, inputProof } = await encryptText(content, address);

        createNoteWrite({
          args: [handles, inputProof, title, category, tags, color],
        });
      } catch (error: any) {
        console.error('Failed to create note:', error);
        if (error?.message?.includes('nonce')) {
          toast.error('Transaction nonce error. Please reset your wallet account in MetaMask (Settings > Advanced > Clear activity tab data)');
        } else if (error?.message?.includes('user rejected')) {
          toast.error('Transaction rejected');
        } else {
          toast.error('Failed to create note: ' + (error?.message || 'Unknown error'));
        }
      } finally {
        setIsLoading(false);
      }
    },
    [encryptText, createNoteWrite, address]
  );

  // Update note
  const { write: updateNoteWrite, data: updateData } = useContractWrite({
    address: contractAddress as `0x${string}`,
    abi: VaultABI.abi,
    functionName: 'updateNote',
  });

  const { isLoading: isUpdating } = useWaitForTransaction({
    hash: updateData?.hash,
    onSuccess: async () => {
      toast.success('Note updated successfully!');
      
      // Wait for blockchain to update
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Manually fetch notes
      if (address && publicClient) {
        try {
          const result = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: VaultABI.abi,
            functionName: 'getMyNotes',
            account: address,
          });
          
          if (result && Array.isArray(result)) {
            const parsedNotes = result.map((note: any) => ({
              id: Number(note.id),
              title: note.title,
              category: note.category,
              tags: note.tags,
              createdAt: Number(note.createdAt),
              updatedAt: Number(note.updatedAt),
              chunkCount: note.chunkCount,
              isArchived: note.isArchived,
              isFavorite: note.isFavorite,
              color: note.color,
              owner: note.owner,
            }));
            setNotes(parsedNotes);
          }
        } catch (error) {
          console.error('Error fetching notes:', error);
        }
      }
      
      refetchNotes();
    },
    onError: (error) => {
      toast.error('Failed to update note');
      console.error(error);
    },
  });

  const updateNote = useCallback(
    async (
      noteId: number,
      content: string,
      title: string,
      category: string,
      tags: string[],
      color: string
    ) => {
      if (!address) {
        toast.error('Please connect your wallet');
        return;
      }
      
      try {
        setIsLoading(true);
        const { handles, inputProof } = await encryptText(content, address);

        updateNoteWrite({
          args: [noteId, handles, inputProof, title, category, tags, color],
        });
      } catch (error) {
        console.error('Failed to update note:', error);
        toast.error('Failed to encrypt note');
      } finally {
        setIsLoading(false);
      }
    },
    [encryptText, updateNoteWrite, address]
  );

  // Delete note
  const { write: deleteNoteWrite } = useContractWrite({
    address: contractAddress as `0x${string}`,
    abi: VaultABI.abi,
    functionName: 'deleteNote',
    onSuccess: () => {
      toast.success('Note deleted');
      refetchNotes();
      refetchStats();
    },
  });

  // Toggle archive
  const { write: setArchivedWrite } = useContractWrite({
    address: contractAddress as `0x${string}`,
    abi: VaultABI.abi,
    functionName: 'setArchived',
    onSuccess: () => {
      toast.success('Note archived status updated');
      refetchNotes();
      refetchStats();
    },
  });

  // Toggle favorite
  const { write: setFavoriteWrite } = useContractWrite({
    address: contractAddress as `0x${string}`,
    abi: VaultABI.abi,
    functionName: 'setFavorite',
    onSuccess: () => {
      toast.success('Favorite status updated');
      refetchNotes();
      refetchStats();
    },
  });

  // Share note
  const { write: shareNoteWrite } = useContractWrite({
    address: contractAddress as `0x${string}`,
    abi: VaultABI.abi,
    functionName: 'shareNote',
    onSuccess: () => {
      toast.success('Note shared successfully');
    },
  });

  // Decrypt a note by fetching its content from the contract
  const decryptNote = useCallback(
    async (noteId: number): Promise<string> => {
      if (!publicClient || !address) {
        throw new Error('Client not initialized');
      }

      console.log('🔓 Fetching encrypted content for note:', noteId);

      // Fetch encrypted handles from contract
      const result = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: VaultABI.abi,
        functionName: 'getNoteContent',
        args: [noteId],
        account: address,
      });

      const [handles] = result as [string[], any];
      console.log('📋 Received', handles.length, 'encrypted handles');

      // Decrypt the handles
      const decryptedText = await decryptText(handles, address);
      return decryptedText;
    },
    [publicClient, address, contractAddress, decryptText]
  );

  // Fetch shared notes
  const { data: sharedNotes = [], refetch: refetchSharedNotes } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: VaultABI.abi,
    functionName: 'getSharedNotes',
    account: address,
    watch: true,
    enabled: !!address,
  }) as { data: Note[]; refetch: () => void };

  // Decrypt shared note
  const decryptSharedNote = useCallback(
    async (owner: string, noteId: number): Promise<string> => {
      if (!publicClient || !address) {
        throw new Error('Client not initialized');
      }

      console.log('🔓 Fetching shared encrypted content for note:', noteId, 'from owner:', owner);

      // Fetch encrypted handles from contract
      const result = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: VaultABI.abi,
        functionName: 'getSharedNoteContent',
        args: [owner, noteId],
        account: address,
      });

      const [handles] = result as [string[], any];
      console.log('📋 Received', handles.length, 'encrypted handles from shared note');

      // Decrypt the handles
      const decryptedText = await decryptText(handles, address);
      return decryptedText;
    },
    [publicClient, address, contractAddress, decryptText]
  );

  return {
    notes,
    sharedNotes,
    stats,
    isLoading: isLoading || isCreating || isUpdating,
    createNote,
    updateNote,
    deleteNote: (noteId: number) => deleteNoteWrite({ args: [noteId] }),
    setArchived: (noteId: number, archived: boolean) =>
      setArchivedWrite({ args: [noteId, archived] }),
    setFavorite: (noteId: number, favorite: boolean) =>
      setFavoriteWrite({ args: [noteId, favorite] }),
    shareNote: (noteId: number, recipient: string) =>
      shareNoteWrite({ args: [noteId, recipient] }),
    decryptNote,
    decryptSharedNote,
    decryptText,
    refetchNotes,
    refetchSharedNotes,
    refetchStats,
  };
}
