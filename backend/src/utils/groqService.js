import Groq from 'groq-sdk'

const getClient = () => {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey || apiKey === 'your-groq-api-key-here') {
        console.warn('Warning: GROQ_API_KEY is not set. Using simulated responses.')
        return null
    }
    return new Groq({ apiKey })
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Helper to retry Groq requests when experiencing temporary 429 rate limits or 503 unavailability
 */
const callGroqWithRetry = async (aiCallFn, retries = 3, delay = 2000) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await aiCallFn()
        } catch (error) {
            const errorMsg = error.message || ''
            const statusCode = error.status || error.statusCode || (error.response && error.response.status) || 0
            const isRetryable = (
                statusCode === 429 ||
                statusCode === 503 ||
                statusCode === 500 ||
                errorMsg.includes('429') ||
                errorMsg.includes('503') ||
                errorMsg.includes('Rate limit') ||
                errorMsg.includes('Service Unavailable')
            )
            if (isRetryable && attempt < retries) {
                console.warn(`Groq API error ${statusCode || errorMsg} (attempt ${attempt}/${retries}). Retrying in ${delay}ms...`)
                await sleep(delay)
                continue
            }
            throw error
        }
    }
}

export const generateSummary = async (text) => {
    const ai = getClient()
    if (!ai) {
        return "This is a simulated summary of the uploaded document. Please configure your actual GROQ_API_KEY in the backend .env file to enable live AI summaries."
    }

    try {
        const response = await callGroqWithRetry(() => 
            ai.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'user',
                        content: `Please read the following text and provide a concise, high-quality, and structured summary. Focus on key takeaways and educational concepts: \n\n${text.substring(0, 30000)}`
                    }
                ]
            })
        )
        return response.choices[0].message.content
    } catch (error) {
        console.error('Groq summary error:', error)
        throw new Error(`Failed to generate summary: ${error.message}`)
    }
}

export const generateExplanation = async (text) => {
    const ai = getClient()
    if (!ai) {
        return "This is a simulated explanation. Please set your GROQ_API_KEY in the backend .env file to enable live explanation generation."
    }

    try {
        const response = await callGroqWithRetry(() => 
            ai.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'user',
                        content: `Analyze the following study materials and provide a simple, friendly, and structured explanation of the most important concepts. Use formatting like bullet points to make it easy to understand: \n\n${text.substring(0, 30000)}`
                    }
                ]
            })
        )
        return response.choices[0].message.content
    } catch (error) {
        console.error('Groq explanation error:', error)
        throw new Error(`Failed to generate concept explanation: ${error.message}`)
    }
}

const cleanJSONString = (str) => {
    let cleaned = str.trim();
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
    }
    if (cleaned.endsWith('```')) {
        cleaned = cleaned.replace(/\s*```$/i, '');
    }
    return cleaned.trim();
};

export const generateFlashcards = async (text) => {
    const ai = getClient()
    if (!ai) {
        return [
            { question: "What is the primary subject of this document?", answer: "The document discusses learning concepts and structural notes." },
            { question: "What is a core benefit of spaced repetition?", answer: "It enhances memory retention by reviewing information at increasing intervals." }
        ]
    }

    try {
        const prompt = `Based on the following study materials, generate a list of 5-8 flashcard question and answer pairs. Return the result strictly as a JSON object with a "flashcards" key containing an array of objects, where each object has exactly two fields: "question" and "answer". Do not include markdown code block markers. Just return the raw JSON.\n\nText:\n${text.substring(0, 20000)}`

        const response = await callGroqWithRetry(() => 
            ai.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'user', content: prompt }
                ],
                response_format: { type: "json_object" }
            })
        )

        const jsonStr = cleanJSONString(response.choices[0].message.content)
        const parsed = JSON.parse(jsonStr)
        if (Array.isArray(parsed)) {
            return parsed
        } else if (parsed.flashcards && Array.isArray(parsed.flashcards)) {
            return parsed.flashcards
        } else {
            const possibleArray = Object.values(parsed).find(val => Array.isArray(val))
            if (possibleArray) return possibleArray
            throw new Error("Invalid JSON structure returned by Groq")
        }
    } catch (error) {
        console.error('Groq flashcard generation error:', error)
        throw new Error(`Failed to generate flashcards: ${error.message}`)
    }
}

export const generateQuiz = async (text, count = 5) => {
    const ai = getClient()
    if (!ai) {
        return [
            {
                question: "What does AI stand for?",
                options: ["Artificial Intelligence", "Active Integration", "Automated Interface", "Advanced Input"],
                correctAnswer: "Artificial Intelligence",
                explanation: "AI stands for Artificial Intelligence, which refers to the simulation of human intelligence in machines."
            },
            {
                question: "Which database type is MongoDB?",
                options: ["Relational Database", "NoSQL Document Database", "Graph Database", "Key-Value Cache"],
                correctAnswer: "NoSQL Document Database",
                explanation: "MongoDB is a NoSQL document database, storing data in flexible JSON-like documents rather than traditional tables."
            }
        ]
    }

    try {
        const prompt = `Based on the following text, generate a multiple-choice quiz with exactly ${count} questions. Each question must have exactly 4 choices and exactly 1 correct answer (which must match one of the choices exactly). Return the response strictly as a JSON object with a "quizzes" key containing an array of objects, where each object has exactly these fields:
- "question" (string)
- "options" (array of 4 strings)
- "correctAnswer" (string, must be identical to the correct option from options array)
- "explanation" (string, a brief concept explanation explaining why the correct answer is correct)

Do not include any other text or markdown formatting outside the JSON structure.

Text:
${text.substring(0, 20000)}`

        const response = await callGroqWithRetry(() => 
            ai.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'user', content: prompt }
                ],
                response_format: { type: "json_object" }
            })
        )

        const jsonStr = cleanJSONString(response.choices[0].message.content)
        const parsed = JSON.parse(jsonStr)
        if (Array.isArray(parsed)) {
            return parsed
        } else if (parsed.quizzes && Array.isArray(parsed.quizzes)) {
            return parsed.quizzes
        } else {
            const possibleArray = Object.values(parsed).find(val => Array.isArray(val))
            if (possibleArray) return possibleArray
            throw new Error("Invalid JSON structure returned by Groq")
        }
    } catch (error) {
        console.error('Groq quiz generation error:', error)
        throw new Error(`Failed to generate quiz: ${error.message}`)
    }
}

export const chatWithDocument = async (context, message, history) => {
    const ai = getClient()
    if (!ai) {
        return `[Simulated AI Reply] You asked about the document: "${message}". Set your GROQ_API_KEY to ask real questions!`
    }

    try {
        const systemPrompt = `You are a helpful learning assistant. Answer the user's questions based ONLY on the following context/study materials. If the answer cannot be found in the context, politely state that you can only answer questions related to the study material.\n\nContext:\n${context.substring(0, 25000)}`

        const messages = [
            { role: 'system', content: systemPrompt }
        ]

        if (history && history.length > 0) {
            history.forEach(item => {
                messages.push({
                    role: item.role === 'assistant' ? 'assistant' : 'user',
                    content: item.content || item.message
                })
            })
        }

        messages.push({
            role: 'user',
            content: message
        })

        const response = await callGroqWithRetry(() => 
            ai.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages
            })
        )

        return response.choices[0].message.content
    } catch (error) {
        console.error('Groq chat error:', error)
        throw new Error(`Failed to chat: ${error.message}`)
    }
}
