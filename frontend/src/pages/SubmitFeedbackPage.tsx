import { useState, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useFeedback, Sentiment, FeedbackBox } from '../hooks/useFeedback';
import { toast } from 'react-hot-toast';
import EncryptedFeedbackABI from '../abi/EncryptedFeedback.json';
import { EncryptionProgress } from '../components/EncryptionProgress';

const CONTRACT_ADDRESS = import.meta.env.VITE_FEEDBACK_CONTRACT_ADDRESS as `0x${string}`;

export function SubmitFeedbackPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { submitFeedback, isSubmitting } = useFeedback();
  
  const [boxId, setBoxId] = useState('');
  const [box, setBox] = useState<FeedbackBox | null>(null);
  const [loading, setLoading] = useState(false);
  const [showEncryptionSteps, setShowEncryptionSteps] = useState(false);
  const [showEncryptionProgress, setShowEncryptionProgress] = useState(false);
  
  // Form states
  const [feedbackContent, setFeedbackContent] = useState('');
  const [rating, setRating] = useState(0);
  const [sentiment, setSentiment] = useState(Sentiment.Positive);

  const loadBox = async () => {
    if (!boxId || !publicClient) return;
    
    setLoading(true);
    try {
      const boxData = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: EncryptedFeedbackABI.abi,
        functionName: 'getBoxDetails',
        args: [BigInt(boxId)],
      });
      
      setBox(boxData as FeedbackBox);
      toast.success('Box found!');
    } catch (error) {
      console.error('Error loading box:', error);
      toast.error('Box not found');
      setBox(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!box) return;
    
    setShowEncryptionProgress(true);
    
    try {
      await submitFeedback(box.id, feedbackContent, rating, sentiment);
      
      // Reset form
      setFeedbackContent('');
      setRating(0);
      setSentiment(Sentiment.Positive);
    } finally {
      setTimeout(() => setShowEncryptionProgress(false), 500);
    }
  };

  const getCategoryLabel = (cat: number) => {
    return ['Team', 'Product', 'Event', 'Course', 'General'][cat];
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <EncryptionProgress isEncrypting={showEncryptionProgress} />
      
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <span className="font-semibold text-lg">Submit Feedback</span>
          </div>
          <ConnectButton />
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-12 max-w-2xl">
        {!box ? (
          // Box ID Input
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold mb-2">Share Your Feedback</h1>
              <p className="text-gray-400">Enter the feedback box ID to get started</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Feedback Box ID
                </label>
                <input
                  type="text"
                  value={boxId}
                  onChange={(e) => setBoxId(e.target.value)}
                  placeholder="Enter box ID (e.g., 0, 1, 2...)"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              
              <button
                onClick={loadBox}
                disabled={!boxId || loading}
                className="w-full px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Continue'}
              </button>
            </div>
          </div>
        ) : (
          // Feedback Form
          <div className="space-y-6">
            {/* Box Info */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h1 className="text-2xl font-bold text-white">{box.title}</h1>
                  <p className="text-gray-400 mt-1">{box.description}</p>
                </div>
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-sm rounded-lg">
                  {getCategoryLabel(box.category)}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                {box.submissionCount.toString()} submissions so far
              </p>
            </div>

            {/* Feedback Form */}
            {box.isActive ? (
              <form onSubmit={handleSubmit} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your Feedback
                    <span className="ml-2 px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/50 rounded text-xs text-yellow-400">
                      🔐 Encrypted
                    </span>
                  </label>
                  <textarea
                    value={feedbackContent}
                    onChange={(e) => setFeedbackContent(e.target.value)}
                    placeholder="Share your thoughts... (will be encrypted)"
                    rows={6}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                    required
                  />
                  <div className="mt-2 space-y-2">
                    <p className="text-xs text-gray-500 flex items-start space-x-1">
                      <span>💡</span>
                      <span>Your feedback is encrypted and anonymous. Only the box owner can decrypt it.</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowEncryptionSteps(!showEncryptionSteps)}
                      className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center space-x-1"
                    >
                      <span>{showEncryptionSteps ? '▼' : '▶'}</span>
                      <span>How encryption works</span>
                    </button>
                    {showEncryptionSteps && (
                      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 space-y-2 text-xs">
                        <div className="flex items-start space-x-2">
                          <span className="text-green-400">1️⃣</span>
                          <div>
                            <div className="font-medium text-white">Your browser encrypts your text</div>
                            <div className="text-gray-400">Using FHE, your message is scrambled into unreadable code</div>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <span className="text-green-400">2️⃣</span>
                          <div>
                            <div className="font-medium text-white">Encrypted data goes to blockchain</div>
                            <div className="text-gray-400">Only scrambled code is stored, never your original text</div>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <span className="text-green-400">3️⃣</span>
                          <div>
                            <div className="font-medium text-white">Owner decrypts with their wallet</div>
                            <div className="text-gray-400">They sign a request to unscramble and read your feedback</div>
                          </div>
                        </div>
                        <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded">
                          <div className="text-yellow-400 font-medium">🔒 Your identity stays anonymous!</div>
                          <div className="text-gray-400">No one can link your wallet to your feedback content</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {box.allowRatings && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Rating (Optional)
                    </label>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`text-3xl transition-all transform hover:scale-110 ${
                            star <= rating 
                              ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]' 
                              : 'text-gray-600 hover:text-gray-500'
                          }`}
                        >
                          ⭐
                        </button>
                      ))}
                      {rating > 0 && (
                        <button
                          type="button"
                          onClick={() => setRating(0)}
                          className="ml-2 text-sm text-gray-500 hover:text-gray-400"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {box.allowSentiment && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Sentiment
                    </label>
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => setSentiment(Sentiment.Positive)}
                        className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                          sentiment === Sentiment.Positive
                            ? 'border-green-500 bg-green-500/20 text-green-400'
                            : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        <span className="text-2xl">😊</span>
                        <div className="text-sm mt-1">Positive</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSentiment(Sentiment.Neutral)}
                        className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                          sentiment === Sentiment.Neutral
                            ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400'
                            : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        <span className="text-2xl">😐</span>
                        <div className="text-sm mt-1">Neutral</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSentiment(Sentiment.Negative)}
                        className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                          sentiment === Sentiment.Negative
                            ? 'border-red-500 bg-red-500/20 text-red-400'
                            : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        <span className="text-2xl">😞</span>
                        <div className="text-sm mt-1">Negative</div>
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setBox(null)}
                    className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !isConnected}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {!isConnected ? 'Connect Wallet to Submit' : isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Box Closed</h3>
                <p className="text-gray-400">This feedback box is no longer accepting submissions.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
