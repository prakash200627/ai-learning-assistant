import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Layers, Trash2, Calendar, FileText, Loader, Sparkles, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import moment from 'moment'
import { getAllFlashcardSets, deleteFlashcardSet } from '../../services/flashcardService'

const FlashcardsListPage = () => {
    const navigate = useNavigate()
    const [sets, setSets] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchSets = async () => {
        try {
            const res = await getAllFlashcardSets()
            if (res.success) {
                setSets(res.flashcardSets || [])
            }
        } catch (err) {
            toast.error('Failed to load flashcard sets')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSets()
    }, [])

    const handleDeleteSet = async (e, setId) => {
        e.stopPropagation()
        e.preventDefault()
        if (!window.confirm('Are you sure you want to delete this flashcard set?')) return

        try {
            const res = await deleteFlashcardSet(setId)
            if (res.success) {
                toast.success('Flashcard set deleted successfully')
                setSets(prev => prev.filter(set => set._id !== setId))
            }
        } catch (err) {
            toast.error('Failed to delete flashcard set')
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-(--text-light) gap-3">
                <Loader className="h-10 w-10 text-(--color-primary) animate-spin" />
                <span className="text-sm font-medium animate-pulse text-(--text-muted)">Loading all study sets...</span>
            </div>
        )
    }

    return (
        <div className="w-full max-w-none flex flex-col gap-6 p-4 md:p-6 min-h-[calc(100vh-6rem)]">
            {/* Header section */}
            <div className="flex justify-between items-center border-b border-(--border-color) pb-4">
                <div className="flex flex-col gap-1">
                    <h1 className="font-extrabold text-(--text-main) text-xl md:text-3xl tracking-tight flex items-center gap-2">
                        <Layers className="h-7 w-7 text-(--color-primary)" />
                        <span>All Flashcard Sets</span>
                    </h1>
                    <p className="text-xs md:text-sm text-(--text-muted) font-medium">
                        Access and study all generated flashcard sets from your uploaded documents in one workspace.
                    </p>
                </div>
            </div>

            {/* Grid display */}
            {sets.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-6 border border-dashed border-(--border-color) rounded-3xl bg-(--card-bg) shadow-sm my-auto max-w-xl mx-auto w-full">
                    <Layers className="h-16 w-16 text-(--color-primary)/25 mb-4 animate-pulse" />
                    <h3 className="text-lg font-bold text-(--text-main)">No flashcard sets generated</h3>
                    <p className="text-(--text-muted) text-sm mt-2 leading-relaxed max-w-xs font-medium">
                        Go to your Documents section, select any document, and let Groq AI create interactive flashcards for you instantly!
                    </p>
                    <Link
                        to="/documents"
                        className="mt-6 btn btn-accent font-bold shadow-md hover:scale-[1.01]"
                    >
                        <FileText className="h-4.5 w-4.5 text-white" />
                        <span>View Documents</span>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {sets.map((set) => {
                        const documentTitle = set.documentId?.title || 'Deleted Document'
                        const documentId = set.documentId?._id
                        return (
                            <div
                                key={set._id}
                                className="card interactive-card p-5 bg-(--card-bg) dark:bg-slate-950/70 rounded-2xl flex flex-col justify-between gap-4 shadow-sm border border-transparent dark:border-slate-800"
                            >
                                <div className="flex flex-col gap-2 min-w-0">
                                    <div className="flex justify-between items-start gap-2">
                                        <span className="text-[10px] bg-[rgba(15,118,110,0.08)] dark:bg-emerald-400/10 border border-[rgba(15,118,110,0.18)] dark:border-emerald-400/20 text-(--color-primary) dark:text-emerald-200 font-bold px-2 py-0.5 rounded-full shrink-0">
                                            {set.cards.length} Cards
                                        </span>
                                        <button
                                            onClick={(e) => handleDeleteSet(e, set._id)}
                                            className="p-1.5 text-(--text-light) hover:text-red-600 rounded-lg hover:bg-red-50/70 dark:hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                                            title="Delete Set"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2 mt-1 min-w-0">
                                        <FileText className="h-4 w-4 text-(--text-light) shrink-0" />
                                        <h3 className="font-extrabold text-(--text-main) dark:text-slate-100 text-sm md:text-base truncate" title={documentTitle}>
                                            {documentTitle}
                                        </h3>
                                    </div>

                                    <div className="flex items-center gap-1.5 text-[11px] text-(--text-muted) dark:text-slate-300 font-semibold mt-1">
                                        <Calendar className="h-3.5 w-3.5 text-(--text-light) dark:text-slate-400" />
                                        <span>Generated {moment(set.createdAt).format('ll')}</span>
                                    </div>
                                </div>

                                <div className="border-t border-(--border-color) pt-3 flex justify-end">
                                    {documentId ? (
                                        <button
                                            onClick={() => navigate(`/documents/${documentId}`, {
                                                state: { tab: 'flashcards', activeSet: set }
                                            })}
                                            className="btn btn-accent py-1.5 px-4 text-xs font-bold w-full"
                                        >
                                            <span>Study Now</span>
                                            <ChevronRight className="h-3.5 w-3.5 text-white" />
                                        </button>
                                    ) : (
                                        <button
                                            disabled
                                            className="btn btn-ghost py-1.5 px-4 text-xs font-bold w-full cursor-not-allowed opacity-50"
                                        >
                                            <span>Orphaned Set</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default FlashcardsListPage