import { useState, useEffect } from 'react';
import { useAccount, useContractRead, useContractWrite, useWaitForTransaction, usePublicClient, useWalletClient } from 'wagmi';
import { toast } from 'react-hot-toast';
import EncryptedFeedbackABI from '../abi/EncryptedFeedback.json';
import { encryptFeedbackContent, decryptFeedbackContent } from '../utils/feedbackEncryption';
import { useSigner } from './useSigner';

const CONTRACT_ADDRESS = import.meta.env.VITE_FEEDBACK_CONTRACT_ADDRESS as `0x${string}`;

export enum Sentiment {
  Positive = 0,
  Neutral = 1,
  Negative = 2,
}

export enum BoxCategory {
  Team = 0,
  Product = 1,
  Event = 2,
  Course = 3,
  General = 4,
}

export interface FeedbackBox {
  id: bigint;
  owner: string;
  title: string;
  description: string;
  category: BoxCategory;
  isActive: boolean;
  createdAt: bigint;
  closedAt: bigint;
  submissionCount: bigint;
  allowRatings: boolean;
  allowSentiment: boolean;
}

export interface FeedbackMetadata {
  id: bigint;
  boxId: bigint;
  rating: number;
  sentiment: Sentiment;
  submittedAt: bigint;
  isRead: boolean;
  chunkCount: number;
}

export interface BoxStats {
  totalSubmissions: bigint;
  unreadCount: bigint;
  avgRating: bigint;
  positiveCount: bigint;
  neutralCount: bigint;
  negativeCount: bigint;
}

export function useFeedback() {
  const { address } = useAccount();
  const signer = useSigner();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [boxes, setBoxes] = useState<FeedbackBox[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manual fetch function using publicClient
  const fetchBoxes = async () => {
    if (!address || !publicClient) return;
    
    try {
      console.log('🔄 Fetching feedback boxes for:', address);
      
      const boxesResult = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: EncryptedFeedbackABI.abi,
        functionName: 'getMyBoxes',
        account: address,
      });
      
      console.log('📦 Boxes result:', boxesResult);
      setBoxes(boxesResult as FeedbackBox[]);
    } catch (error) {
      console.error('❌ Error fetching boxes:', error);
    }
  };

  // Fetch on mount and when address changes
  useEffect(() => {
    if (address && publicClient) {
      fetchBoxes();
    }
  }, [address, publicClient]);

  const refetchBoxes = () => fetchBoxes();

  // Create box
  const { write: createBoxWrite, data: createBoxData } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: EncryptedFeedbackABI.abi,
    functionName: 'createBox',
  });

  const { isLoading: isCreatingBox } = useWaitForTransaction({
    hash: createBoxData?.hash,
    onSuccess: async () => {
      toast.success('Feedback box created!');
      await new Promise(resolve => setTimeout(resolve, 1000));
      await refetchBoxes();
      setIsCreating(false);
    },
    onError: (error) => {
      toast.error('Failed to create box');
      console.error(error);
      setIsCreating(false);
    },
  });

  const createBox = async (
    title: string,
    description: string,
    category: BoxCategory,
    allowRatings: boolean,
    allowSentiment: boolean
  ) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    setIsCreating(true);
    try {
      createBoxWrite?.({
        args: [title, description, category, allowRatings, allowSentiment],
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to create box');
      setIsCreating(false);
    }
  };

  // Submit feedback
  const submitFeedback = async (
    boxId: bigint,
    content: string,
    rating: number,
    sentiment: Sentiment
  ) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    setIsSubmitting(true);
    try {
      toast.loading('Encrypting feedback...', { id: 'submit' });
      
      const { encryptedChunks, inputProof } = await encryptFeedbackContent(
        CONTRACT_ADDRESS,
        content,
        address
      );

      toast.loading('Submitting to blockchain...', { id: 'submit' });

      if (!walletClient) {
        throw new Error('Wallet client not available');
      }

      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: EncryptedFeedbackABI.abi,
        functionName: 'submitFeedback',
        args: [boxId, encryptedChunks, inputProof, rating, sentiment],
      });

      toast.loading('Waiting for confirmation...', { id: 'submit' });
      await publicClient!.waitForTransactionReceipt({ hash });

      toast.success('Feedback submitted!', { id: 'submit' });
      await new Promise(resolve => setTimeout(resolve, 1000));
      await refetchBoxes();
    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(error.message || 'Failed to submit feedback', { id: 'submit' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close box
  const { write: closeBoxWrite } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: EncryptedFeedbackABI.abi,
    functionName: 'closeBox',
  });

  const closeBox = async (boxId: bigint) => {
    try {
      closeBoxWrite?.({ args: [boxId] });
      toast.success('Box closed');
      await new Promise(resolve => setTimeout(resolve, 1000));
      await refetchBoxes();
    } catch (error: any) {
      toast.error(error.message || 'Failed to close box');
    }
  };

  // Reopen box
  const { write: reopenBoxWrite } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: EncryptedFeedbackABI.abi,
    functionName: 'reopenBox',
  });

  const reopenBox = async (boxId: bigint) => {
    try {
      reopenBoxWrite?.({ args: [boxId] });
      toast.success('Box reopened');
      await new Promise(resolve => setTimeout(resolve, 1000));
      await refetchBoxes();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reopen box');
    }
  };

  // Get box stats
  const getBoxStats = async (boxId: bigint): Promise<BoxStats | null> => {
    if (!publicClient) return null;
    
    try {
      const stats = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: EncryptedFeedbackABI.abi,
        functionName: 'getBoxStats',
        args: [boxId],
      });
      
      return stats as BoxStats;
    } catch (error) {
      console.error('Error fetching stats:', error);
      return null;
    }
  };

  // Get feedback for a box
  const getBoxFeedback = async (boxId: bigint): Promise<FeedbackMetadata[]> => {
    if (!publicClient || !address) return [];
    
    try {
      const feedback = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: EncryptedFeedbackABI.abi,
        functionName: 'getBoxFeedback',
        args: [boxId],
        account: address,
      });
      
      return feedback as FeedbackMetadata[];
    } catch (error) {
      console.error('Error fetching feedback:', error);
      return [];
    }
  };

  // Decrypt feedback
  const decryptFeedback = async (boxId: bigint, feedbackId: bigint): Promise<string> => {
    if (!publicClient || !signer || !address) {
      throw new Error('Not connected');
    }
    
    try {
      const result = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: EncryptedFeedbackABI.abi,
        functionName: 'getFeedbackContent',
        args: [boxId, feedbackId],
        account: address,
      }) as any;
      
      const handles = result[0];
      
      const decrypted = await decryptFeedbackContent(
        CONTRACT_ADDRESS,
        handles,
        signer
      );
      
      return decrypted;
    } catch (error: any) {
      console.error('Decryption error:', error);
      throw error;
    }
  };

  return {
    boxes,
    isCreating: isCreating || isCreatingBox,
    isSubmitting,
    createBox,
    submitFeedback,
    closeBox,
    reopenBox,
    getBoxStats,
    getBoxFeedback,
    decryptFeedback,
    refetchBoxes,
  };
}
