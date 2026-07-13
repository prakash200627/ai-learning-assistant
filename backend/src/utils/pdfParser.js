import fs from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { PDFParse } = require('pdf-parse')

/**
 * Extract text and metadata from PDF file
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<{text: string, numPages: number, info: any}>} - Extracted text and metadata
 */
export const extractTextFromPDF = async (filePath) => {
    try {
        const dataBuffer = fs.readFileSync(filePath)
        // Instantiate the PDFParse class from version 2.4.5
        const parser = new PDFParse({ data: dataBuffer })
        const textResult = await parser.getText()
        
        return {
            text: textResult.text,
            numPages: textResult.total,
            info: {}
        }
    } catch (error) {
        console.error("PDF parsing error:", error)
        throw new Error(`Failed to extract text from PDF: ${error.message}`)
    }
}
