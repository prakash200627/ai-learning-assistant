import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    HelpCircle,
    ArrowLeft,
    ChevronRight,
    Loader,
    Check
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getQuiz, submitQuiz } from '../../services/quizService'

const QuizTakePage = () => {
    const { quizId } = useParams()
    const navigate = useNavigate()

    const [quiz, setQuiz] = useState(null)
    const [loading, setLoading] = useState(true)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState([]) // Array of selected option strings
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const res = await getQuiz(quizId)
                if (res.success) {
                    setQuiz(res.quiz)
                    // Prefill empty strings for answers
                    setAnswers(new Array(res.quiz.questions.length).fill(''))
                } else {
                    toast.error('Quiz not found')
                    navigate('/documents')
                }
            } catch (err) {
                toast.error('Failed to load quiz')
                navigate('/documents')
            } finally {
                setLoading(false)
            }
        }
        fetchQuiz()
    }, [quizId])

    const handleSelectOption = (optionStr) => {
        setAnswers(prev => {
            const copy = [...prev]
            copy[currentQuestionIndex] = optionStr
            return copy
        })
    }

    const handleSubmit = async () => {
        // Double check all answered
        const unanswered = answers.some(ans => ans === '')
        if (unanswered) {
            if (!window.confirm('You have unanswered questions. Are you sure you want to submit the quiz?')) {
                return
            }
        }

        setSubmitting(true)
        try {
            const res = await submitQuiz(quizId, answers)
            if (res.success) {
                toast.success('Quiz submitted successfully!')
                navigate(`/quizzes/${quizId}/results`, { replace: true })
            }
        } catch (err) {
            toast.error('Failed to submit quiz results')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-(--text-light) gap-3">
                <Loader className="h-10 w-10 text-(--color-primary) animate-spin" />
                <span className="text-sm font-medium animate-pulse text-(--text-muted)">Loading quiz workspace...</span>
            </div>
        )
    }

    const currentQuestion = quiz.questions[currentQuestionIndex]
    const selectedOption = answers[currentQuestionIndex]
    const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1

    return (
        <div className="min-h-[calc(100vh-6rem)] md:min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4">
            <div className="max-w-2xl w-full card surface-soft rounded-[30px] p-6 md:p-8 flex flex-col gap-6 shadow-premium-hover relative">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-(--border-color) pb-4 shrink-0">
                    <div className="flex items-center gap-3.5 min-w-0">
                        <button
                            onClick={() => navigate(`/documents/${quiz.documentId}`)}
                            className="p-2.5 border border-(--border-color) hover:border-(--color-primary)/30 bg-(--card-bg-solid) rounded-2xl text-(--text-muted) hover:text-(--text-main) transition-colors shrink-0 cursor-pointer shadow-2xs"
                        >
                            <ArrowLeft className="h-4.5 w-4.5" />
                        </button>
                        <h2 className="font-extrabold text-(--text-main) text-base md:text-lg truncate max-w-xs md:max-w-md">
                            {quiz.title}
                        </h2>
                    </div>
                    <span className="text-xs bg-(--card-bg) border border-(--border-color) px-3.5 py-1.5 rounded-full text-(--text-muted) font-extrabold shrink-0 shadow-2xs">
                        Q. {currentQuestionIndex + 1} OF {quiz.questions.length}
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[rgba(15,118,110,0.10)] dark:bg-white/10 h-2 rounded-full overflow-hidden shrink-0 shadow-inner">
                    <div
                        className="h-full bg-teal-600 rounded-full transition-all duration-300"
                        style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
                    />
                </div>

                {/* Question Block */}
                <div className="flex flex-col gap-5 flex-1 my-2">
                    <div className="flex gap-3 bg-[rgba(15,118,110,0.06)] border border-[rgba(15,118,110,0.14)] p-4 rounded-2xl shadow-2xs">
                        <div className="p-2 bg-(--color-primary) text-white rounded-xl h-fit shrink-0 shadow-xs">
                            <HelpCircle className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-(--text-main) font-extrabold text-base md:text-lg leading-relaxed text-left">
                            {currentQuestion.question}
                        </h3>
                    </div>

                    {/* Options Stack */}
                    <div className="flex flex-col gap-3">
                        {currentQuestion.options.map((option, idx) => {
                            const isChosen = selectedOption === option
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleSelectOption(option)}
                                    disabled={submitting}
                                    className={`
                                        w-full px-5 py-4 border rounded-2xl font-bold text-(--text-main) text-left text-sm transition-all duration-200 cursor-pointer flex items-center justify-between group shadow-2xs
                                        ${isChosen
                                            ? 'bg-[rgba(15,118,110,0.10)] dark:bg-emerald-400/15 border-(--color-primary) dark:border-emerald-400/50 text-(--color-primary) dark:text-emerald-100 font-extrabold ring-1 ring-(--color-primary)/15 dark:ring-emerald-400/20'
                                            : 'bg-(--card-bg-solid) dark:bg-slate-950/70 border-(--border-color) dark:border-slate-700 hover:border-(--color-primary)/25 dark:hover:border-emerald-400/30 hover:bg-[rgba(15,118,110,0.05)] dark:hover:bg-slate-900/80'}
                                    `}
                                >
                                    <span>{option}</span>
                                    <div className={`h-5 w-5 rounded-full border flex items-center justify-center transition-all shrink-0 ${isChosen
                                        ? 'bg-(--color-primary) border-(--color-primary) text-white dark:bg-emerald-400 dark:border-emerald-400'
                                        : 'border-(--border-color) dark:border-slate-600 group-hover:border-(--color-primary)/30 dark:group-hover:border-emerald-400/40 bg-(--card-bg-solid) dark:bg-slate-900'
                                        }`}>
                                        {isChosen && <Check className="h-3 w-3 text-white" />}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="flex justify-between items-center border-t border-(--border-color) pt-4 mt-2 shrink-0">
                    <button
                        type="button"
                        onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentQuestionIndex === 0 || submitting}
                        className="btn btn-ghost px-5 py-2.5 rounded-xl font-bold text-xs cursor-pointer"
                    >
                        Previous
                    </button>

                    {isLastQuestion ? (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="btn btn-accent px-6 py-2.5 rounded-xl font-extrabold text-white text-xs shadow-md hover:scale-[1.01] flex items-center gap-1.5 disabled:opacity-50"
                        >
                            <span>{submitting ? 'Submitting...' : 'Submit Answers'}</span>
                            {!submitting && <ChevronRight className="h-4.5 w-4.5 text-white" />}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setCurrentQuestionIndex(prev => Math.min(quiz.questions.length - 1, prev + 1))}
                            disabled={submitting}
                            className="btn btn-ghost px-6 py-2.5 rounded-xl font-extrabold text-xs shadow-2xs flex items-center gap-1.5"
                        >
                            <span>Next Question</span>
                            <ChevronRight className="h-4.5 w-4.5" />
                        </button>
                    )}
                </div>

            </div>
        </div>
    )
}

export default QuizTakePage