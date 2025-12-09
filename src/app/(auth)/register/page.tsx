// src/app/(auth)/register/page.tsx - Pagina Registrazione mobile-first
// Timestamp: 2024-12-09

'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Zap, Check } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Password strength indicators
  const hasMinLength = password.length >= 6;
  const hasNumber = /\d/.test(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Registra utente
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Errore durante la registrazione');
        setIsLoading(false);
        return;
      }

      // Login automatico dopo registrazione
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        router.push('/login');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('Errore durante la registrazione');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex flex-col">
      {/* Header con logo */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-12 pb-6 px-6 text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl shadow-fab mb-3">
          <Zap className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 font-display">
          Crea il tuo account
        </h1>
        <p className="text-gray-600 mt-1 text-sm">
          Inizia a trovare affari incredibili
        </p>
      </motion.div>

      {/* Form Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-1 bg-white rounded-t-3xl shadow-lg px-6 pt-6 pb-safe"
      >
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Il tuo nome"
                className="input pl-12"
                autoComplete="name"
              />
            </div>
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="la-tua@email.it"
                required
                className="input pl-12"
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimo 6 caratteri"
                required
                className="input pl-12 pr-12"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Password Strength */}
            {password && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 space-y-2"
              >
                <div className={`flex items-center gap-2 text-sm ${hasMinLength ? 'text-success' : 'text-gray-400'}`}>
                  <Check className={`w-4 h-4 ${hasMinLength ? '' : 'opacity-30'}`} />
                  Minimo 6 caratteri
                </div>
                <div className={`flex items-center gap-2 text-sm ${hasNumber ? 'text-success' : 'text-gray-400'}`}>
                  <Check className={`w-4 h-4 ${hasNumber ? '' : 'opacity-30'}`} />
                  Almeno un numero (consigliato)
                </div>
              </motion.div>
            )}
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isLoading || !hasMinLength}
            whileTap={{ scale: 0.98 }}
            className="w-full btn-primary btn-lg mt-6 group disabled:opacity-50"
          >
            {isLoading ? (
              <span className="spinner" />
            ) : (
              <>
                Crea Account
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </motion.button>
        </form>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          {[
            { icon: '🔍', text: 'Monitora' },
            { icon: '🔔', text: 'Notifiche' },
            { icon: '💰', text: 'Risparmia' },
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="text-center"
            >
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className="text-xs text-gray-600">{item.text}</div>
            </motion.div>
          ))}
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-gray-500">oppure</span>
          </div>
        </div>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-gray-600">
            Hai già un account?{' '}
            <Link 
              href="/login" 
              className="text-primary font-semibold hover:underline"
            >
              Accedi
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}


