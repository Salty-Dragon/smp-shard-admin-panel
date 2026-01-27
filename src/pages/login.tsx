/**
 * Login Page with 2FA Support
 * Minecraft-themed dark/green/brown design
 */

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [needs2FA, setNeeds2FA] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
        ...(needs2FA && { twoFactorCode }),
      });

      if (result?.error) {
        if (result.error === '2FA code required') {
          setNeeds2FA(true);
          setError('Please enter your 2FA code');
        } else {
          setError(result.error);
        }
      } else if (result?.ok) {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login - SMP Admin Panel</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-900 via-green-950 to-stone-900">
        {/* Minecraft-style background pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(34, 197, 94, 0.1) 2px, rgba(34, 197, 94, 0.1) 4px)',
        }}></div>

        <div className="relative z-10 w-full max-w-md">
          {/* Login Card */}
          <div className="bg-stone-800 border-4 border-stone-700 shadow-2xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">⛏️</div>
              <h1 className="text-3xl font-bold text-green-400 mb-2" style={{ 
                textShadow: '2px 2px 0 rgba(0,0,0,0.8)'
              }}>
                SMP Admin Panel
              </h1>
              <p className="text-stone-400 text-sm">Server Management System</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-900/50 border-2 border-red-700 p-4 text-red-200 text-sm">
                ⚠️ {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {!needs2FA ? (
                <>
                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-green-400 font-semibold mb-2">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-stone-900 border-2 border-stone-700 text-white px-4 py-3 focus:border-green-500 focus:outline-none"
                      required
                      disabled={loading}
                      autoComplete="email"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-green-400 font-semibold mb-2">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-stone-900 border-2 border-stone-700 text-white px-4 py-3 focus:border-green-500 focus:outline-none"
                      required
                      disabled={loading}
                      autoComplete="current-password"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* 2FA Code */}
                  <div>
                    <label htmlFor="twoFactorCode" className="block text-green-400 font-semibold mb-2">
                      2FA Code
                    </label>
                    <input
                      id="twoFactorCode"
                      type="text"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value)}
                      className="w-full bg-stone-900 border-2 border-stone-700 text-white px-4 py-3 text-center text-2xl tracking-widest focus:border-green-500 focus:outline-none"
                      placeholder="000000"
                      maxLength={6}
                      required
                      disabled={loading}
                      autoFocus
                      autoComplete="one-time-code"
                    />
                    <p className="mt-2 text-stone-400 text-sm">
                      Enter the 6-digit code from your authenticator app or email
                    </p>
                  </div>

                  {/* Back Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setNeeds2FA(false);
                      setTwoFactorCode('');
                      setError('');
                    }}
                    className="text-green-400 hover:text-green-300 text-sm"
                    disabled={loading}
                  >
                    ← Back to login
                  </button>
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-stone-600 text-white font-bold py-4 px-6 border-b-4 border-green-800 disabled:border-stone-800 active:border-b-0 active:mt-1 transition-all"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging in...
                  </span>
                ) : needs2FA ? (
                  'Verify & Login'
                ) : (
                  'Login'
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t-2 border-stone-700 text-center">
              <p className="text-stone-500 text-xs">
                🔐 Secured with 2FA Authentication
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-4 text-center text-stone-500 text-sm">
            <p>Default credentials: admin@smp-panel.local / admin123</p>
          </div>
        </div>
      </div>
    </>
  );
}
