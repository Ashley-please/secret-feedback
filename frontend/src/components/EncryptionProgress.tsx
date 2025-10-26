import { useEffect, useState } from 'react';

interface Step {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'complete';
}

interface EncryptionProgressProps {
  isEncrypting: boolean;
  onComplete?: () => void;
}

export function EncryptionProgress({ isEncrypting, onComplete }: EncryptionProgressProps) {
  const [steps, setSteps] = useState<Step[]>([
    { id: '1', label: 'Initializing FHE SDK...', status: 'pending' },
    { id: '2', label: 'Splitting text into chunks...', status: 'pending' },
    { id: '3', label: 'Encrypting data...', status: 'pending' },
    { id: '4', label: 'Preparing for blockchain...', status: 'pending' },
  ]);

  useEffect(() => {
    if (!isEncrypting) {
      setSteps([
        { id: '1', label: 'Initializing FHE SDK...', status: 'pending' },
        { id: '2', label: 'Splitting text into chunks...', status: 'pending' },
        { id: '3', label: 'Encrypting data...', status: 'pending' },
        { id: '4', label: 'Preparing for blockchain...', status: 'pending' },
      ]);
      return;
    }

    // Simulate step progression
    const timings = [0, 500, 1000, 1500];
    
    timings.forEach((delay, index) => {
      setTimeout(() => {
        setSteps(prev => prev.map((step, i) => {
          if (i < index) return { ...step, status: 'complete' };
          if (i === index) return { ...step, status: 'active' };
          return step;
        }));

        if (index === timings.length - 1) {
          setTimeout(() => {
            setSteps(prev => prev.map(step => ({ ...step, status: 'complete' })));
            onComplete?.();
          }, 500);
        }
      }, delay);
    });
  }, [isEncrypting, onComplete]);

  if (!isEncrypting && steps.every(s => s.status === 'pending')) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-yellow-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white">Encrypting Your Feedback</h3>
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center space-x-3">
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                step.status === 'complete' 
                  ? 'bg-green-500' 
                  : step.status === 'active'
                  ? 'bg-yellow-500 animate-pulse'
                  : 'bg-gray-700'
              }`}>
                {step.status === 'complete' ? (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : step.status === 'active' ? (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                ) : (
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                )}
              </div>
              <span className={`text-sm transition-colors ${
                step.status === 'complete'
                  ? 'text-green-400'
                  : step.status === 'active'
                  ? 'text-yellow-400 font-medium'
                  : 'text-gray-500'
              }`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {steps.every(s => s.status === 'complete') && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="flex items-center space-x-2 text-green-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Encryption complete!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface DecryptionProgressProps {
  isDecrypting: boolean;
  onComplete?: () => void;
}

export function DecryptionProgress({ isDecrypting, onComplete }: DecryptionProgressProps) {
  const [steps, setSteps] = useState<Step[]>([
    { id: '1', label: 'Fetching encrypted data...', status: 'pending' },
    { id: '2', label: 'Requesting wallet signature...', status: 'pending' },
    { id: '3', label: 'Sending to Zama relayer...', status: 'pending' },
    { id: '4', label: 'Decrypting content...', status: 'pending' },
  ]);

  useEffect(() => {
    if (!isDecrypting) {
      setSteps([
        { id: '1', label: 'Fetching encrypted data...', status: 'pending' },
        { id: '2', label: 'Requesting wallet signature...', status: 'pending' },
        { id: '3', label: 'Sending to Zama relayer...', status: 'pending' },
        { id: '4', label: 'Decrypting content...', status: 'pending' },
      ]);
      return;
    }

    const timings = [0, 600, 1200, 1800];
    
    timings.forEach((delay, index) => {
      setTimeout(() => {
        setSteps(prev => prev.map((step, i) => {
          if (i < index) return { ...step, status: 'complete' };
          if (i === index) return { ...step, status: 'active' };
          return step;
        }));

        if (index === timings.length - 1) {
          setTimeout(() => {
            setSteps(prev => prev.map(step => ({ ...step, status: 'complete' })));
            onComplete?.();
          }, 500);
        }
      }, delay);
    });
  }, [isDecrypting, onComplete]);

  if (!isDecrypting && steps.every(s => s.status === 'pending')) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white">Decrypting Feedback</h3>
        </div>

        <div className="space-y-3">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center space-x-3">
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                step.status === 'complete' 
                  ? 'bg-green-500' 
                  : step.status === 'active'
                  ? 'bg-blue-500 animate-pulse'
                  : 'bg-gray-700'
              }`}>
                {step.status === 'complete' ? (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : step.status === 'active' ? (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                ) : (
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                )}
              </div>
              <span className={`text-sm transition-colors ${
                step.status === 'complete'
                  ? 'text-green-400'
                  : step.status === 'active'
                  ? 'text-blue-400 font-medium'
                  : 'text-gray-500'
              }`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {steps.every(s => s.status === 'complete') && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="flex items-center space-x-2 text-green-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Decryption complete!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
