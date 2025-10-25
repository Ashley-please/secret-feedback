import { useState, useEffect } from 'react';
import { useAccount, useContractRead, useContractWrite, useWaitForTransaction, usePublicClient } from 'wagmi';
import { toast } from 'react-hot-toast';
import { useSigner } from './useSigner';
import EncryptedTasksABI from '../abi/EncryptedTasks.json';
import { encryptTaskDescription } from '../utils/taskEncryption';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`;

export enum TaskStatus {
  Todo = 0,
  InProgress = 1,
  Completed = 2,
}

export enum Priority {
  Low = 0,
  Medium = 1,
  High = 2,
}

export interface TaskMetadata {
  id: bigint;
  title: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: bigint;
  category: string;
  tags: string[];
  createdAt: bigint;
  updatedAt: bigint;
  completedAt: bigint;
  chunkCount: number;
  isArchived: boolean;
  isFavorite: boolean;
  color: string;
  owner: string;
}

export interface UserStats {
  totalTasks: bigint;
  todoTasks: bigint;
  inProgressTasks: bigint;
  completedTasks: bigint;
  archivedTasks: bigint;
  favoriteTasks: bigint;
  overdueTasks: bigint;
  totalStorage: bigint;
}

export function useTasks() {
  const { address } = useAccount();
  const signer = useSigner();
  const publicClient = usePublicClient();
  const [tasks, setTasks] = useState<TaskMetadata[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Manual fetch function using publicClient with account context
  const fetchTasks = async () => {
    if (!address || !publicClient) return;
    
    setIsLoading(true);
    try {
      console.log('🔄 Fetching tasks for:', address);
      
      const tasksResult = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: EncryptedTasksABI.abi,
        functionName: 'getMyTasks',
        account: address,
      });
      
      const statsResult = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: EncryptedTasksABI.abi,
        functionName: 'getMyStats',
        account: address,
      });
      
      console.log('📦 Tasks result:', tasksResult);
      console.log('📊 Stats result:', statsResult);
      
      setTasks(tasksResult as TaskMetadata[]);
      setStats(statsResult as UserStats);
    } catch (error) {
      console.error('❌ Error fetching tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on mount and when address changes
  useEffect(() => {
    if (address && publicClient) {
      fetchTasks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, publicClient]);

  const refetchTasks = () => fetchTasks();
  const refetchStats = () => fetchTasks();

  // Update task status
  const { write: updateStatus, data: updateStatusData } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: EncryptedTasksABI.abi,
    functionName: 'updateTaskStatus',
  });

  const { isLoading: isUpdatingStatus } = useWaitForTransaction({
    hash: updateStatusData?.hash,
    onSuccess: () => {
      toast.success('Task status updated!');
      refetchTasks();
      refetchStats();
    },
  });

  // Update task priority
  const { write: updatePriority, data: updatePriorityData } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: EncryptedTasksABI.abi,
    functionName: 'updateTaskPriority',
  });

  const { isLoading: isUpdatingPriority } = useWaitForTransaction({
    hash: updatePriorityData?.hash,
    onSuccess: () => {
      toast.success('Task priority updated!');
      refetchTasks();
      refetchStats();
    },
  });

  // Delete task
  const { write: deleteTask, data: deleteTaskData } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: EncryptedTasksABI.abi,
    functionName: 'deleteTask',
  });

  const { isLoading: isDeletingTask } = useWaitForTransaction({
    hash: deleteTaskData?.hash,
    onSuccess: () => {
      toast.success('Task deleted!');
      refetchTasks();
      refetchStats();
    },
  });

  // Toggle favorite
  const { write: toggleFavorite, data: toggleFavoriteData } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: EncryptedTasksABI.abi,
    functionName: 'setFavorite',
  });

  const { isLoading: isTogglingFavorite } = useWaitForTransaction({
    hash: toggleFavoriteData?.hash,
    onSuccess: () => {
      toast.success('Favorite updated!');
      refetchTasks();
      refetchStats();
    },
  });

  // Toggle archive
  const { write: toggleArchive, data: toggleArchiveData } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: EncryptedTasksABI.abi,
    functionName: 'setArchived',
  });

  const { isLoading: isTogglingArchive } = useWaitForTransaction({
    hash: toggleArchiveData?.hash,
    onSuccess: () => {
      toast.success('Archive status updated!');
      refetchTasks();
      refetchStats();
    },
  });

  // Create task with encryption
  const { write: writeCreateTask, data: createTaskData } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: EncryptedTasksABI.abi,
    functionName: 'createTask',
  });

  const { isLoading: isCreatingTask } = useWaitForTransaction({
    hash: createTaskData?.hash,
    onSuccess: async () => {
      toast.success('Task created successfully!');
      setIsCreating(false);
      // Add a small delay to ensure blockchain state is updated
      await new Promise(resolve => setTimeout(resolve, 1000));
      await refetchTasks();
      await refetchStats();
    },
    onError: (error) => {
      toast.error('Failed to create task');
      setIsCreating(false);
      console.error('Create task error:', error);
    },
  });

  const createTask = async (
    title: string,
    description: string,
    priority: Priority,
    dueDate: number,
    category: string,
    tags: string[],
    color: string
  ) => {
    if (!address || !signer) {
      toast.error('Please connect your wallet');
      return;
    }

    setIsCreating(true);
    
    try {
      toast.loading('Encrypting task description...', { id: 'encrypt' });
      
      // Encrypt the task description
      const { encryptedChunks, inputProof } = await encryptTaskDescription(
        CONTRACT_ADDRESS,
        address,
        description || ' ' // Use space if empty to avoid empty encryption
      );

      toast.success('Description encrypted!', { id: 'encrypt' });
      toast.loading('Creating task on-chain...', { id: 'create' });

      // Call contract
      writeCreateTask?.({
        args: [
          encryptedChunks,
          inputProof,
          title,
          priority,
          BigInt(dueDate),
          category,
          tags,
          color
        ],
      });

      toast.dismiss('create');
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast.error(error.message || 'Failed to encrypt task');
      setIsCreating(false);
    }
  };

  return {
    tasks,
    stats,
    refetchTasks,
    refetchStats,
    createTask,
    isCreating: isCreating || isCreatingTask,
    updateStatus,
    isUpdatingStatus,
    updatePriority,
    isUpdatingPriority,
    deleteTask,
    isDeletingTask,
    toggleFavorite,
    isTogglingFavorite,
    toggleArchive,
    isTogglingArchive,
  };
}
