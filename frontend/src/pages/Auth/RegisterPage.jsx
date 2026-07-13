import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Brain, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { register } from '../../services/authService'

const RegisterPage = () => {
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        if (localStorage.getItem('token')) {
            navigate('/dashboard')
        }
    }, [navigate])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!username || !email || !password) {
            return toast.error('Please enter all fields')
        }
        if (username.length < 3) {
            return toast.error('Username must be at least 3 characters')
        }
        if (password.length < 6) {
            return toast.error('Password must be at least 6 characters')
        }

        setLoading(true)
        try {
            const data = await register(username, email, password)
            if (data.success) {
                toast.success('Successfully registered!')
                navigate('/dashboard')
            } else {
                toast.error(data.error || 'Registration failed')
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(37,99,235,0.10),transparent_24%)]">
            {/* Background Dotted Grid styling comes from index.css base body rules */}

            {/* Elegant Centered Card */}
            <div className="max-w-md w-full surface-soft p-10 rounded-[28px] shadow-premium-hover relative z-10">

                {/* Header Section */}
                <div className="flex flex-col items-center gap-3 mb-8">
                    <div className="p-3 bg-[#00a884]/10 border border-[#00a884]/20 rounded-2xl shadow-sm">
                        <Brain className="h-10 w-10 text-[#00a884] font-bold" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-[#0f172a] tracking-tight">
                        Create Account
                    </h2>
                    <p className="text-(--text-muted) text-xs font-bold uppercase tracking-widest mt-0.5">
                        START SMART STUDYING FREE
                    </p>
                </div>

                {/* Register Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">

                    {/* Username Input Group */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-extrabold text-(--text-muted) tracking-wider uppercase px-1">
                            Username
                        </label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-(--text-light)" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="bhanu"
                                className="w-full pl-12 pr-4 py-3.5 bg-(--card-bg-solid) border border-(--border-color) focus:border-(--color-primary) focus:ring-4 focus:ring-(--color-primary)/12 rounded-xl outline-none text-(--text-main) placeholder:text-(--text-light) text-sm transition-all"
                                required
                            />
                        </div>
                    </div>

                    {/* Email Input Group */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-extrabold text-(--text-muted) tracking-wider uppercase px-1">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-(--text-light)" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="w-full pl-12 pr-4 py-3.5 bg-(--card-bg-solid) border border-(--border-color) focus:border-(--color-primary) focus:ring-4 focus:ring-(--color-primary)/12 rounded-xl outline-none text-(--text-main) placeholder:text-(--text-light) text-sm transition-all"
                                required
                            />
                        </div>
                    </div>

                    {/* Password Input Group */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-extrabold text-(--text-muted) tracking-wider uppercase px-1">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-(--text-light)" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                autoComplete="new-password"
                                className="w-full pl-12 pr-4 py-3.5 bg-(--card-bg-solid) border border-(--border-color) focus:border-(--color-primary) focus:ring-4 focus:ring-(--color-primary)/12 rounded-xl outline-none text-(--text-main) placeholder:text-(--text-light) text-sm transition-all"
                                required
                            />
                        </div>
                    </div>

                    {/* Primary Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-accent w-full mt-2 py-4 rounded-xl font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span>{loading ? 'Creating...' : 'Sign Up'}</span>
                        {!loading && <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
                    </button>
                </form>

                {/* Footer Sign In Link */}
                <p className="mt-8 text-center text-sm text-(--text-muted) font-semibold">
                    Already have an account?{' '}
                    <Link to="/login" className="text-(--color-primary) hover:text-(--color-primary-hover) font-extrabold underline underline-offset-4">
                        Sign in instead
                    </Link>
                </p>
            </div>

            {/* Dotted Grid Branding Footnote */}
            <div className="mt-6 text-xs text-(--text-light) font-medium z-10 flex items-center gap-1.5">
                <span>AI-Powered Learning Assistant App</span>
                <span className="text-(--color-primary)">•</span>
                <span>Powered by Groq AI</span>
            </div>
        </div>
    )
}

export default RegisterPage