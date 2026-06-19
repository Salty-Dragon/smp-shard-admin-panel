/**
 * Login Page with 2FA Support
 * Themed to match the v1rtopia website (dark glass / green accent).
 */

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { Pickaxe, ShieldCheck, AlertTriangle, Loader2, ArrowLeft } from 'lucide-react';
import packageJson from '../../package.json';

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
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-xl bg-black/40 border border-green-500/20 text-white px-4 py-3 focus:outline-none focus:border-green-500/60 focus:glow-green-sm transition-all';

  return (
    <>
      <Head>
        <title>Login - SMP Admin Panel</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
        {/* Background layers */}
        <div className="absolute inset-0 bg-[#0a0a0a]" />
        <div className="absolute inset-0 grid-bg" />
        <div className="absolute inset-0 vignette" />

        <motion.div
          className="relative z-10 w-full max-w-md"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {/* Login Card */}
          <div className="glass-strong border border-green-500/25 rounded-2xl shadow-2xl glow-green-sm p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10 border border-green-500/30 text-green-400 mb-4">
                <Pickaxe className="h-8 w-8" />
              </span>
              <h1 className="text-3xl font-bold text-green-400 text-glow mb-1">SMP Admin Panel</h1>
              <p className="text-gray-500 text-sm">Server Management System</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-300 text-sm">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {!needs2FA ? (
                <>
                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-green-400 font-medium mb-2 text-sm">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                      required
                      disabled={loading}
                      autoComplete="email"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-green-400 font-medium mb-2 text-sm">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputClass}
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
                    <label htmlFor="twoFactorCode" className="block text-green-400 font-medium mb-2 text-sm">
                      2FA Code
                    </label>
                    <input
                      id="twoFactorCode"
                      type="text"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value)}
                      className={`${inputClass} text-center text-2xl tracking-[0.5em] font-mono`}
                      placeholder="000000"
                      maxLength={6}
                      required
                      disabled={loading}
                      autoFocus
                      autoComplete="one-time-code"
                    />
                    <p className="mt-2 text-gray-500 text-sm">
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
                    className="inline-flex items-center gap-1.5 text-green-400 hover:text-green-300 text-sm"
                    disabled={loading}
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to login
                  </button>
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 hover:bg-green-400 disabled:bg-white/5 disabled:text-gray-500 text-black font-bold py-3.5 px-6 transition-all hover:glow-green-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Logging in…
                  </>
                ) : needs2FA ? (
                  'Verify & Login'
                ) : (
                  'Login'
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-green-500/10 text-center">
              <p className="inline-flex items-center gap-1.5 text-gray-500 text-xs">
                <ShieldCheck className="h-3.5 w-3.5" /> Secured with 2FA Authentication
              </p>
              <p className="text-gray-600 text-xs mt-2 font-mono">v{packageJson.version}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
