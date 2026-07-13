import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard,
    BookOpen,
    User,
    LogOut,
    Menu,
    X,
    Brain,
    Layers,
    Sun,
    Moon
} from 'lucide-react'
import { logout, getCurrentUser } from '../../services/authService'

const AppLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')
    const location = useLocation()
    const activeRoute = location.pathname
    const user = getCurrentUser()
    const reactNavigate = useNavigate()

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark')
            localStorage.setItem('theme', 'dark')
        } else {
            document.documentElement.classList.remove('dark')
            localStorage.setItem('theme', 'light')
        }
    }, [theme])

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark')
    }

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Documents', path: '/documents', icon: BookOpen },
        { name: 'Flashcards', path: '/flashcards', icon: Layers },
        { name: 'Profile', path: '/profile', icon: User }
    ]

    const handleLogout = () => {
        logout()
        reactNavigate('/login')
    }

    return (
        <div className="h-screen overflow-hidden bg-(--bg-canvas) text-(--text-main) flex flex-col md:flex-row transition-colors duration-300">

            {/* Mobile Header */}
            <header className="bg-(--card-bg)/80 backdrop-blur-md border-b border-(--border-color) md:hidden flex justify-between items-center px-4 py-3.5 sticky top-0 z-50 transition-colors duration-300">
                <Link to="/dashboard" className="flex items-center gap-2">
                    <Brain className="h-6 w-6 text-[#00a884]" />
                    <span className="font-extrabold text-lg bg-linear-to-r from-[#00a884] to-emerald-600 bg-clip-text text-transparent">AI Learning Assistant</span>
                </Link>
                <div className="flex items-center gap-3">
                    {/* Mobile Light/Dark Mode Switcher */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-xl border border-(--border-color) bg-(--card-bg) text-(--text-main) hover:bg-[rgba(15,118,110,0.10)] dark:hover:bg-[rgba(15,118,110,0.15)] transition-colors cursor-pointer flex items-center justify-center"
                    >
                        {theme === 'dark' ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5 text-slate-500" />}
                    </button>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                        {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </header>

            {/* Sidebar Navigation */}
            <aside className={`
                fixed inset-y-0 left-0 z-45 w-64 bg-(--card-bg) border-r border-(--border-color) flex flex-col justify-between transform transition-all duration-300 md:translate-x-0 md:h-screen md:sticky md:top-0
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex flex-col gap-8 px-6 py-6">
                    {/* Brand Logo */}
                    <Link to="/dashboard" className="flex items-center gap-3">
                        <div className="p-2.5 bg-[#00a884]/10 border border-[#00a884]/20 rounded-2xl">
                            <Brain className="h-6 w-6 text-[#00a884]" />
                        </div>
                        <span className="font-extrabold text-lg text-(--text-main) tracking-tight">
                            AI Learning Assistant
                        </span>
                    </Link>

                    {/* Navigation Links */}
                    <nav className="flex flex-col gap-1.5">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            const isActive = activeRoute === item.path || (item.path !== '/dashboard' && activeRoute.startsWith(item.path))
                            return (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`
                                        flex items-center gap-3 px-4.5 py-3.5 rounded-xl font-bold transition-all duration-200 group border
                                        ${isActive
                                            ? 'bg-[#00a884] text-white shadow-md shadow-[#00a884]/15 border-[#00a884]/30'
                                            : 'text-(--text-muted) hover:bg-[rgba(15,118,110,0.08)] dark:hover:bg-[rgba(15,118,110,0.12)] hover:text-(--text-main) border-transparent hover:translate-x-0.5'}
                                    `}
                                >
                                    <Icon className={`h-5 w-5 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#00a884]'}`} />
                                    <span>{item.name}</span>
                                </Link>
                            )
                        })}
                    </nav>
                </div>

                {/* Sidebar Footer / Logout */}
                <div className="px-6 py-6 border-t border-(--border-color) flex flex-col gap-4">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-bold text-slate-400 hover:bg-red-50/70 dark:hover:bg-red-500/10 hover:text-red-600 border border-transparent transition-colors duration-200 group cursor-pointer"
                    >
                        <LogOut className="h-5 w-5 text-slate-400 group-hover:text-red-600 transition-transform duration-200 group-hover:translate-x-1" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Desktop Topbar */}
                <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-(--border-color) sticky top-0 z-40 bg-(--card-bg)/85 backdrop-blur-md transition-colors duration-300">
                    <div className="flex items-center gap-4">
                        <div className="relative hidden lg:block">
                            <input className="px-4 py-2.5 rounded-xl bg-(--bg-canvas) border border-(--border-color) text-(--text-main) placeholder-slate-400 w-72 focus:outline-none focus:border-[#00a884] focus:ring-4 focus:ring-[#00a884]/5 transition-all text-xs font-semibold" placeholder="Search documents, cards, quizzes..." />
                        </div>
                    </div>

                    {/* Topbar Right Side Settings & Greeting */}
                    <div className="flex items-center gap-4">
                        {/* Light/Dark Toggle Widget */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-xl border border-(--border-color) bg-(--card-bg) text-(--text-main) hover:bg-[rgba(15,118,110,0.10)] dark:hover:bg-[rgba(15,118,110,0.15)] transition-colors cursor-pointer flex items-center justify-center shadow-xs"
                            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        >
                            {theme === 'dark' ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5 text-slate-500" />}
                        </button>
                        <span className="text-xs font-bold text-(--text-main)">Hello {user?.username || 'User'}</span>
                    </div>
                </header>

                <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <div className="app-container flex-1 flex flex-col min-h-0">
                        {children}
                    </div>
                </main>
            </div>

            {/* Sidebar Backdrop Mobile */}
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs z-30 md:hidden"
                />
            )}
        </div>
    )
}

export default AppLayout