import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useFeedback, BoxCategory, Sentiment, FeedbackBox, FeedbackMetadata, BoxStats } from '../hooks/useFeedback';
import { toast } from 'react-hot-toast';
import { DecryptionProgress } from '../components/EncryptionProgress';

export function FeedbackPage() {
  const { address, isConnected } = useAccount();
  const {
    boxes,
    isCreating,
    isSubmitting,
    createBox,
    submitFeedback,
    closeBox,
    reopenBox,
    getBoxStats,
    getBoxFeedback,
    decryptFeedback,
    refetchBoxes,
  } = useFeedback();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedBox, setSelectedBox] = useState<FeedbackBox | null>(null);
  const [boxStats, setBoxStats] = useState<BoxStats | null>(null);
  const [feedbackList, setFeedbackList] = useState<FeedbackMetadata[]>([]);
  const [decryptedContent, setDecryptedContent] = useState<Record<string, string>>({});
  const [decryptingId, setDecryptingId] = useState<bigint | null>(null);
  const [showDecryptionSteps, setShowDecryptionSteps] = useState<Record<string, boolean>>({});
  const [showDecryptionProgress, setShowDecryptionProgress] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(BoxCategory.General);
  const [allowRatings, setAllowRatings] = useState(true);
  const [allowSentiment, setAllowSentiment] = useState(true);

  // Feedback form states
  const [feedbackContent, setFeedbackContent] = useState('');
  const [rating, setRating] = useState(0);
  const [sentiment, setSentiment] = useState(Sentiment.Positive);

  useEffect(() => {
    if (selectedBox) {
      loadBoxDetails(selectedBox.id);
    }
  }, [selectedBox]);

  const loadBoxDetails = async (boxId: bigint) => {
    const stats = await getBoxStats(boxId);
    const feedback = await getBoxFeedback(boxId);
    setBoxStats(stats);
    setFeedbackList(feedback);
  };

  const handleCreateBox = async (e: React.FormEvent) => {
    e.preventDefault();
    await createBox(title, description, category, allowRatings, allowSentiment);
    setShowCreateForm(false);
    setTitle('');
    setDescription('');
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBox) return;
    
    await submitFeedback(selectedBox.id, feedbackContent, rating, sentiment);
    setFeedbackContent('');
    setRating(0);
    setSentiment(Sentiment.Positive);
    await loadBoxDetails(selectedBox.id);
  };

  const handleDecrypt = async (feedbackId: bigint) => {
    if (!selectedBox) return;
    
    const key = feedbackId.toString();
    if (decryptedContent[key]) return;

    setDecryptingId(feedbackId);
    setShowDecryptionProgress(true);
    
    try {
      const content = await decryptFeedback(selectedBox.id, feedbackId);
      setDecryptedContent(prev => ({ ...prev, [key]: content }));
    } catch (error: any) {
      toast.error(error.message || 'Failed to decrypt');
    } finally {
      setTimeout(() => {
        setDecryptingId(null);
        setShowDecryptionProgress(false);
      }, 500);
    }
  };

  const getCategoryLabel = (cat: BoxCategory) => {
    return ['Team', 'Product', 'Event', 'Course', 'General'][cat];
  };

  const getSentimentEmoji = (sent: Sentiment) => {
    return ['😊', '😐', '😞'][sent];
  };

  if (!isConnected) {
    return (
      <>
        <DecryptionProgress isDecrypting={showDecryptionProgress} />
        <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">Encrypted Feedback</h1>
              <p className="text-gray-400 mb-6">Anonymous feedback collection with FHE</p>
            </div>
            <ConnectButton />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DecryptionProgress isDecrypting={showDecryptionProgress} />
      <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <span className="font-semibold text-lg">Feedback Boxes</span>
          </div>
          <ConnectButton />
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar - Box List */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">My Boxes</h2>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white rounded-lg text-sm font-medium transition-all"
                >
                  + New Box
                </button>
              </div>

              <div className="space-y-2">
                {boxes.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">No boxes yet</p>
                ) : (
                  boxes.map((box) => (
                    <button
                      key={box.id.toString()}
                      onClick={() => setSelectedBox(box)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        selectedBox?.id === box.id
                          ? 'bg-yellow-500/20 border border-yellow-500/50'
                          : 'bg-gray-800 hover:bg-gray-700 border border-gray-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-white truncate">{box.title}</h3>
                            <span className="px-2 py-0.5 bg-gray-700 text-gray-400 text-xs rounded font-mono">
                              ID: {box.id.toString()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {getCategoryLabel(box.category)} • {box.submissionCount.toString()} submissions
                          </p>
                        </div>
                        <span className={`ml-2 px-2 py-0.5 text-xs rounded ${
                          box.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
                        }`}>
                          {box.isActive ? 'Active' : 'Closed'}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {selectedBox ? (
              <div className="space-y-6">
                {/* Box Header */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h1 className="text-2xl font-bold text-white">{selectedBox.title}</h1>
                        <span className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 text-sm rounded-lg font-mono">
                          ID: {selectedBox.id.toString()}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(selectedBox.id.toString());
                            toast.success('Box ID copied!');
                          }}
                          className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm flex items-center space-x-1"
                        >
                          <span>📋</span>
                          <span>Copy ID</span>
                        </button>
                      </div>
                      <p className="text-gray-400">{selectedBox.description}</p>
                    </div>
                    <button
                      onClick={() => selectedBox.isActive ? closeBox(selectedBox.id) : reopenBox(selectedBox.id)}
                      className="ml-4 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm whitespace-nowrap"
                    >
                      {selectedBox.isActive ? 'Close Box' : 'Reopen Box'}
                    </button>
                  </div>

                  {/* Stats */}
                  {boxStats && (
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="bg-gray-800 rounded-lg p-3">
                        <div className="text-2xl font-bold text-white">{boxStats.totalSubmissions.toString()}</div>
                        <div className="text-xs text-gray-400">Total</div>
                      </div>
                      <div className="bg-gray-800 rounded-lg p-3">
                        <div className="text-2xl font-bold text-yellow-400">{boxStats.unreadCount.toString()}</div>
                        <div className="text-xs text-gray-400">Unread</div>
                      </div>
                      <div className="bg-gray-800 rounded-lg p-3">
                        <div className="text-2xl font-bold text-green-400">
                          {boxStats.avgRating > 0 ? (Number(boxStats.avgRating) / 100).toFixed(1) : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-400">Avg Rating</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Feedback List */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h2 className="text-lg font-semibold mb-4">Feedback Submissions</h2>
                  
                  {feedbackList.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No feedback yet</p>
                  ) : (
                    <div className="space-y-3">
                      {feedbackList.map((feedback) => (
                        <div
                          key={feedback.id.toString()}
                          className="bg-gray-800 border border-gray-700 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              {feedback.rating > 0 && (
                                <span className="text-yellow-400">
                                  {'⭐'.repeat(feedback.rating)}
                                </span>
                              )}
                              <span className="text-2xl">{getSentimentEmoji(feedback.sentiment)}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(Number(feedback.submittedAt) * 1000).toLocaleString()}
                              </span>
                            </div>
                            {!feedback.isRead && (
                              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">New</span>
                            )}
                          </div>

                          <div className="space-y-2">
                            <button
                              onClick={() => handleDecrypt(feedback.id)}
                              disabled={decryptingId === feedback.id}
                              className="text-sm text-yellow-400 hover:text-yellow-300 flex items-center space-x-1"
                            >
                              <span>🔓</span>
                              <span>
                                {decryptingId === feedback.id
                                  ? 'Decrypting...'
                                  : decryptedContent[feedback.id.toString()]
                                  ? 'Decrypted'
                                  : 'Decrypt feedback'}
                              </span>
                            </button>

                            {!decryptedContent[feedback.id.toString()] && (
                              <button
                                type="button"
                                onClick={() => setShowDecryptionSteps(prev => ({
                                  ...prev,
                                  [feedback.id.toString()]: !prev[feedback.id.toString()]
                                }))}
                                className="text-xs text-gray-500 hover:text-gray-400 flex items-center space-x-1"
                              >
                                <span>{showDecryptionSteps[feedback.id.toString()] ? '▼' : '▶'}</span>
                                <span>How decryption works</span>
                              </button>
                            )}

                            {showDecryptionSteps[feedback.id.toString()] && !decryptedContent[feedback.id.toString()] && (
                              <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 space-y-2 text-xs">
                                <div className="flex items-start space-x-2">
                                  <span className="text-blue-400">1️⃣</span>
                                  <div>
                                    <div className="font-medium text-white">Fetch encrypted data from blockchain</div>
                                    <div className="text-gray-400">Your wallet retrieves the scrambled feedback</div>
                                  </div>
                                </div>
                                <div className="flex items-start space-x-2">
                                  <span className="text-blue-400">2️⃣</span>
                                  <div>
                                    <div className="font-medium text-white">Sign decryption request</div>
                                    <div className="text-gray-400">You prove you're the box owner with your wallet signature</div>
                                  </div>
                                </div>
                                <div className="flex items-start space-x-2">
                                  <span className="text-blue-400">3️⃣</span>
                                  <div>
                                    <div className="font-medium text-white">Zama relayer unscrambles the text</div>
                                    <div className="text-gray-400">The encrypted code is converted back to readable text</div>
                                  </div>
                                </div>
                                <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded">
                                  <div className="text-blue-400 font-medium">🔐 Only you can decrypt!</div>
                                  <div className="text-gray-400">Your wallet signature proves ownership</div>
                                </div>
                              </div>
                            )}

                            {decryptedContent[feedback.id.toString()] && (
                              <div className="mt-3 p-3 bg-gray-900 rounded-lg border border-gray-700">
                                <p className="text-sm text-gray-300 whitespace-pre-wrap">
                                  {decryptedContent[feedback.id.toString()]}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <p className="text-gray-400">Select a box to view feedback</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Box Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Create Feedback Box</h2>
            <form onSubmit={handleCreateBox} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(Number(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                >
                  <option value={BoxCategory.Team}>Team</option>
                  <option value={BoxCategory.Product}>Product</option>
                  <option value={BoxCategory.Event}>Event</option>
                  <option value={BoxCategory.Course}>Course</option>
                  <option value={BoxCategory.General}>General</option>
                </select>
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={allowRatings}
                    onChange={(e) => setAllowRatings(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-300">Allow ratings</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={allowSentiment}
                    onChange={(e) => setAllowSentiment(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-300">Allow sentiment</span>
                </label>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white rounded-lg disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Box'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
