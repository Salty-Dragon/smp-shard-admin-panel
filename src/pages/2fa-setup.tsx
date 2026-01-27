/**
 * 2FA Setup Page
 * Allows users to enable email OTP or Google Authenticator
 */

import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';

interface TwoFactorSetupProps {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export default function TwoFactorSetup({ user }: TwoFactorSetupProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [method, setMethod] = useState<'email' | 'totp' | null>(null);
  const [step, setStep] = useState<'select' | 'setup' | 'verify'>('select');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSelectMethod = (selectedMethod: 'email' | 'totp') => {
    setMethod(selectedMethod);
    setStep('setup');
    setError('');
    setSuccess('');

    if (selectedMethod === 'totp') {
      setupTOTP();
    }
  };

  const setupTOTP = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/setup-totp', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setQrCode(data.qrCode);
        setSecret(data.secret);
      } else {
        setError('Failed to setup Google Authenticator');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const requestEmailOTP = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/request-otp', {
        method: 'POST',
      });

      if (response.ok) {
        setSuccess('OTP sent to your email');
        setStep('verify');
      } else {
        setError('Failed to send OTP');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/enable-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, code }),
      });

      if (response.ok) {
        setSuccess('2FA enabled successfully! 🎉');
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.error || 'Invalid code');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>2FA Setup - SMP Admin Panel</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-stone-900 via-green-950 to-stone-900">
        {/* Header */}
        <header className="bg-stone-800 border-b-4 border-stone-700 shadow-lg">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-3xl">⛏️</span>
              <div>
                <h1 className="text-2xl font-bold text-green-400" style={{ 
                  textShadow: '2px 2px 0 rgba(0,0,0,0.8)'
                }}>
                  SMP Admin Panel
                </h1>
                <p className="text-stone-400 text-sm">2FA Setup</p>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="text-green-400 hover:text-green-300 font-semibold"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <div className="bg-stone-800 border-4 border-stone-700 p-8">
              <h2 className="text-3xl font-bold text-green-400 mb-6 text-center">
                🔐 Two-Factor Authentication Setup
              </h2>

              {/* Error/Success Messages */}
              {error && (
                <div className="mb-6 bg-red-900/50 border-2 border-red-700 p-4 text-red-200">
                  ⚠️ {error}
                </div>
              )}

              {success && (
                <div className="mb-6 bg-green-900/50 border-2 border-green-700 p-4 text-green-200">
                  ✓ {success}
                </div>
              )}

              {/* Step 1: Select Method */}
              {step === 'select' && (
                <div className="space-y-6">
                  <p className="text-stone-300 text-center mb-8">
                    Choose your preferred 2FA method to secure your account
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Email OTP */}
                    <button
                      onClick={() => handleSelectMethod('email')}
                      className="bg-stone-900 border-2 border-stone-700 hover:border-green-500 p-6 text-left transition-all"
                    >
                      <div className="text-4xl mb-3">📧</div>
                      <h3 className="text-xl font-bold text-green-400 mb-2">
                        Email OTP
                      </h3>
                      <p className="text-stone-400 text-sm">
                        Receive a one-time password via email each time you log in
                      </p>
                    </button>

                    {/* Google Authenticator */}
                    <button
                      onClick={() => handleSelectMethod('totp')}
                      className="bg-stone-900 border-2 border-stone-700 hover:border-green-500 p-6 text-left transition-all"
                    >
                      <div className="text-4xl mb-3">📱</div>
                      <h3 className="text-xl font-bold text-green-400 mb-2">
                        Google Authenticator
                      </h3>
                      <p className="text-stone-400 text-sm">
                        Use an authenticator app to generate time-based codes
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Setup (TOTP) */}
              {step === 'setup' && method === 'totp' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-green-400 mb-4">
                      Scan QR Code with Google Authenticator
                    </h3>
                    <p className="text-stone-400 mb-6">
                      1. Open Google Authenticator app<br />
                      2. Tap the + button<br />
                      3. Scan this QR code
                    </p>

                    {qrCode ? (
                      <div className="bg-white p-4 inline-block mb-4">
                        <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                      </div>
                    ) : (
                      <div className="bg-stone-900 p-8 mb-4">
                        <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto"></div>
                      </div>
                    )}

                    <div className="bg-stone-900 border-2 border-stone-700 p-4 mb-6">
                      <p className="text-stone-400 text-sm mb-2">Manual Entry Key:</p>
                      <code className="text-green-400 font-mono">{secret}</code>
                    </div>

                    <button
                      onClick={() => setStep('verify')}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 border-b-4 border-green-800"
                    >
                      Continue to Verification →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Setup (Email) */}
              {step === 'setup' && method === 'email' && (
                <div className="space-y-6 text-center">
                  <div className="text-4xl mb-4">📧</div>
                  <h3 className="text-xl font-bold text-green-400 mb-4">
                    Email OTP Setup
                  </h3>
                  <p className="text-stone-400 mb-6">
                    We'll send a verification code to: <br />
                    <span className="text-white font-semibold">{user.email}</span>
                  </p>

                  <button
                    onClick={requestEmailOTP}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-stone-600 text-white font-bold py-3 px-8 border-b-4 border-green-800 disabled:border-stone-800"
                  >
                    {loading ? 'Sending...' : 'Send Verification Code'}
                  </button>
                </div>
              )}

              {/* Step 3: Verify */}
              {step === 'verify' && (
                <form onSubmit={handleVerifyAndEnable} className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-green-400 mb-4">
                      Enter Verification Code
                    </h3>
                    <p className="text-stone-400 mb-6">
                      {method === 'totp'
                        ? 'Enter the 6-digit code from Google Authenticator'
                        : 'Enter the code sent to your email'}
                    </p>

                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full max-w-xs mx-auto bg-stone-900 border-2 border-stone-700 text-white px-4 py-3 text-center text-2xl tracking-widest focus:border-green-500 focus:outline-none"
                      placeholder="000000"
                      maxLength={6}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="flex justify-center space-x-4">
                    <button
                      type="button"
                      onClick={() => {
                        setStep('select');
                        setMethod(null);
                        setCode('');
                      }}
                      className="bg-stone-700 hover:bg-stone-600 text-white font-bold py-3 px-6 border-b-4 border-stone-900"
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading || code.length !== 6}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-stone-600 text-white font-bold py-3 px-8 border-b-4 border-green-800 disabled:border-stone-800"
                    >
                      {loading ? 'Verifying...' : 'Enable 2FA'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session || !session.user) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  // Ensure all user fields are serializable (no undefined values)
  const user = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
  };

  return {
    props: {
      user,
    },
  };
};
