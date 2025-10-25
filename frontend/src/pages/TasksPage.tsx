import { useState, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useTasks, TaskStatus, Priority, TaskMetadata } from '../hooks/useTasks';
import { TaskForm, TaskFormData } from '../components/TaskForm';
import { useSigner } from '../hooks/useSigner';
import { decryptTaskDescription } from '../utils/taskEncryption';
import { toast } from 'react-hot-toast';
import EncryptedTasksABI from '../abi/EncryptedTasks.json';

export function TasksPage() {
  const { address, isConnected } = useAccount();
  const signer = useSigner();
  const publicClient = usePublicClient();
  const {
    tasks,
    stats,
    createTask,
    isCreating,
    updateStatus,
    isUpdatingStatus,
    updatePriority,
    deleteTask,
    toggleFavorite,
    refetchTasks,
    refetchStats,
  } = useTasks();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedView, setSelectedView] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all');
  const [filteredTasks, setFilteredTasks] = useState<TaskMetadata[]>([]);
  const [decryptedDescriptions, setDecryptedDescriptions] = useState<Record<string, string>>({});
  const [decryptingTaskId, setDecryptingTaskId] = useState<bigint | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<bigint | null>(null);

  // Filter tasks based on view
  useEffect(() => {
    if (!tasks) return;

    let filtered = tasks.filter((task) => task.owner !== '0x0000000000000000000000000000000000000000');

    const now = Math.floor(Date.now() / 1000);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const todayEndTimestamp = Math.floor(todayEnd.getTime() / 1000);

    switch (selectedView) {
      case 'today':
        filtered = filtered.filter(
          (task) =>
            task.status !== TaskStatus.Completed &&
            task.dueDate > 0 &&
            Number(task.dueDate) <= todayEndTimestamp
        );
        break;
      case 'upcoming':
        filtered = filtered.filter(
          (task) =>
            task.status !== TaskStatus.Completed &&
            task.dueDate > 0 &&
            Number(task.dueDate) > todayEndTimestamp
        );
        break;
      case 'completed':
        filtered = filtered.filter((task) => task.status === TaskStatus.Completed);
        break;
      default:
        filtered = filtered.filter((task) => !task.isArchived);
    }

    setFilteredTasks(filtered);
  }, [tasks, selectedView]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(!showCommandPalette);
      }
      // Cmd+N or Ctrl+N to create new task
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setShowTaskForm(true);
      }
      // Escape to close modals
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
        setShowTaskForm(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCommandPalette]);

  const handleCreateTask = async (data: TaskFormData) => {
    await createTask(
      data.title,
      data.description,
      data.priority,
      data.dueDate,
      data.category,
      data.tags,
      data.color
    );
    setShowTaskForm(false);
  };

  const handleDecryptTask = async (task: TaskMetadata) => {
    if (!signer || !address) {
      toast.error('Please connect your wallet');
      return;
    }

    const taskIdStr = task.id.toString();
    
    // If already decrypted, just toggle expansion
    if (decryptedDescriptions[taskIdStr]) {
      setExpandedTaskId(expandedTaskId === task.id ? null : task.id);
      return;
    }

    setDecryptingTaskId(task.id);
    try {
      toast.loading('Fetching encrypted data...', { id: 'decrypt' });
      
      const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
      
      if (!publicClient) {
        toast.error('Client not ready', { id: 'decrypt' });
        return;
      }
      
      // First, fetch the encrypted chunks from the contract
      console.log('🔍 Fetching task content for ID:', task.id, 'Type:', typeof task.id);
      
      const taskContent = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: EncryptedTasksABI.abi,
        functionName: 'getTaskContent',
        args: [task.id],
        account: address,
      }) as any;
      
      console.log('📦 Task content response:', taskContent);
      const encryptedChunks = taskContent[0]; // First element is the handles array
      
      console.log('📦 Encrypted chunks:', encryptedChunks);
      
      if (!encryptedChunks || encryptedChunks.length === 0) {
        toast.error('No encrypted data found', { id: 'decrypt' });
        return;
      }
      
      toast.loading('Decrypting task description...', { id: 'decrypt' });
      
      const decrypted = await decryptTaskDescription(
        contractAddress,
        encryptedChunks,
        signer
      );
      
      setDecryptedDescriptions(prev => ({
        ...prev,
        [taskIdStr]: decrypted
      }));
      setExpandedTaskId(task.id);
      
      toast.success('Description decrypted!', { id: 'decrypt' });
    } catch (error: any) {
      console.error('Decryption error:', error);
      toast.error(error.message || 'Failed to decrypt', { id: 'decrypt' });
    } finally {
      setDecryptingTaskId(null);
    }
  };

  const handleToggleStatus = (taskId: bigint, currentStatus: TaskStatus) => {
    const newStatus =
      currentStatus === TaskStatus.Todo
        ? TaskStatus.InProgress
        : currentStatus === TaskStatus.InProgress
        ? TaskStatus.Completed
        : TaskStatus.Todo;

    updateStatus?.({ args: [taskId, newStatus] });
  };

  const handleDeleteTask = (taskId: bigint) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask?.({ args: [taskId] });
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.High:
        return 'text-red-400';
      case Priority.Medium:
        return 'text-yellow-400';
      case Priority.Low:
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  const getPriorityLabel = (priority: Priority) => {
    switch (priority) {
      case Priority.High:
        return 'High';
      case Priority.Medium:
        return 'Med';
      case Priority.Low:
        return 'Low';
      default:
        return '';
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.Todo:
        return '○';
      case TaskStatus.InProgress:
        return '◐';
      case TaskStatus.Completed:
        return '●';
      default:
        return '○';
    }
  };

  const formatDueDate = (timestamp: number) => {
    if (timestamp === 0) return 'No due date';
    const date = new Date(timestamp * 1000);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2">Encrypted Tasks</h1>
            <p className="text-gray-400 mb-6">Privacy-first task management</p>
          </div>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <span className="font-semibold text-lg">Tasks</span>
            </div>

            {/* Search */}
            <button
              onClick={() => setShowCommandPalette(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-gray-400 text-sm">Search...</span>
              <kbd className="px-2 py-1 text-xs bg-gray-700 rounded border border-gray-600 font-mono">⌘K</kbd>
            </button>
          </div>

          <ConnectButton />
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8">
        {/* Stats Bar */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
              <div className="text-2xl font-bold text-white">{stats.totalTasks.toString()}</div>
              <div className="text-sm text-gray-400">Total</div>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
              <div className="text-2xl font-bold text-blue-400">{stats.todoTasks.toString()}</div>
              <div className="text-sm text-gray-400">Todo</div>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
              <div className="text-2xl font-bold text-yellow-400">{stats.inProgressTasks.toString()}</div>
              <div className="text-sm text-gray-400">In Progress</div>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
              <div className="text-2xl font-bold text-green-400">{stats.completedTasks.toString()}</div>
              <div className="text-sm text-gray-400">Completed</div>
            </div>
          </div>
        )}

        {/* View Selector */}
        <div className="flex items-center space-x-2 mb-6">
          <button
            onClick={() => setSelectedView('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedView === 'all'
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedView('today')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedView === 'today'
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setSelectedView('upcoming')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedView === 'upcoming'
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setSelectedView('completed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedView === 'completed'
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            Completed
          </button>
        </div>

        {/* Task List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              {selectedView === 'all' && 'All Tasks'}
              {selectedView === 'today' && 'Today'}
              {selectedView === 'upcoming' && 'Upcoming'}
              {selectedView === 'completed' && 'Completed'}
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  refetchTasks();
                  refetchStats();
                }}
                className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-all"
                title="Refresh tasks"
              >
                🔄
              </button>
              <button
                onClick={() => setShowTaskForm(true)}
                className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white rounded-lg text-sm font-medium transition-all flex items-center space-x-2 shadow-lg shadow-yellow-500/20"
              >
                <span>+ New Task</span>
                <kbd className="px-1.5 py-0.5 text-xs bg-white/20 rounded font-mono">⌘N</kbd>
              </button>
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-400 mb-2">No tasks yet</p>
              <p className="text-gray-600 text-sm">Create your first encrypted task to get started</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className="group bg-gray-900/30 hover:bg-gray-900/60 border border-gray-800 hover:border-gray-700 rounded-lg p-4 transition-all cursor-pointer"
              >
                <div className="flex items-start space-x-4">
                  {/* Status Icon */}
                  <button
                    onClick={() => handleToggleStatus(task.id, task.status)}
                    className="text-2xl text-gray-500 hover:text-white transition-colors mt-0.5"
                    disabled={isUpdatingStatus}
                  >
                    {getStatusIcon(task.status)}
                  </button>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-1">
                      <span className={`text-xs font-mono font-semibold ${getPriorityColor(task.priority)}`}>
                        {getPriorityLabel(task.priority)}
                      </span>
                      <h3 className={`font-medium ${
                        task.status === TaskStatus.Completed
                          ? 'text-gray-500 line-through'
                          : 'text-white'
                      }`}>
                        {task.title}
                      </h3>
                      <span className="text-xs text-gray-500 font-mono">#{Number(task.id)}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      {Number(task.dueDate) > 0 && (
                        <span>{formatDueDate(Number(task.dueDate))}</span>
                      )}
                      {task.category && (
                        <span className="flex items-center">
                          <span className="mr-1">📁</span>
                          {task.category}
                        </span>
                      )}
                      {task.tags.length > 0 && (
                        <span className="flex items-center space-x-1">
                          {task.tags.map((tag, i) => (
                            <span key={i} className="text-purple-400">#{tag}</span>
                          ))}
                        </span>
                      )}
                    </div>
                    
                    {/* Decrypt Button */}
                    <button
                      onClick={() => handleDecryptTask(task)}
                      disabled={decryptingTaskId === task.id}
                      className="mt-2 text-xs text-yellow-400 hover:text-yellow-300 flex items-center space-x-1 transition-colors"
                    >
                      <span>🔓</span>
                      <span>
                        {decryptingTaskId === task.id
                          ? 'Decrypting...'
                          : decryptedDescriptions[task.id.toString()]
                          ? expandedTaskId === task.id ? 'Hide description' : 'Show description'
                          : 'Decrypt description'}
                      </span>
                    </button>
                    
                    {/* Decrypted Description */}
                    {expandedTaskId === task.id && decryptedDescriptions[task.id.toString()] && (
                      <div className="mt-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-300 whitespace-pre-wrap">
                          {decryptedDescriptions[task.id.toString()]}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-2">
                    <button
                      onClick={() => toggleFavorite?.({ args: [task.id, !task.isFavorite] })}
                      className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                      title={task.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <svg
                        className={`w-4 h-4 ${
                          task.isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                      title="Delete task"
                    >
                      <svg className="w-4 h-4 text-gray-400 hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
          onClose={() => setShowTaskForm(false)}
          onSubmit={handleCreateTask}
          isLoading={isCreating}
        />
      )}

      {/* Command Palette */}
      {showCommandPalette && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-32">
          <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="p-4 border-b border-gray-800">
              <input
                type="text"
                placeholder="Search tasks or type a command..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-white placeholder-gray-500 outline-none text-lg"
                autoFocus
              />
            </div>
            <div className="p-2 max-h-96 overflow-y-auto">
              <div className="text-xs text-gray-500 uppercase tracking-wider px-3 py-2">Commands</div>
              <button
                onClick={() => {
                  setShowTaskForm(true);
                  setShowCommandPalette(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-800 rounded-lg text-sm text-gray-300 flex items-center space-x-3"
              >
                <span>+ New Task</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
