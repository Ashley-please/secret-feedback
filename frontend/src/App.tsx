import { useState } from 'react';
import { WagmiConfig, useAccount } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { wagmiConfig, chains } from './config/wagmi';
import { TasksPage } from './pages/TasksPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { SubmitFeedbackPage } from './pages/SubmitFeedbackPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { ChainGuard } from './components/ChainGuard';

import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

const TASKS_CONTRACT = import.meta.env.VITE_CONTRACT_ADDRESS || '';
const FEEDBACK_CONTRACT = import.meta.env.VITE_FEEDBACK_CONTRACT_ADDRESS || '';

type Page = 'owner' | 'submit' | 'tasks' | 'how-it-works';

function AppContent() {
  const { isConnected } = useAccount();
  const [currentPage, setCurrentPage] = useState<Page>('submit');

  // Determine which app to show based on available contracts
  const showFeedback = FEEDBACK_CONTRACT && !TASKS_CONTRACT;
  const showTasks = TASKS_CONTRACT && !FEEDBACK_CONTRACT;

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1f2937',
            color: '#f3f4f6',
          },
        }}
      />
      
      <ChainGuard>
        {!TASKS_CONTRACT && !FEEDBACK_CONTRACT && isConnected ? (
          <div className="min-h-screen bg-gray-950 flex items-center justify-center">
            <div className="text-center max-w-md mx-4">
              <div className="w-16 h-16 bg-yellow-900/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Contract Not Configured
              </h3>
              <p className="text-sm text-gray-400">
                Please set contract addresses in your .env file.
              </p>
            </div>
          </div>
        ) : showFeedback ? (
          <>
            {/* Navigation - Top on mobile, bottom-right on desktop */}
            <div className="md:fixed md:bottom-6 md:right-6 z-50">
              {/* Mobile: Horizontal tabs at top */}
              <div className="md:hidden bg-gray-900 border-b border-gray-800 px-4 py-2">
                <div className="flex space-x-2 overflow-x-auto">
                  <button
                    onClick={() => setCurrentPage('submit')}
                    className={`px-3 py-2 rounded-lg font-medium transition-all whitespace-nowrap text-sm ${
                      currentPage === 'submit'
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white'
                        : 'bg-gray-800 text-gray-300'
                    }`}
                  >
                    📝 Submit
                  </button>
                  <button
                    onClick={() => setCurrentPage('owner')}
                    className={`px-3 py-2 rounded-lg font-medium transition-all whitespace-nowrap text-sm ${
                      currentPage === 'owner'
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white'
                        : 'bg-gray-800 text-gray-300'
                    }`}
                  >
                    👤 My Boxes
                  </button>
                  <button
                    onClick={() => setCurrentPage('how-it-works')}
                    className={`px-3 py-2 rounded-lg font-medium transition-all whitespace-nowrap text-sm ${
                      currentPage === 'how-it-works'
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white'
                        : 'bg-gray-800 text-gray-300'
                    }`}
                  >
                    ℹ️ How It Works
                  </button>
                </div>
              </div>

              {/* Desktop: Floating buttons */}
              <div className="hidden md:flex flex-col space-y-2">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage('submit')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all shadow-lg ${
                      currentPage === 'submit'
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    📝 Submit Feedback
                  </button>
                  <button
                    onClick={() => setCurrentPage('owner')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all shadow-lg ${
                      currentPage === 'owner'
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    👤 My Boxes
                  </button>
                </div>
                <button
                  onClick={() => setCurrentPage('how-it-works')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all shadow-lg ${
                    currentPage === 'how-it-works'
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  ℹ️ How It Works
                </button>
              </div>
            </div>

            {/* Pages */}
            {currentPage === 'submit' ? (
              <SubmitFeedbackPage />
            ) : currentPage === 'owner' ? (
              <FeedbackPage />
            ) : (
              <HowItWorksPage />
            )}
          </>
        ) : (
          <TasksPage />
        )}
      </ChainGuard>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider chains={chains}>
          <AppContent />
        </RainbowKitProvider>
      </WagmiConfig>
    </QueryClientProvider>
  );
}

export default App;
