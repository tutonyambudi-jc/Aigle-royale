'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const isAgentLogin = searchParams?.get('role') === 'agent'
  const isSuperAgentLogin = searchParams?.get('role') === 'super-agent'
  const isLogisticsLogin = searchParams?.get('role') === 'logistics'
  const callbackUrl = searchParams?.get('callbackUrl') || ''

  const safeCallbackUrl = (() => {
    // Only allow relative in-app redirects to avoid open-redirects
    if (!callbackUrl) return ''
    if (!callbackUrl.startsWith('/')) return ''
    if (callbackUrl.startsWith('//')) return ''
    if (callbackUrl.includes('://')) return ''
    return callbackUrl
  })()

  useEffect(() => {
    // Pré-remplir l'email en mode "Agent" (compte démo)
    if (isAgentLogin && !email) {
      setEmail('agent@demo.com')
    }
    if (isSuperAgentLogin && !email) {
      setEmail('superagent@demo.com')
    }
    if (isLogisticsLogin && !email) {
      setEmail('logistics@demo.com')
    }
  }, [isAgentLogin, isSuperAgentLogin, isLogisticsLogin, email])

  const redirectByRole = async () => {
    const session = await getSession()
    const role = session?.user?.role

    if (role === 'AGENT') {
      router.push('/agent')
    } else if (role === 'SUPER_AGENT') {
      router.push('/super-agent')
    } else if (role === 'LOGISTICS') {
      router.push('/logistics')
    } else if (role === 'ADMINISTRATOR' || role === 'SUPERVISOR') {
      router.push('/admin')
    } else if (role === 'AGENCY_STAFF') {
      router.push('/agency')
    } else if (role === 'PARTNER_ADMIN') {
      router.push('/partner')
    } else {
      router.push('/dashboard')
    }
    router.refresh()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Email ou mot de passe incorrect')
        setLoading(false)
        return
      }

      // If user came from a protected page (ex: booking), honor callbackUrl first
      if (safeCallbackUrl) {
        router.push(safeCallbackUrl)
        router.refresh()
        return
      }

      // Si l'utilisateur est sur le mode Agent, on force la redirection sur /agent
      if (isAgentLogin) {
        router.push('/agent')
        router.refresh()
      } else if (isSuperAgentLogin) {
        router.push('/super-agent')
        router.refresh()
      } else if (isLogisticsLogin) {
        router.push('/logistics')
        router.refresh()
      } else {
        await redirectByRole()
      }
    } catch (err) {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoAgentLogin = async () => {
    setError('')
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email: 'agent@demo.com',
        password: 'demo123',
        redirect: false,
      })

      if (result?.error) {
        setError('Impossible de se connecter avec le compte démo')
        return
      }

      router.push('/agent')
      router.refresh()
    } catch (err) {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoSuperAgentLogin = async () => {
    setError('')
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email: 'superagent@demo.com',
        password: 'demo123',
        redirect: false,
      })

      if (result?.error) {
        setError('Impossible de se connecter avec le compte démo')
        return
      }

      router.push('/super-agent')
      router.refresh()
    } catch (err) {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogisticsLogin = async () => {
    setError('')
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email: 'logistics@demo.com',
        password: 'demo123',
        redirect: false,
      })

      if (result?.error) {
        setError('Impossible de se connecter avec le compte démo')
        return
      }

      router.push('/logistics')
      router.refresh()
    } catch (err) {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-md w-full glass rounded-2xl shadow-2xl p-10 border border-white/20 relative z-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-white font-bold text-3xl">AR</span>
          </div>
          {isAgentLogin && (
            <div className="mb-4">
              <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                Espace Agent
              </span>
            </div>
          )}
          {isSuperAgentLogin && (
            <div className="mb-4">
              <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                Espace Super Agent
              </span>
            </div>
          )}
          {isLogisticsLogin && (
            <div className="mb-4">
              <span className="px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                Espace Logistique
              </span>
            </div>
          )}
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
            {isAgentLogin ? 'Connexion Agent' : isSuperAgentLogin ? 'Connexion Super Agent' : isLogisticsLogin ? 'Connexion Logistique' : 'Connexion'}
          </h1>
          <p className="text-gray-600">
            {isAgentLogin
              ? 'Accédez à votre espace de vente'
              : isSuperAgentLogin
                ? 'Vente en agence (entreprise propriétaire)'
                : isLogisticsLogin
                  ? 'Planning chauffeurs (dispatch, rotation, repos)'
                  : 'Connectez-vous à votre compte'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:border-gray-300"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:border-gray-300"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
          >
            <span className="relative z-10">{loading ? 'Connexion...' : 'Se connecter'}</span>
            {!loading && (
              <div className="absolute inset-0 bg-gradient-to-r from-primary-700 to-primary-800 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            )}
          </button>

          {isAgentLogin && (
            <button
              type="button"
              onClick={handleDemoAgentLogin}
              disabled={loading}
              className="w-full bg-green-100 text-green-700 py-4 rounded-xl font-bold text-lg border-2 border-green-200 hover:bg-green-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Connexion démo Agent (1 clic)
            </button>
          )}

          {isSuperAgentLogin && (
            <button
              type="button"
              onClick={handleDemoSuperAgentLogin}
              disabled={loading}
              className="w-full bg-purple-100 text-purple-700 py-4 rounded-xl font-bold text-lg border-2 border-purple-200 hover:bg-purple-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Connexion démo Super Agent (1 clic)
            </button>
          )}

          {isLogisticsLogin && (
            <button
              type="button"
              onClick={handleDemoLogisticsLogin}
              disabled={loading}
              className="w-full bg-orange-100 text-orange-700 py-4 rounded-xl font-bold text-lg border-2 border-orange-200 hover:bg-orange-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Connexion démo Logistique (1 clic)
            </button>
          )}
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Pas encore de compte ?{' '}
            <Link href="/auth/register" className="text-primary-600 hover:underline">
              Inscrivez-vous
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
