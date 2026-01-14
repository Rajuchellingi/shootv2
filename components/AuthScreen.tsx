import React, { useState } from 'react';
import { SparklesIcon } from './Icons';

interface AuthScreenProps {
  onLogin: (email: string, pass: string) => Promise<void>;
  onSignUp: (email: string, pass: string) => Promise<void>;
  error?: string | null;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onSignUp, error }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    try {
      if (isLogin) {
        await onLogin(email, password);
      } else {
        await onSignUp(email, password);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020204] text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background visuals */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-purple-600/20 rounded-full blur-[120px] opacity-30 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] pointer-events-none"></div>
      
      <div className="relative z-10 w-full max-w-md bg-[#0a0a0a]/60 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-8 sm:p-10 shadow-2xl shadow-black/80">
        <div className="w-16 h-16 bg-gradient-to-tr from-purple-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center border border-purple-500/30 mb-8 mx-auto shadow-lg shadow-purple-500/10">
          <SparklesIcon className="w-8 h-8 text-purple-400" />
        </div>
        
        <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-gray-400 text-sm">
                {isLogin ? 'Sign in to access your AI studio' : 'Get started with your AI studio'}
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <div className="relative group">
              <input 
                type="email" 
                id="email" 
                placeholder=" "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="peer w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-transparent focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none"
                required
                disabled={isLoading}
              />
              <label htmlFor="email" className="absolute left-4 -top-2.5 text-gray-500 text-xs bg-[#0a0a0a] px-1 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-purple-400 peer-focus:bg-[#0a0a0a] peer-focus:px-1 cursor-text">
                Email address
              </label>
            </div>
            
            <div className="relative group">
              <input 
                type="password" 
                id="password" 
                placeholder=" "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="peer w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-transparent focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none"
                required
                minLength={6}
                disabled={isLoading}
              />
               <label htmlFor="password" className="absolute left-4 -top-2.5 text-gray-500 text-xs bg-[#0a0a0a] px-1 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-purple-400 peer-focus:bg-[#0a0a0a] peer-focus:px-1 cursor-text">
                Password {isLogin ? '' : '(min 6 chars)'}
              </label>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-sm p-3 rounded-lg text-center animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-black font-bold py-3.5 px-4 rounded-xl mt-6 hover:bg-gray-200 transition-all shadow-lg shadow-white/10 transform active:scale-[0.98] duration-100 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
                <>
                    <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing...</span>
                </>
            ) : (
                isLogin ? 'Enter Studio' : 'Sign Up'
            )}
          </button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-sm text-gray-500">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button 
                    onClick={() => { if(!isLoading) { setIsLogin(!isLogin); } }}
                    disabled={isLoading}
                    className={`text-purple-400 hover:text-purple-300 font-medium transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isLogin ? 'Sign Up' : 'Log In'}
                </button>
            </p>
        </div>
      </div>
    </div>
  );
};
