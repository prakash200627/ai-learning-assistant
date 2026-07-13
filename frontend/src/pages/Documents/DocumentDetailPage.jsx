import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import {
    FileText,
    MessageSquare,
    Sparkles,
    Layers,
    HelpCircle,
    ArrowLeft,
    Send,
    Trash2,
    Star,
    ChevronLeft,
    ChevronRight,
    Copy,
    Brain,
    Loader,
    Check,
    Plus,
    X,
    ExternalLink,
    BookOpen
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import toast from 'react-hot-toast'
import moment from 'moment'

import { getDocument } from '../../services/documentService'
import { sendChatMessage, getChatHistory, clearChatHistory } from '../../services/aiService'
import {
    generateFlashcards,
    getFlashcards,
    toggleStarFlashcard,
    deleteFlashcard,
    deleteFlashcardSet
} from '../../services/flashcardService'
import { generateQuiz, getQuizzes, deleteQuiz } from '../../services/quizService'
import { BACKEND_URL } from '../../constants/api'

const DocumentDetailPage = () => {
    const { id: documentId } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const [document, setDocument] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState(location.state?.tab || 'content') // content | chat | actions | flashcards | quizzes

    // AI Chat States
    const [chatLogs, setChatLogs] = useState([])
    const [chatInput, setChatInput] = useState('')
    const [chatLoading, setChatLoading] = useState(false)
    const messagesEndRef = useRef(null)

    // AI Actions States
    const [actionSubTab, setActionSubTab] = useState('summary') // summary | explain
    const [explainInput, setExplainInput] = useState('')
    const [explainConceptTitle, setExplainConceptTitle] = useState('')
    const [explainConceptContent, setExplainConceptContent] = useState('')
    const [explainLoading, setExplainLoading] = useState(false)
    const [showExplainModal, setShowExplainModal] = useState(false)
    const [copied, setCopied] = useState(false)

    // Flashcard States
    const [flashcardSets, setFlashcardSets] = useState([])
    const [cardsLoading, setCardsLoading] = useState(false)
    const [activeSet, setActiveSet] = useState(location.state?.activeSet || null) // selected set for deck study
    const [currentCardIndex, setCurrentCardIndex] = useState(0)
    const [isFlipped, setIsFlipped] = useState(false)
    const [starredOnly, setStarredOnly] = useState(false)

    // Quiz States
    const [quizzes, setQuizzes] = useState([])
    const [quizLoading, setQuizLoading] = useState(false)
    const [quizCount, setQuizCount] = useState(5)
    const [quizFormTitle, setQuizFormTitle] = useState('')
    const [showQuizGenerator, setShowQuizGenerator] = useState(false)

    useEffect(() => {
        const fetchDocDetails = async () => {
            try {
                const res = await getDocument(documentId)
                if (res.success) {
                    setDocument(res.document)
                    fetchChatRecord()
                    fetchCardsRecord()
                    fetchQuizzesRecord()
                } else {
                    toast.error('Document not found')
                    navigate('/documents')
                }
            } catch (err) {
                toast.error('Failed to load document details')
                navigate('/documents')
            } finally {
                setLoading(false)
            }
        }
        fetchDocDetails()
    }, [documentId])

    // Auto scroll chat to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        if (activeTab === 'chat') {
            scrollToBottom()
        }
    }, [chatLogs, activeTab])

    // --- AI Chat Actions ---
    const fetchChatRecord = async () => {
        try {
            const res = await getChatHistory(documentId)
            if (res.success) {
                setChatLogs(res.chatLogs || [])
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleSendChat = async (e, customText = '') => {
        if (e) e.preventDefault()
        const text = customText || chatInput
        if (!text.trim() || chatLoading) return

        if (!customText) setChatInput('')
        setChatLoading(true)

        // Optimistically add user message
        const optimisticMsg = { role: 'user', content: text, timestamp: new Date() }
        setChatLogs(prev => [...prev, optimisticMsg])

        try {
            const res = await sendChatMessage(documentId, text)
            if (res.success) {
                setChatLogs(prev => [
                    ...prev.slice(0, -1),
                    optimisticMsg,
                    { role: 'assistant', content: res.reply, timestamp: new Date() }
                ])
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to chat with AI')
            setChatLogs(prev => prev.slice(0, -1)) // Remove optimistic message on error
        } finally {
            setChatLoading(false)
        }
    }

    const handleClearChat = async () => {
        if (!window.confirm('Clear all conversation history?')) return
        try {
            const res = await clearChatHistory(documentId)
            if (res.success) {
                setChatLogs([])
                toast.success('Chat history cleared')
            }
        } catch (err) {
            toast.error('Failed to clear chat')
        }
    }

    // --- Concept Explainer call ---
    const handleExplainConceptSubmit = async (e) => {
        e.preventDefault()
        if (!explainInput.trim() || explainLoading) return

        setExplainConceptTitle(explainInput.trim())
        setExplainLoading(true)
        setShowExplainModal(true)
        const prompt = `Can you explain the concept: "${explainInput.trim()}" based on the uploaded document? Use friendly formatting, clear explanations, and bullet points where applicable.`

        try {
            const res = await sendChatMessage(documentId, prompt)
            if (res.success) {
                setExplainConceptContent(res.reply)
                setExplainInput('')
                // Fetch the updated chat logs too since this creates an entry
                fetchChatRecord()
            }
        } catch (err) {
            toast.error('Failed to explain concept')
            setShowExplainModal(false)
        } finally {
            setExplainLoading(false)
        }
    }

    // --- Copy Summary/Explain Text ---
    const handleCopy = (text) => {
        if (!text) return
        navigator.clipboard.writeText(text)
        setCopied(true)
        toast.success('Copied text to clipboard')
        setTimeout(() => setCopied(false), 2000)
    }

    // --- Flashcards Actions ---
    const fetchCardsRecord = async () => {
        try {
            const res = await getFlashcards(documentId)
            if (res.success && res.flashcardSets) {
                setFlashcardSets(res.flashcardSets)
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleGenerateCards = async () => {
        setCardsLoading(true)
        try {
            const res = await generateFlashcards(documentId)
            if (res.success && res.flashcardSet) {
                toast.success('Flashcards generated successfully!')
                await fetchCardsRecord() // Reload sets
                setActiveSet(res.flashcardSet) // Automatically enter study mode for the newly generated set
                setCurrentCardIndex(0)
                setIsFlipped(false)
            }
        } catch (err) {
            toast.error('Failed to generate flashcards')
        } finally {
            setCardsLoading(false)
        }
    }

    const handleToggleStar = async (cardId) => {
        try {
            const res = await toggleStarFlashcard(cardId)
            if (res.success) {
                // Update in activeSet
                if (activeSet) {
                    setActiveSet(prev => {
                        const updatedCards = prev.cards.map(c => c._id === cardId ? { ...c, isStarred: res.card.isStarred } : c)
                        return { ...prev, cards: updatedCards }
                    })
                }
                // Update in flashcardSets
                setFlashcardSets(prev => prev.map(set => {
                    const hasCard = set.cards.some(c => c._id === cardId)
                    if (hasCard) {
                        return {
                            ...set,
                            cards: set.cards.map(c => c._id === cardId ? { ...c, isStarred: res.card.isStarred } : c)
                        }
                    }
                    return set
                }))
            }
        } catch (err) {
            toast.error('Failed to toggle star')
        }
    }

    const handleDeleteCard = async (cardId) => {
        if (!window.confirm('Are you sure you want to delete this card?')) return
        try {
            const res = await deleteFlashcard(cardId)
            if (res.success) {
                toast.success('Flashcard deleted')
                // Update activeSet
                if (activeSet) {
                    const filteredCards = activeSet.cards.filter(c => c._id !== cardId)
                    setActiveSet(prev => ({ ...prev, cards: filteredCards }))
                    if (currentCardIndex >= filteredCards.length - 1 && currentCardIndex > 0) {
                        setCurrentCardIndex(prev => prev - 1)
                    }
                    setIsFlipped(false)
                }
                fetchCardsRecord()
            }
        } catch (err) {
            toast.error('Failed to delete card')
        }
    }

    const handleDeleteSet = async (setId) => {
        if (!window.confirm('Are you sure you want to delete this entire flashcard set?')) return
        try {
            const res = await deleteFlashcardSet(setId)
            if (res.success) {
                toast.success('Flashcard set deleted successfully')
                if (activeSet && activeSet._id === setId) {
                    setActiveSet(null)
                }
                fetchCardsRecord()
            }
        } catch (err) {
            toast.error('Failed to delete flashcard set')
        }
    }

    // --- Quiz Actions ---
    const fetchQuizzesRecord = async () => {
        try {
            const res = await getQuizzes(documentId)
            if (res.success) {
                setQuizzes(res.quizzes || [])
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleCreateQuiz = async (e) => {
        e.preventDefault()
        setQuizLoading(true)
        setShowQuizGenerator(false)

        try {
            const res = await generateQuiz(documentId, quizCount, quizFormTitle.trim())
            if (res.success) {
                toast.success('Quiz generated successfully!')
                setQuizFormTitle('')
                fetchQuizzesRecord()
            }
        } catch (err) {
            toast.error('Failed to generate quiz')
        } finally {
            setQuizLoading(false)
        }
    }

    const handleDeleteQuiz = async (quizId) => {
        if (!window.confirm('Are you sure you want to delete this quiz?')) return
        try {
            const res = await deleteQuiz(quizId)
            if (res.success) {
                toast.success('Quiz deleted')
                fetchQuizzesRecord()
            }
        } catch (err) {
            toast.error('Failed to delete quiz')
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-(--text-light) gap-3">
                <Loader className="h-10 w-10 text-(--color-primary) animate-spin" />
                <span className="text-sm font-medium animate-pulse text-(--text-muted)">Assembling study workspace...</span>
            </div>
        )
    }

    // Backend base address for PDF matching
    const pdfUrl = `${BACKEND_URL}${document.filePath}`

    return (
        <div className="max-w-6xl w-full mx-auto flex flex-col gap-4 p-4 md:p-6 flex-1 min-h-0 overflow-hidden">
            {/* Top Navigation / Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-(--border-color) pb-4">
                <div className="flex items-center gap-3.5 min-w-0">
                    <Link
                        to="/documents"
                        className="p-2.5 border border-(--border-color) hover:border-(--color-primary)/30 bg-(--card-bg-solid) rounded-2xl text-(--text-muted) hover:text-(--text-main) transition-colors shrink-0 shadow-xs"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div className="flex flex-col min-w-0">
                        <h1 className="font-extrabold text-(--text-main) truncate text-xl md:text-2xl tracking-tight">
                            {document.title}
                        </h1>
                        <span className="text-xs text-(--text-muted) truncate" title={document.fileName}>{document.fileName}</span>
                    </div>
                </div>

                {/* 5 Tabs Switcher */}
                <div className="flex bg-(--card-bg-solid)/80 border border-(--border-color) p-1.5 rounded-2xl gap-1 shrink-0 overflow-x-auto shadow-xs">
                    {[
                        { id: 'content', label: 'Content', icon: FileText },
                        { id: 'chat', label: 'AI Chat', icon: MessageSquare },
                        { id: 'actions', label: 'AI Actions', icon: Sparkles },
                        { id: 'flashcards', label: 'Flashcards', icon: Layers },
                        { id: 'quizzes', label: 'Quizzes', icon: HelpCircle }
                    ].map(tab => {
                        const Icon = tab.icon
                        const isSelected = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-2 py-2 px-4 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer whitespace-nowrap
                                    ${isSelected
                                        ? 'bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] text-white shadow-sm'
                                        : 'text-(--text-muted) hover:text-(--text-main) hover:bg-[rgba(15,118,110,0.08)]'}
                                `}
                            >
                                <Icon className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-(--text-light)'}`} />
                                <span>{tab.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Tab Contents Panel - Clean White Card */}
            <div className="flex-1 card surface-soft min-h-0 flex flex-col rounded-[28px] overflow-hidden shadow-premium-hover">

                {/* TAB 1: PDF Content */}
                {activeTab === 'content' && (
                    <div className="flex-1 min-h-0 flex flex-col rounded-2xl overflow-hidden relative border border-(--border-color) bg-(--bg-canvas) shadow-inner">
                        <iframe
                            src={`${pdfUrl}#toolbar=0&zoom=page-fit`}
                            title={document.title}
                            className="w-full h-full border-none"
                        />
                    </div>
                )}

                {/* TAB 2: AI Chat */}
                {activeTab === 'chat' && (
                    <div className="flex-1 flex flex-col min-h-0 justify-between">
                        {/* Chat Header */}
                        <div className="px-5 py-3.5 border-b border-(--border-color) bg-[rgba(15,118,110,0.04)] flex justify-between items-center text-xs text-(--text-muted) font-bold uppercase tracking-wider rounded-t-[20px]">
                            <span>AI Chat History</span>
                            {chatLogs.length > 0 && (
                                <button
                                    onClick={handleClearChat}
                                    className="text-red-500 hover:text-red-600 transition-colors font-bold cursor-pointer"
                                >
                                    Clear Chat
                                </button>
                            )}
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 max-h-[55vh] scrollbar-thin">
                            {chatLogs.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 my-auto">
                                    <Brain className="h-14 w-14 text-(--color-primary)/25 mb-3 animate-bounce" />
                                    <p className="font-bold text-(--text-main) text-base">Ask your AI Study Assistant</p>
                                    <p className="text-(--text-muted) text-xs max-w-sm mt-1.5 leading-relaxed">
                                        Ask specific questions about formulas, theories, historical dates, or vocabulary. The AI will read the document sections and explain it instantly!
                                    </p>
                                </div>
                            ) : (
                                chatLogs.map((msg, index) => (
                                    <div
                                        key={index}
                                        className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'
                                            }`}
                                    >
                                        <div className={`p-4 rounded-[20px] text-sm leading-relaxed shadow-2xs ${msg.role === 'user'
                                            ? 'bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] text-white rounded-tr-none font-semibold'
                                            : 'bg-(--card-bg-solid) text-(--text-main) border border-(--border-color) rounded-tl-none font-medium'
                                            }`}>
                                            {msg.role === 'user' ? (
                                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                            ) : (
                                                <div className="prose prose-slate max-w-none text-(--text-main) prose-sm text-left leading-relaxed">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-(--text-light) mt-1 px-1 font-semibold">
                                            {moment(msg.timestamp).format('LT')}
                                        </span>
                                    </div>
                                ))
                            )}

                            {chatLoading && (
                                <div className="self-start flex flex-col max-w-[85%] items-start">
                                    <div className="p-4 bg-(--card-bg-solid) border border-(--border-color) rounded-[20px] rounded-tl-none text-(--text-muted) text-sm flex items-center gap-2.5">
                                        <Loader className="h-4 w-4 text-(--color-primary) animate-spin" />
                                        <span className="font-semibold text-xs">Assistant is reading relevant document chunks...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Chat Suggestions & Form */}
                        <div className="p-4 bg-[rgba(15,118,110,0.04)] border-t border-(--border-color) rounded-b-[20px] flex flex-col gap-3">
                            {chatLogs.length === 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        'What is the core topic of this document?',
                                        'Summarize the main three takeaways',
                                        'Create a few sample study questions'
                                    ].map((text, i) => (
                                        <button
                                            key={i}
                                            onClick={(e) => handleSendChat(e, text)}
                                            className="text-xs font-extrabold text-(--color-primary) bg-[rgba(15,118,110,0.08)] border border-[rgba(15,118,110,0.18)] hover:border-(--color-primary)/40 px-3.5 py-2 rounded-full transition-colors cursor-pointer shadow-2xs hover:scale-[1.01]"
                                        >
                                            {text}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <form onSubmit={handleSendChat} className="flex gap-2">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Ask any question about this document..."
                                    disabled={chatLoading}
                                    className="flex-1 px-4 py-3 bg-(--card-bg-solid) border border-(--border-color) focus:border-(--color-primary) rounded-xl outline-none text-(--text-main) placeholder:text-(--text-light) text-sm transition-all disabled:opacity-50"
                                />
                                <button
                                    type="submit"
                                    disabled={chatLoading || !chatInput.trim()}
                                    className="p-3 bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] hover:opacity-95 disabled:bg-(--border-color) disabled:text-(--text-light) text-white rounded-xl shadow-md transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed"
                                >
                                    <Send className="h-5 w-5" />
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* TAB 3: AI Actions */}
                {activeTab === 'actions' && (
                    <div className="flex-1 flex flex-col min-h-0">
                        {/* Subtabs Navigation */}
                        <div className="flex border-b border-(--border-color) bg-[rgba(15,118,110,0.04)] px-4 rounded-t-[20px] shrink-0">
                            <button
                                onClick={() => setActionSubTab('summary')}
                                className={`py-4 px-5 text-sm font-bold border-b-2 transition-all cursor-pointer ${actionSubTab === 'summary'
                                    ? 'border-(--color-primary) text-(--color-primary)'
                                    : 'border-transparent text-(--text-muted) hover:text-(--text-main)'
                                    }`}
                            >
                                Document Summary
                            </button>
                            <button
                                onClick={() => setActionSubTab('explain')}
                                className={`py-4 px-5 text-sm font-bold border-b-2 transition-all cursor-pointer ${actionSubTab === 'explain'
                                    ? 'border-(--color-primary) text-(--color-primary)'
                                    : 'border-transparent text-(--text-muted) hover:text-(--text-main)'
                                    }`}
                            >
                                Concept Explainer
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 p-6 flex flex-col gap-5">
                            {actionSubTab === 'summary' ? (
                                <div className="flex-1 flex flex-col gap-4">
                                    <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-3 rounded-2xl shrink-0 shadow-2xs">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-1">
                                            AI AUTO-GENERATED SUMMARY
                                        </span>
                                        <button
                                            onClick={() => handleCopy(document.summary)}
                                            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-teal-600 transition-colors cursor-pointer font-bold"
                                        >
                                            {copied ? <Check className="h-4 w-4 text-teal-600" /> : <Copy className="h-4 w-4" />}
                                            <span>{copied ? 'Copied' : 'Copy Summary'}</span>
                                        </button>
                                    </div>
                                    <div className="flex-1 bg-white border border-slate-150 p-6 rounded-2xl overflow-y-auto max-h-[50vh]">
                                        <div className="prose prose-slate max-w-none text-slate-700 prose-sm text-left leading-relaxed">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {document.summary || 'Summary is unavailable for this document.'}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col gap-5">
                                    {/* Explainer Search input */}
                                    <form onSubmit={handleExplainConceptSubmit} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row gap-3">
                                        <div className="flex-1">
                                            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5 px-0.5">Explain a Topic / Keyword</label>
                                            <input
                                                type="text"
                                                value={explainInput}
                                                onChange={(e) => setExplainInput(e.target.value)}
                                                placeholder="e.g. Mitochondria, Photosynthesis, Neural Networks..."
                                                className="w-full px-3.5 py-2 bg-white border border-slate-200 focus:border-teal-500 rounded-xl outline-none text-slate-800 text-sm transition-all"
                                                required
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={explainLoading || !explainInput.trim()}
                                            className="btn btn-primary self-end sm:self-center py-2.5 h-fit px-5 font-bold cursor-pointer"
                                        >
                                            {explainLoading ? <Loader className="h-4 w-4 animate-spin text-white" /> : <Brain className="h-4 w-4 text-white" />}
                                            <span>Explain Topic</span>
                                        </button>
                                    </form>

                                    {/* Display Box */}
                                    <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-3 rounded-2xl shrink-0 shadow-2xs">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-1">
                                            {explainConceptTitle ? `EXPLAINING: ${explainConceptTitle.toUpperCase()}` : 'CONCEPT EXPLANATION'}
                                        </span>
                                        {explainConceptContent && (
                                            <button
                                                onClick={() => handleCopy(explainConceptContent)}
                                                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-teal-600 transition-colors cursor-pointer font-bold"
                                            >
                                                {copied ? <Check className="h-4 w-4 text-teal-600" /> : <Copy className="h-4 w-4" />}
                                                <span>{copied ? 'Copied' : 'Copy Explanation'}</span>
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex-1 bg-white border border-slate-150 p-6 rounded-2xl overflow-y-auto max-h-[40vh]">
                                        {explainLoading ? (
                                            <div className="flex flex-col items-center justify-center py-10 gap-3">
                                                <Loader className="h-8 w-8 text-teal-600 animate-spin" />
                                                <span className="text-xs text-slate-500 font-bold animate-pulse">Groq is researching "{explainConceptTitle}" inside this document...</span>
                                            </div>
                                        ) : explainConceptContent ? (
                                            <div className="prose prose-slate max-w-none text-slate-700 prose-sm text-left leading-relaxed">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {explainConceptContent}
                                                </ReactMarkdown>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                                <BookOpen className="h-12 w-12 text-teal-205 mb-2" />
                                                <p className="font-bold text-slate-400 text-sm">No concept queried yet</p>
                                                <p className="text-slate-400 text-xs max-w-xs mt-1">
                                                    Enter any term above to get a clear, structured explanation grounded directly in this document's text context.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 4: Flashcards */}
                {activeTab === 'flashcards' && (
                    <div className="flex-1 flex flex-col min-h-0 p-6">
                        {cardsLoading ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 my-auto">
                                <Loader className="h-10 w-10 text-teal-600 animate-spin" />
                                <span className="text-sm font-semibold animate-pulse text-slate-550">Groq AI is analyzing and generating custom study flashcards...</span>
                            </div>
                        ) : activeSet === null ? (
                            /* Mode A: List of Flashcard Sets */
                            <div className="flex-1 flex flex-col gap-5">
                                <div className="flex justify-between items-center">
                                    <h2 className="font-bold text-slate-800 text-base md:text-lg">AI Flashcard Sets ({flashcardSets.length})</h2>
                                    <button
                                        onClick={handleGenerateCards}
                                        className="btn btn-primary py-2 px-4 text-xs font-bold"
                                        disabled={cardsLoading}
                                    >
                                        <Sparkles className="h-4 w-4 text-white" />
                                        <span>Generate New Set</span>
                                    </button>
                                </div>

                                {flashcardSets.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-6 border border-dashed border-slate-200 rounded-3xl bg-slate-50/50 my-auto">
                                        <Layers className="h-14 w-14 text-teal-200 mb-4 animate-pulse" />
                                        <h3 className="text-lg font-bold text-slate-850">Generate AI Flashcards</h3>
                                        <p className="text-slate-450 text-xs max-w-sm mt-2 leading-relaxed font-medium">
                                            Let Groq scan your PDF and automatically outline beautiful study card pairs featuring core concepts, definitions, and questions!
                                        </p>
                                        <button
                                            onClick={handleGenerateCards}
                                            className="mt-6 btn btn-primary font-bold shadow-lg"
                                        >
                                            <Sparkles className="h-4 w-4 text-white animate-spin" />
                                            <span>Generate Cards with AI</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-1">
                                        {flashcardSets.map((set, idx) => (
                                            <div
                                                key={set._id}
                                                className="card interactive-card p-5 border border-slate-200 bg-white rounded-2xl flex flex-col justify-between gap-4 shadow-2xs hover:shadow-sm"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2.5 rounded-xl bg-teal-50 text-teal-650 font-bold">
                                                            <Layers className="h-5 w-5" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-800 text-sm md:text-base">
                                                                Flashcard Set #{flashcardSets.length - idx}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-extrabold mt-0.5">
                                                                Generated {moment(set.createdAt).fromNow()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDeleteSet(set._id)
                                                        }}
                                                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all cursor-pointer"
                                                        title="Delete Set"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                                <div className="flex justify-between items-center mt-2 border-t border-slate-100 pt-3">
                                                    <span className="text-xs font-extrabold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                                                        {set.cards.length} cards
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            setActiveSet(set)
                                                            setCurrentCardIndex(0)
                                                            setIsFlipped(false)
                                                        }}
                                                        className="btn btn-primary py-1.5 px-4 text-xs"
                                                    >
                                                        <span>Study Set</span>
                                                        <ChevronRight className="h-3.5 w-3.5 text-white" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Mode B: Study Mode */
                            <div className="flex-1 flex flex-col gap-5 min-h-105">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                                    <button
                                        onClick={() => setActiveSet(null)}
                                        className="flex items-center gap-1 text-xs font-extrabold text-slate-500 hover:text-slate-850 transition-colors cursor-pointer"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        <span>Back to all sets</span>
                                    </button>

                                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                                        <button
                                            onClick={() => {
                                                setStarredOnly(!starredOnly)
                                                setCurrentCardIndex(0)
                                                setIsFlipped(false)
                                            }}
                                            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${starredOnly
                                                ? 'bg-amber-50 border-amber-200 text-amber-600 shadow-2xs'
                                                : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
                                                }`}
                                        >
                                            <Star className={`h-4 w-4 ${starredOnly ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
                                            <span>Starred Only ({activeSet.cards.filter(c => c.isStarred).length})</span>
                                        </button>
                                        <button
                                            onClick={handleGenerateCards}
                                            className="text-xs font-bold text-teal-650 hover:text-teal-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                                        >
                                            <Sparkles className="h-4 w-4 animate-pulse" />
                                            <span>Create New Set</span>
                                        </button>
                                    </div>
                                </div>

                                {(() => {
                                    const displayedCards = starredOnly
                                        ? activeSet.cards.filter(c => c.isStarred)
                                        : activeSet.cards

                                    if (displayedCards.length === 0) {
                                        return (
                                            <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 border border-dashed border-slate-200 rounded-3xl text-center bg-slate-50/50 my-auto">
                                                <Star className="h-12 w-12 text-slate-350 mb-2 animate-pulse" />
                                                <p className="font-bold text-slate-700 text-sm">No starred cards in this set</p>
                                                <p className="text-slate-400 text-xs max-w-xs mt-1.5 font-medium">
                                                    Mark important cards with a star during review to isolate them here for targeted studies!
                                                </p>
                                            </div>
                                        )
                                    }

                                    const currentCard = displayedCards[currentCardIndex]

                                    return (
                                        <div className="flex-1 flex flex-col gap-6 min-h-87.5 justify-between">
                                            {/* 3D Flip Card Container */}
                                            <div
                                                onClick={() => setIsFlipped(!isFlipped)}
                                                className="flex-1 min-h-60 max-h-85 relative cursor-pointer group"
                                                style={{ perspective: '1000px' }}
                                            >
                                                <div
                                                    className="w-full h-full relative rounded-3xl border transition-all duration-500 shadow-md bg-(--card-bg-solid)"
                                                    style={{
                                                        transformStyle: 'preserve-3d',
                                                        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                                                        borderColor: isFlipped ? '#10b981' : '#3b82f6'
                                                    }}
                                                >
                                                    {/* Front Side - Question */}
                                                    <div
                                                        className="absolute inset-0 w-full h-full p-8 rounded-3xl bg-linear-to-br from-sky-50 via-white to-indigo-100/70 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex flex-col justify-between items-center text-center backface-hidden overflow-hidden"
                                                        style={{ backfaceVisibility: 'hidden' }}
                                                    >
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 dark:bg-sky-400/10 blur-3xl rounded-full pointer-events-none" />
                                                        <div className="flex justify-between items-center w-full text-sky-600 dark:text-sky-300 text-[10px] font-extrabold tracking-widest shrink-0 z-10">
                                                            <span>QUESTION CARD</span>
                                                            <span className="px-3 py-1 border border-sky-200 bg-white/85 dark:bg-slate-950/70 dark:border-sky-400/30 rounded-full font-extrabold text-sky-600 dark:text-sky-200">
                                                                CARD {currentCardIndex + 1} OF {displayedCards.length}
                                                            </span>
                                                        </div>
                                                        <p className="font-extrabold text-slate-800 dark:text-slate-100 text-lg md:text-xl max-w-md my-auto leading-relaxed z-10 px-4">
                                                            {currentCard.question}
                                                        </p>
                                                        <span className="text-[10px] font-extrabold text-sky-500/80 dark:text-sky-300 uppercase tracking-widest shrink-0 select-none animate-pulse z-10">
                                                            Tap card to flip and view answer
                                                        </span>
                                                    </div>

                                                    {/* Back Side - Answer */}
                                                    <div
                                                        className="absolute inset-0 w-full h-full p-8 rounded-3xl bg-linear-to-br from-emerald-50 via-white to-cyan-100/70 dark:from-emerald-950 dark:via-slate-900 dark:to-slate-800 flex flex-col justify-between items-center text-center backface-hidden overflow-hidden"
                                                        style={{
                                                            backfaceVisibility: 'hidden',
                                                            transform: 'rotateY(180deg)'
                                                        }}
                                                    >
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 dark:bg-emerald-400/10 blur-3xl rounded-full pointer-events-none" />
                                                        <div className="flex justify-between items-center w-full text-emerald-600 dark:text-emerald-300 text-[10px] font-extrabold tracking-widest shrink-0 z-10">
                                                            <span>ANSWER REVEALED</span>
                                                            <span className="px-3 py-1 border border-emerald-200 bg-white/85 dark:bg-slate-950/70 dark:border-emerald-400/30 rounded-full font-extrabold text-emerald-600 dark:text-emerald-200">
                                                                REVEALED
                                                            </span>
                                                        </div>
                                                        <p className="font-bold text-slate-800 dark:text-slate-100 text-base md:text-lg max-w-md my-auto leading-relaxed text-center z-10 px-4">
                                                            {currentCard.answer}
                                                        </p>
                                                        <span className="text-[10px] font-extrabold text-emerald-600/80 dark:text-emerald-300 uppercase tracking-widest shrink-0 select-none z-10">
                                                            Tap card to view question
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Card Controls Panel */}
                                            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl shrink-0 shadow-2xs">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleToggleStar(currentCard._id)
                                                        }}
                                                        className={`p-2.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${currentCard.isStarred
                                                            ? 'bg-amber-50 dark:bg-amber-400/15 border-amber-300 dark:border-amber-400/30 text-amber-500 dark:text-amber-300'
                                                            : 'bg-white dark:bg-slate-950/60 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200'
                                                            }`}
                                                        title="Star card"
                                                    >
                                                        <Star className={`h-5 w-5 ${currentCard.isStarred ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDeleteCard(currentCard._id)
                                                        }}
                                                        className="p-2.5 bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all cursor-pointer shadow-2xs"
                                                        title="Delete card"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => {
                                                            setCurrentCardIndex(prev => Math.max(0, prev - 1))
                                                            setIsFlipped(false)
                                                        }}
                                                        disabled={currentCardIndex === 0}
                                                        className="p-2.5 bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-all cursor-pointer shadow-2xs"
                                                    >
                                                        <ChevronLeft className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setCurrentCardIndex(prev => Math.min(displayedCards.length - 1, prev + 1))
                                                            setIsFlipped(false)
                                                        }}
                                                        disabled={currentCardIndex === displayedCards.length - 1}
                                                        className="p-2.5 bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-all cursor-pointer shadow-2xs"
                                                    >
                                                        <ChevronRight className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })()}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 5: Quizzes */}
                {activeTab === 'quizzes' && (
                    <div className="flex-1 flex flex-col min-h-0 p-6 relative">
                        {quizLoading ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-450 gap-3 my-auto">
                                <Loader className="h-10 w-10 text-teal-600 animate-spin" />
                                <span className="text-sm font-semibold animate-pulse text-slate-500">Groq AI is scanning text and creating quiz questions...</span>
                            </div>
                        ) : quizzes.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-6 border border-dashed border-slate-200 rounded-3xl bg-slate-50/50 my-auto">
                                <HelpCircle className="h-14 w-14 text-teal-200 mb-4" />
                                <h3 className="text-lg font-bold text-slate-800">Generate AI Study Quiz</h3>
                                <p className="text-slate-400 text-xs max-w-sm mt-2 leading-relaxed">
                                    Let Groq inspect your PDF document and create high-quality multiple-choice questions with answer checks, detailed scoring, and explanations!
                                </p>
                                <button
                                    onClick={() => setShowQuizGenerator(true)}
                                    className="mt-6 btn btn-primary shadow-lg"
                                >
                                    <Plus className="h-4 w-4 text-white" />
                                    <span>Create Quiz with AI</span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col gap-5">
                                <div className="flex justify-between items-center">
                                    <h2 className="font-bold text-slate-800 text-base md:text-lg">Available Study Quizzes ({quizzes.length})</h2>
                                    <button
                                        onClick={() => setShowQuizGenerator(true)}
                                        className="btn btn-primary py-2 px-4 text-xs font-bold"
                                    >
                                        <Plus className="h-4 w-4 text-white" />
                                        <span>New Quiz</span>
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto flex flex-col gap-3.5 max-h-[50vh] pr-1">
                                    {quizzes.map((quiz) => {
                                        const hasResult = quiz.completedAt !== null
                                        return (
                                            <div
                                                key={quiz._id}
                                                className="p-5 border border-slate-200 bg-white rounded-2xl flex items-center justify-between gap-4 group shadow-sm hover:border-teal-200 transition-colors"
                                            >
                                                <div className="flex items-center gap-3.5 min-w-0">
                                                    <div className={`p-3 rounded-xl shrink-0 ${hasResult ? 'bg-teal-50 text-teal-600 font-bold' : 'bg-blue-50 text-blue-600 font-bold'
                                                        }`}>
                                                        <HelpCircle className="h-6 w-6" />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-bold text-slate-800 text-sm md:text-base truncate group-hover:text-teal-600 transition-colors">
                                                            {quiz.title}
                                                        </span>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] bg-slate-100 border border-slate-200/40 text-slate-500 font-bold px-2 py-0.5 rounded-full shrink-0">
                                                                {quiz.totalQuestions} Questions
                                                            </span>
                                                            {hasResult ? (
                                                                <span className="text-[10px] text-teal-650 font-extrabold shrink-0 flex items-center gap-0.5">
                                                                    Score: {quiz.score}/{quiz.totalQuestions} ({Math.round((quiz.score / quiz.totalQuestions) * 100)}%)
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] text-amber-500 font-extrabold shrink-0">
                                                                    Not taken yet
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 shrink-0">
                                                    <button
                                                        onClick={() => handleDeleteQuiz(quiz._id)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                                                        title="Delete quiz"
                                                    >
                                                        <Trash2 className="h-4.5 w-4.5" />
                                                    </button>
                                                    <Link
                                                        to={hasResult ? `/quizzes/${quiz._id}/results` : `/quizzes/${quiz._id}`}
                                                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs border ${hasResult
                                                            ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                                            : 'bg-teal-600 hover:bg-teal-700 text-white border-teal-600'
                                                            }`}
                                                    >
                                                        {hasResult ? 'View Score' : 'Take Quiz'}
                                                    </Link>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Quiz generation Dialog Modal Backdrop */}
                        {showQuizGenerator && (
                            <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-xs z-20 flex items-center justify-center p-6 rounded-3xl">
                                <div className="bg-white dark:bg-slate-950/95 border border-slate-200 dark:border-slate-700 w-full max-w-sm rounded-2xl shadow-xl p-5 flex flex-col gap-4">
                                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                        <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">AI Quiz Generator</h3>
                                        <button
                                            onClick={() => setShowQuizGenerator(false)}
                                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <form onSubmit={handleCreateQuiz} className="flex flex-col gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] text-slate-400 dark:text-slate-300 font-bold uppercase tracking-wider px-1">Quiz Title</label>
                                            <input
                                                type="text"
                                                value={quizFormTitle}
                                                onChange={(e) => setQuizFormTitle(e.target.value)}
                                                placeholder="e.g., Biology Ch 4 Quiz"
                                                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-teal-500 dark:focus:border-emerald-400 rounded-xl outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs transition-all"
                                                required
                                            />
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] text-slate-400 dark:text-slate-300 font-bold uppercase tracking-wider px-1">Number of Questions</label>
                                            <div className="flex gap-2">
                                                {[5, 10, 15].map(cnt => (
                                                    <button
                                                        key={cnt}
                                                        type="button"
                                                        onClick={() => setQuizCount(cnt)}
                                                        className={`flex-1 py-2 border rounded-lg text-xs font-bold transition-all cursor-pointer ${quizCount === cnt
                                                            ? 'bg-teal-50 dark:bg-emerald-400/15 border-teal-500 dark:border-emerald-400 text-teal-650 dark:text-emerald-100 shadow-2xs'
                                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:text-slate-650 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                            }`}
                                                    >
                                                        {cnt} Qs
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                                            <button
                                                type="button"
                                                onClick={() => setShowQuizGenerator(false)}
                                                className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl font-bold text-slate-500 dark:text-slate-300 text-xs transition-colors cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-md"
                                            >
                                                Generate
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Custom Modal for Concept Explainer Details popup */}
            {showExplainModal && (
                <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-xl max-h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-teal-600 font-bold" />
                                <h3 className="font-extrabold text-slate-800 text-sm truncate">AI Topic Breakdown: {explainConceptTitle}</h3>
                            </div>
                            <button
                                onClick={() => setShowExplainModal(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {explainLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-3.5 text-center">
                                    <Loader className="h-10 w-10 text-teal-600 animate-spin" />
                                    <span className="text-xs text-slate-500 font-bold animate-pulse">Assistant is studying relevant parts of your document...</span>
                                </div>
                            ) : (
                                <div className="prose prose-slate max-w-none text-slate-700 prose-sm text-left leading-relaxed">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {explainConceptContent || 'Concept explanation unavailable.'}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50 rounded-b-2xl">
                            {explainConceptContent && (
                                <button
                                    onClick={() => handleCopy(explainConceptContent)}
                                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-teal-600 transition-colors cursor-pointer font-bold bg-white px-3.5 py-2 rounded-xl border border-slate-200"
                                >
                                    {copied ? <Check className="h-4 w-4 text-teal-600" /> : <Copy className="h-4 w-4" />}
                                    <span>{copied ? 'Copied' : 'Copy Text'}</span>
                                </button>
                            )}
                            <button
                                onClick={() => setShowExplainModal(false)}
                                className="btn btn-ghost py-2 px-4 text-xs font-bold bg-white"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default DocumentDetailPage