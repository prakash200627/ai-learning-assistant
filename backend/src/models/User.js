import mongoose from "mongoose";
import bcrypt from "bcryptjs"

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 character long']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false
    },
    profileImage: {
        type: String,
        default: null
    }
}, {
    timestamps: true
})

userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return
    }
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
})

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password)
}

import { getMockModel, wrapInstance, generateId } from '../utils/localDBHelper.js'

const originalUser = mongoose.model('User', userSchema)
const User = new Proxy(originalUser, {
    get(target, prop) {
        if (mongoose.connection.readyState !== 1) {
            const mockModel = getMockModel('users')
            return mockModel[prop]
        }
        return target[prop]
    },
    construct(target, args) {
        if (mongoose.connection.readyState !== 1) {
            const data = args[0] || {}
            return wrapInstance('users', {
                _id: generateId(),
                ...data,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            })
        }
        return new target(...args)
    }
})

export default User