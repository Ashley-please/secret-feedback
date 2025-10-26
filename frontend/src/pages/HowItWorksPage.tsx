import { ConnectButton } from '@rainbow-me/rainbowkit';

export function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="font-semibold text-lg">How It Works</span>
          </div>
          <ConnectButton />
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-12 max-w-4xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Anonymous Feedback with Encryption
          </h1>
          <p className="text-xl text-gray-400">
            Collect honest feedback while protecting privacy using blockchain and FHE
          </p>
        </div>

        {/* Simple Explanation */}
        <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
            <span>💡</span>
            <span>The Simple Version</span>
          </h2>
          <div className="space-y-4 text-lg text-gray-300">
            <p>
              <strong className="text-white">For Box Owners:</strong> Create a feedback box, share the ID, and receive encrypted anonymous feedback. Only you can decrypt and read the submissions.
            </p>
            <p>
              <strong className="text-white">For Submitters:</strong> Enter a box ID, write your feedback, and submit. Your identity stays completely anonymous and your message is encrypted before going on-chain.
            </p>
            <p className="text-yellow-400 font-medium">
              Think of it as Google Forms, but truly private and decentralized!
            </p>
          </div>
        </div>

        {/* Step by Step */}
        <div className="space-y-8 mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Step-by-Step Guide</h2>

          {/* Owner Steps */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
              <h3 className="text-2xl font-bold">As a Box Owner</h3>
            </div>

            <div className="space-y-6">
              <div className="flex space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">Create a Feedback Box</h4>
                  <p className="text-gray-400">
                    Click "👤 My Boxes" → "+ New Box". Give it a title, description, and choose settings (ratings, sentiment tags).
                  </p>
                </div>
              </div>

              <div className="flex space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">Share the Box ID</h4>
                  <p className="text-gray-400">
                    Your box gets a unique ID (e.g., <code className="px-2 py-1 bg-gray-800 rounded">0</code>). Click "📋 Copy ID" and share it with your team, customers, or audience.
                  </p>
                </div>
              </div>

              <div className="flex space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">Receive Feedback</h4>
                  <p className="text-gray-400">
                    Watch submissions come in! You'll see ratings and sentiment tags immediately, but the actual feedback text is encrypted.
                  </p>
                </div>
              </div>

              <div className="flex space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">Decrypt & Read</h4>
                  <p className="text-gray-400">
                    Click "🔓 Decrypt feedback" on any submission. Sign with your wallet to decrypt and read the private message.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Submitter Steps */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-2xl font-bold">As a Feedback Submitter</h3>
            </div>

            <div className="space-y-6">
              <div className="flex space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-black font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">Get the Box ID</h4>
                  <p className="text-gray-400">
                    The box owner will share a number with you (e.g., <code className="px-2 py-1 bg-gray-800 rounded">0</code>, <code className="px-2 py-1 bg-gray-800 rounded">1</code>, etc.)
                  </p>
                </div>
              </div>

              <div className="flex space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-black font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">Open Submit Page</h4>
                  <p className="text-gray-400">
                    Click "📝 Submit Feedback" button (bottom right). Enter the box ID and click "Continue".
                  </p>
                </div>
              </div>

              <div className="flex space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-black font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">Write Your Feedback</h4>
                  <p className="text-gray-400">
                    Type your honest thoughts. Optionally add a rating (⭐⭐⭐⭐⭐) and sentiment (😊😐😞).
                  </p>
                </div>
              </div>

              <div className="flex space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-black font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">Submit Anonymously</h4>
                  <p className="text-gray-400">
                    Connect your wallet and click "Submit". Your feedback is encrypted in your browser, then stored on blockchain. Your identity remains anonymous!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Explained */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
            <span>🔐</span>
            <span>What's Private vs Public?</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <h3 className="font-bold text-lg mb-3 text-red-400">🔒 Encrypted (Private)</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start space-x-2">
                  <span className="text-red-400">•</span>
                  <span>Your actual feedback text</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-400">•</span>
                  <span>Detailed comments and suggestions</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-400">•</span>
                  <span>Specific opinions and critiques</span>
                </li>
              </ul>
              <p className="mt-4 text-sm text-gray-400 italic">
                Only the box owner can decrypt and read this!
              </p>
            </div>

            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <h3 className="font-bold text-lg mb-3 text-green-400">📊 Public (Visible to All)</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start space-x-2">
                  <span className="text-green-400">•</span>
                  <span>Star ratings (⭐⭐⭐⭐⭐)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-400">•</span>
                  <span>Sentiment tags (😊😐😞)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-400">•</span>
                  <span>Submission timestamps</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-400">•</span>
                  <span>Number of submissions</span>
                </li>
              </ul>
              <p className="mt-4 text-sm text-gray-400 italic">
                Used for aggregate statistics and trends
              </p>
            </div>
          </div>
        </div>

        {/* Technology */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
            <span>⚙️</span>
            <span>The Technology Behind It</span>
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2 text-yellow-400">🔐 Fully Homomorphic Encryption (FHE)</h3>
              <p className="text-gray-300">
                Your feedback is encrypted using Zama's FHE technology. This means your text is scrambled into unreadable code 
                <strong className="text-white"> before it even leaves your browser</strong>. Not even the blockchain can read it!
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2 text-yellow-400">⛓️ Blockchain Storage</h3>
              <p className="text-gray-300">
                Encrypted feedback is stored on Ethereum Sepolia testnet. This makes it permanent, tamper-proof, and decentralized. 
                No central server can delete or modify submissions.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2 text-yellow-400">🎭 True Anonymity</h3>
              <p className="text-gray-300">
                While you need a wallet to submit (for spam prevention), there's <strong className="text-white">no way to link your wallet address to your feedback content</strong>. 
                The encryption ensures complete anonymity.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2 text-yellow-400">🔓 Owner-Only Decryption</h3>
              <p className="text-gray-300">
                Only the box owner's wallet can request decryption from the Zama relayer. They sign a cryptographic proof with their wallet, 
                and only then can the encrypted text be revealed.
              </p>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Perfect For...</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl mb-2">💼</div>
              <h3 className="font-semibold mb-1">Employee Feedback</h3>
              <p className="text-sm text-gray-400">Anonymous team surveys and HR feedback</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl mb-2">🎯</div>
              <h3 className="font-semibold mb-1">Product Feedback</h3>
              <p className="text-sm text-gray-400">User suggestions and feature requests</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl mb-2">🎉</div>
              <h3 className="font-semibold mb-1">Event Surveys</h3>
              <p className="text-sm text-gray-400">Post-event feedback and ratings</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl mb-2">📚</div>
              <h3 className="font-semibold mb-1">Course Reviews</h3>
              <p className="text-sm text-gray-400">Student feedback on classes</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl mb-2">🚨</div>
              <h3 className="font-semibold mb-1">Anonymous Reporting</h3>
              <p className="text-sm text-gray-400">Whistleblowing and complaints</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl mb-2">🏢</div>
              <h3 className="font-semibold mb-1">Customer Support</h3>
              <p className="text-sm text-gray-400">Service quality feedback</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12 pt-12 border-t border-gray-800">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-gray-400 mb-6">
            Connect your wallet and create your first feedback box in seconds
          </p>
          <ConnectButton />
        </div>
      </div>
    </div>
  );
}
