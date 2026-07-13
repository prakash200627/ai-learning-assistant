import multer from 'multer'
import path from 'path'
import fs from 'fs'

// Ensure uploads directory exists
export const uploadDir = process.env.UPLOAD_DIR || (process.env.NODE_ENV === 'production' ? '/app/uploads' : path.join(process.cwd(), 'uploads'))

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`)
    }
})

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowedTypes.includes(ext)) {
        cb(null, true)
    } else {
        cb(new Error('Only PDFs and Images (.jpg, .jpeg, .png) are allowed'), false)
    }
}

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
})

export default upload
