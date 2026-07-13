import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
    FileText,
    BookOpen,
    HelpCircle,
    Activity,
    ChevronRight
} from 'lucide-react'
import moment from 'moment'
import toast from 'react-hot-toast'
import { getStats } from '../../services/dashboardService'

const DashboardPage = () => {
    const [stats, setStats] = useState(null)
    const [activity, setActivity] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await getStats()
                if (res.success) {
                    setStats(res.data.stats)
                    setActivity(res.data.recentActivity)
                } else {
                    toast.error('Failed to load dashboard metrics')
                }
            } catch (err) {
                console.error(err)
                toast.error('Error fetching dashboard statistics')
            } finally {
                setLoading(false)
            }
        }
        fetchDashboardData()
    }, [])

    if (loading) {
        return (
            <div className="flex flex-col gap-6 animate-pulse text-left">
                <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-slate-200/50 dark:bg-slate-800/50 rounded-3xl" />
                    ))}
                </div>
                <div className="h-96 bg-slate-200/50 dark:bg-slate-800/50 rounded-3xl" />
            </div>
        )
    }

    const cards = [
        {
            title: 'TOTAL DOCUMENTS',
            value: stats?.totalDocuments || 0,
            icon: FileText,
            iconColor: 'text-[#00a884]',
            bgIcon: 'bg-[#00a884]/10 border-[#00a884]/20 text-[#00a884]'
        },
        {
            title: 'TOTAL FLASHCARDS',
            value: stats?.totalFlashcards || 0,
            icon: BookOpen,
            iconColor: 'text-sky-500',
            bgIcon: 'bg-sky-500/10 border-sky-500/20 text-sky-500'
        },
        {
            title: 'TOTAL QUIZZES',
            value: stats?.totalQuizzes || 0,
            icon: HelpCircle,
            iconColor: 'text-indigo-500',
            bgIcon: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500'
        }
    ]

    return (
        <div className="flex flex-col gap-8 text-left">
            {/* Header / Title */}
            <div>
                <h1 className="text-3xl font-extrabold text-(--text-main) tracking-tight">
                    Dashboard
                </h1>
                <p className="text-(--text-muted) mt-1 text-sm font-semibold">
                    Track your learning progress and activity
                </p>
            </div>

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {cards.map((card, idx) => {
                    const Icon = card.icon
                    return (
                        <div
                            key={idx}
                            className="bg-(--card-bg) border border-(--border-color) p-6 rounded-3xl flex items-center justify-between shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-[#cbd5e1] group"
                        >
                            <div className="flex flex-col text-left">
                                <span className="text-(--text-light) text-[11px] font-extrabold tracking-wider uppercase">{card.title}</span>
                                <span className="text-4xl font-extrabold text-(--text-main) tracking-tight mt-1 group-hover:text-[#00a884] transition-colors">{card.value}</span>
                            </div>
                            <div className={`p-4 rounded-xl border flex items-center justify-center transition-all duration-300 group-hover:scale-105 ${card.bgIcon}`}>
                                <Icon className="h-5.5 w-5.5" />
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Recent Activity Panel */}
            <div className="bg-(--card-bg) border border-(--border-color) rounded-3xl p-6 flex flex-col gap-6 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#00a884]/10 border border-[#00a884]/20 rounded-xl">
                        <Activity className="h-5 w-5 text-[#00a884]" />
                    </div>
                    <h2 className="text-lg font-extrabold text-(--text-main) tracking-tight">Recent Activity</h2>
                </div>

                {activity.length === 0 ? (
                    <div className="grow flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed border-(--border-color) rounded-3xl bg-(--bg-canvas)">
                        <div className="p-4 bg-[#00a884]/10 border border-[#00a884]/20 rounded-full mb-4">
                            <BookOpen className="h-10 w-10 text-[#00a884]" />
                        </div>
                        <p className="text-(--text-main) font-extrabold text-sm tracking-tight">No recent activities found</p>
                        <p className="text-(--text-light) text-xs mt-1.5 max-w-sm leading-relaxed font-semibold">
                            Upload a PDF study document and generate flashcards or quizzes to see your progress tracked here!
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-1">
                        {activity.map((item) => (
                            <div
                                key={item.id}
                                className="px-2 py-4 border-b border-(--border-color) last:border-0 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-xl transition-all flex items-center justify-between gap-4"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="h-2.5 w-2.5 rounded-full bg-sky-500 shrink-0 shadow-md shadow-sky-500/20" />
                                    <div className="flex flex-col min-w-0 text-left">
                                        <span className="font-bold text-sm text-(--text-muted) leading-relaxed">
                                            {item.type === 'document_upload' ? 'Uploaded Document: ' : 'Completed Quiz: '}
                                            <span className="text-(--text-main) font-extrabold">{item.detail || item.title}</span>
                                        </span>
                                        <span className="text-[10px] font-bold text-(--text-light) mt-0.5">
                                            {moment(item.date).format('DD/MM/YYYY, HH:mm:ss')}
                                        </span>
                                    </div>
                                </div>
                                <Link
                                    to={item.type === 'document_upload' ? `/documents/${item.id}` : `/quizzes/${item.id}/results`}
                                    className="text-xs font-extrabold text-[#00a884] hover:text-[#008f6f] transition-colors shrink-0 flex items-center gap-0.5"
                                >
                                    <span>View</span>
                                    <ChevronRight className="h-3 w-3" />
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default DashboardPage