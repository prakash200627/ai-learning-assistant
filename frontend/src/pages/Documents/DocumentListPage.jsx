import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
    FileText,
    Upload,
    Trash2,
    Plus,
    X,
    Sparkles,
    Search,
    BookOpen,
    Loader,
    Layers,
    HelpCircle
} from 'lucide-react'
import moment from 'moment'
import toast from 'react-hot-toast'
import { getDocuments, uploadDocument, deleteDocument } from '../../services/documentService'

const DocumentListPage = () => {
    const [documents, setDocuments] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    // Modal states
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedFile, setSelectedFile] = useState(null)
    const [docTitle, setDocTitle] = useState('')
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [isAiProcessing, setIsAiProcessing] = useState(false)
    const fileInputRef = useRef(null)

    const fetchDocs = async () => {
        try {
            const res = await getDocuments()
            if (res.success) {
                setDocuments(res.documents)
            }
        } catch (err) {
            toast.error('Failed to load documents')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDocs()
    }, [])

    const handleDelete = async (id, e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!window.confirm('Are you sure you want to delete this document? This will also delete all generated flashcards and quizzes.')) {
            return
        }

        try {
            const res = await deleteDocument(id)
            if (res.success) {
                toast.success('Document deleted successfully')
                fetchDocs()
            }
        } catch (err) {
            toast.error('Failed to delete document')
        }
    }

    // Format File Size
    const formatBytes = (bytes, decimals = 2) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const dm = decimals < 0 ? 0 : decimals
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
    }

    // Handle file selection
    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            if (file.type !== 'application/pdf') {
                return toast.error('Only PDF documents are supported')
            }
            setSelectedFile(file)
            setDocTitle(file.name.replace(/\.[^/.]+$/, "")) // Pre-fill title without extension
        }
    }

    // Handle Drag & Drop
    const handleDragOver = (e) => {
        e.preventDefault()
    }

    const handleDrop = (e) => {
        e.preventDefault()
        const file = e.dataTransfer.files[0]
        if (file) {
            if (file.type !== 'application/pdf') {
                return toast.error('Only PDF documents are supported')
            }
            setSelectedFile(file)
            setDocTitle(file.name.replace(/\.[^/.]+$/, ""))
        }
    }

    // Submit Document Upload
    const handleUploadSubmit = async (e) => {
        e.preventDefault()
        if (!selectedFile) {
            return toast.error('Please select a PDF file first')
        }

        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('title', docTitle.trim())

        setUploading(true)
        setUploadProgress(0)
        setIsAiProcessing(false)

        try {
            await uploadDocument(formData, (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                setUploadProgress(percentCompleted)
                if (percentCompleted === 100) {
                    setIsAiProcessing(true) // File is completely uploaded, now Groq AI is processing
                }
            })

            toast.success('Document uploaded and processed successfully!')
            setModalOpen(false)
            setSelectedFile(null)
            setDocTitle('')
            fetchDocs()
        } catch (err) {
            console.error(err)
            toast.error(err.response?.data?.error || 'Failed to upload document')
        } finally {
            setUploading(false)
            setIsAiProcessing(false)
        }
    }

    const filteredDocuments = documents.filter(doc =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="flex flex-col gap-8 text-left">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-(--text-main) tracking-tight">
                        My Documents
                    </h1>
                    <p className="text-(--text-muted) mt-1 text-sm font-medium">
                        Manage and organize your learning materials
                    </p>
                </div>
                <button
                    onClick={() => setModalOpen(true)}
                    className="btn btn-accent px-5 py-3 rounded-xl flex items-center gap-2 hover:scale-[1.02]"
                >
                    <Plus className="h-5 w-5" />
                    <span>Upload Document</span>
                </button>
            </div>

            {/* Search filter */}
            <div className="relative max-w-md w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-(--text-light)" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search documents by title..."
                    className="w-full pl-12 pr-4 py-3.5 bg-(--card-bg-solid) border border-(--border-color) focus:border-(--color-primary) rounded-xl outline-none text-(--text-main) placeholder:text-(--text-light) text-sm transition-all shadow-xs"
                />
            </div>

            {/* List / Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-(--border-color) border border-(--border-color) rounded-3xl animate-pulse" />
                    ))}
                </div>
            ) : filteredDocuments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed border-(--border-color) rounded-3xl bg-(--card-bg) shadow-xs">
                    <BookOpen className="h-16 w-16 text-(--color-primary)/25 mb-4 animate-bounce" />
                    <h3 className="text-xl font-extrabold text-(--text-main)">No documents found</h3>
                    <p className="text-(--text-muted) text-xs max-w-sm mt-2 font-medium">
                        {searchQuery
                            ? "Try refining your search query or upload a new file."
                            : "Get started by uploading your first PDF textbook, lecture slides, or study notes!"}
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={() => setModalOpen(true)}
                            className="mt-6 btn btn-accent px-5 py-3.5 rounded-xl hover:scale-105"
                        >
                            <Plus className="h-5 w-5" />
                            <span>Upload your first PDF</span>
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDocuments.map((doc) => (
                        <Link
                            key={doc._id}
                            to={`/documents/${doc._id}`}
                            className="card interactive-card p-6 rounded-3xl flex flex-col justify-between transition-all duration-300 group relative bg-(--card-bg)"
                        >
                            <div className="flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div className="p-3.5 bg-[rgba(15,118,110,0.08)] border border-[rgba(15,118,110,0.18)] text-(--color-primary) rounded-2xl transition-colors">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <button
                                        onClick={(e) => handleDelete(doc._id, e)}
                                        className="p-2 text-(--text-light) hover:text-red-600 hover:bg-red-50/70 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                                        title="Delete document"
                                    >
                                        <Trash2 className="h-4.5 w-4.5" />
                                    </button>
                                </div>

                                <div className="flex flex-col gap-1 min-w-0">
                                    <h3 className="font-extrabold text-(--text-main) group-hover:text-(--color-primary) text-base md:text-lg transition-colors truncate">
                                        {doc.title}
                                    </h3>
                                    <span className="text-[11px] font-bold text-(--text-muted) truncate" title={doc.fileName}>
                                        {formatBytes(doc.fileSize)}
                                    </span>
                                </div>
                            </div>

                            {/* Flashcards & Quiz indicator counts */}
                            <div className="flex items-center gap-2 mt-4 shrink-0">
                                <span className="text-[10px] bg-violet-500/10 text-violet-700 border border-violet-500/20 font-extrabold px-2.5 py-1.5 rounded-xl flex items-center gap-1">
                                    <Layers className="h-3.5 w-3.5" />
                                    <span>{doc.flashcardsCount !== undefined ? doc.flashcardsCount : 0} Flashcards</span>
                                </span>
                                <span className="text-[10px] bg-[rgba(15,118,110,0.10)] text-(--color-primary) border border-[rgba(15,118,110,0.18)] font-extrabold px-2.5 py-1.5 rounded-xl flex items-center gap-1">
                                    <HelpCircle className="h-3.5 w-3.5" />
                                    <span>{doc.quizzesCount !== undefined ? doc.quizzesCount : 0} Quizzes</span>
                                </span>
                            </div>

                            <div className="flex items-center justify-between mt-5 pt-4 border-t border-(--border-color)">
                                <span className="text-[10px] text-(--text-light) font-bold tracking-wide">
                                    Uploaded {moment(doc.createdAt).fromNow()}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Document Upload Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
                    <div className="bg-(--card-bg-solid) border border-(--border-color) w-full max-w-md modal-card shadow-2xl relative overflow-hidden flex flex-col p-6 gap-5">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-(--border-color) pb-4">
                            <div className="flex flex-col text-left">
                                <h2 className="text-lg font-black text-(--text-main)">Upload New Document</h2>
                                <p className="text-(--text-muted) text-xs font-semibold mt-0.5">Add a PDF document to your library</p>
                            </div>
                            <button
                                onClick={() => !uploading && setModalOpen(false)}
                                className="p-1 text-(--text-light) hover:text-(--color-primary) hover:bg-[rgba(15,118,110,0.08)] rounded-lg transition-colors"
                                disabled={uploading}
                                aria-label="Close upload modal"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleUploadSubmit} className="flex flex-col gap-5 text-left">
                            {/* Title Field */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] text-(--text-light) font-extrabold uppercase tracking-widest px-1">
                                    DOCUMENT TITLE
                                </label>
                                <input
                                    type="text"
                                    value={docTitle}
                                    onChange={(e) => setDocTitle(e.target.value)}
                                    placeholder="React JS Concept Guide"
                                    className="w-full px-4 py-3 border border-(--border-color) bg-(--card-bg-solid) focus:border-(--color-primary) rounded-xl outline-none text-(--text-main) placeholder:text-(--text-light) text-xs font-semibold transition-all"
                                    required
                                    disabled={uploading}
                                />
                            </div>

                            {/* Drag and Drop Area */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] text-(--text-light) font-extrabold uppercase tracking-widest px-1">
                                    PDF FILE
                                </label>
                                {!selectedFile ? (
                                    <div
                                        onDragOver={handleDragOver}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-teal-500/30 hover:border-teal-500 bg-teal-50/5 hover:bg-teal-50/15 cursor-pointer rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center transition-all group"
                                    >
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            accept="application/pdf"
                                            className="hidden"
                                        />
                                        <div className="p-3.5 bg-teal-50 border border-teal-100 rounded-xl text-teal-500 transition-all">
                                            <Upload className="h-6 w-6" />
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <p className="font-bold text-slate-700 text-xs">Drag & drop your study PDF here</p>
                                            <p className="text-[10px] text-slate-400 font-semibold">or click to browse from files</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="border-2 border-dashed border-teal-500/30 bg-teal-50/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-center relative group">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedFile(null)}
                                            className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                                            disabled={uploading}
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                        <div className="p-3.5 bg-teal-50 border border-teal-100 rounded-xl text-teal-500 shrink-0">
                                            <Upload className="h-6 w-6" />
                                        </div>
                                        <div className="flex flex-col gap-0.5 max-w-[80%]">
                                            <span className="font-extrabold text-teal-700 text-xs truncate" title={selectedFile.name}>
                                                {selectedFile.name}
                                            </span>
                                            <span className="text-[10px] text-slate-450 font-bold">PDF up to 10MB</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Progress bar loader */}
                            {uploading && (
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-3">
                                    <div className="flex items-center justify-between text-[11px] font-bold">
                                        <span className="text-slate-500 flex items-center gap-1.5">
                                            {isAiProcessing ? (
                                                <>
                                                    <Loader className="h-4 w-4 text-teal-500 animate-spin" />
                                                    <span className="text-teal-650 animate-pulse">AI extracting text & generating summaries...</span>
                                                </>
                                            ) : (
                                                'Uploading file...'
                                            )}
                                        </span>
                                        <span className="text-slate-800">{uploadProgress}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-teal-500 rounded-full transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                    {isAiProcessing && (
                                        <p className="text-[9px] text-slate-400 font-semibold leading-relaxed text-center">
                                            Groq AI is parsing details. This takes about 10-15 seconds. Please keep this modal open!
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Footer Buttons */}
                            <div className="flex justify-end items-center gap-3 border-t border-slate-100 pt-4 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-500 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                                    disabled={uploading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading || !selectedFile}
                                    className="btn btn-primary px-5 py-2 rounded-xl text-xs shadow-xs"
                                >
                                    <span>Upload</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default DocumentListPage