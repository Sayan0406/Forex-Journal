import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, AlertCircle } from 'lucide-react';

export default function Login() {
    const { loginWithGoogle } = useAuth();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleGoogleLogin() {
        try {
            setError('');
            setLoading(true);
            await loginWithGoogle();
            
            // Everyone hits the workspace lobby
            navigate('/workspaces');
        } catch (err) {
            console.error(err);
            setError('Failed to log in with Google. Make sure Firebase is completely configured.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-[color:var(--bg-primary)] flex items-center justify-center p-4">
            <div className="glass-panel w-full max-w-md p-8 text-center flex flex-col items-center">
                <div className="p-4 bg-[color:var(--accent-primary)]/20 rounded-2xl border border-[color:var(--accent-primary)]/30 mb-6">
                    <LayoutDashboard className="text-[color:var(--accent-primary)] w-12 h-12" />
                </div>
                
                <h2 className="text-3xl font-bold bg-gradient-to-r from-[color:var(--text-primary)] to-[color:var(--text-secondary)] bg-clip-text text-transparent mb-2">
                    Forex Journal
                </h2>
                <p className="text-[color:var(--text-secondary)] mb-8">Sign in to access your dashboard.</p>

                {error && (
                    <div className="w-full mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-center gap-3 text-sm text-left">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        {error}
                    </div>
                )}

                <button 
                    disabled={loading}
                    onClick={handleGoogleLogin} 
                    className="w-full btn bg-slate-100 hover:bg-white text-slate-900 border-none justify-center py-3 text-base flex items-center gap-3 transition-transform active:scale-95 disabled:opacity-70 font-semibold shadow-lg"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    {loading ? 'Signing in...' : 'Sign in with Google'}
                </button>
            </div>
        </div>
    );
}
