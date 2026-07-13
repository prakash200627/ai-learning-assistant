import React, { useState, useEffect } from 'react'
import {
    User,
    Mail,
    Key,
    Shield,
    Calendar,
    Sparkles,
    Loader
} from 'lucide-react'
import toast from 'react-hot-toast'
import moment from 'moment'

import { getProfile, updateProfile, changePassword, getCurrentUser } from '../../services/authService'

const ProfilePage = () => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    // Edit profile state
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [updatingProfile, setUpdatingProfile] = useState(false)

    // Password change state
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [updatingPassword, setUpdatingPassword] = useState(false)

    const fetchProfileData = async () => {
        try {
            const res = await getProfile()
            if (res.success) {
                // User is in res.data or res.user. Let's see: in authController.js:
                // res.status(200).json({ success: true, data: { id, username, email, profileImage, createdAt, updatedAt } })
                const profile = res.data
                setUser(profile)
                setUsername(profile.username)
                setEmail(profile.email)
            }
        } catch (err) {
            toast.error('Failed to load profile details')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProfileData()
    }, [])

    const handleUpdateProfile = async (e) => {
        e.preventDefault()
        if (!username || !email) {
            return toast.error('Please enter username and email')
        }

        setUpdatingProfile(true)
        try {
            const res = await updateProfile({ username, email })
            if (res.success) {
                toast.success('Profile details updated successfully')
                fetchProfileData()
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update profile')
        } finally {
            setUpdatingProfile(false)
        }
    }

    const handleChangePassword = async (e) => {
        e.preventDefault()
        if (!currentPassword || !newPassword || !confirmPassword) {
            return toast.error('Please enter all password fields')
        }
        if (newPassword.length < 6) {
            return toast.error('New password must be at least 6 characters')
        }
        if (newPassword !== confirmPassword) {
            return toast.error('New password and confirm password do not match')
        }

        setUpdatingPassword(true)
        try {
            const res = await changePassword(currentPassword, newPassword)
            if (res.success) {
                toast.success('Password changed successfully')
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to change password')
        } finally {
            setUpdatingPassword(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-(--text-light) gap-3">
                <Loader className="h-10 w-10 text-(--color-primary) animate-spin" />
                <span className="text-sm font-medium animate-pulse text-(--text-muted)">Loading profile details...</span>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-8 text-left w-full max-w-none p-4 md:p-6 h-[calc(100vh-6rem)] overflow-y-auto scrollbar-thin pr-1">
            {/* Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-(--text-main) tracking-tight">
                    Account Profile Settings
                </h1>
                <p className="text-(--text-muted) mt-1 text-sm font-medium">
                    Manage your email, username, preferences, and secure credentials.
                </p>
            </div>

            {/* Layout Panels */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* User card column */}
                <div className="md:col-span-1 flex flex-col gap-6">
                    <div className="card surface-soft rounded-[28px] p-6 flex flex-col items-center gap-4 text-center shadow-premium-hover">
                        <div className="h-20 w-20 rounded-full bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] flex items-center justify-center font-bold text-white shadow-md border-2 border-white/10 text-3xl">
                            {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                        </div>

                        <div className="flex flex-col gap-1 min-w-0 w-full">
                            <h2 className="font-extrabold text-(--text-main) text-lg leading-tight truncate px-1">
                                {user.username}
                            </h2>
                            <span className="text-(--text-muted) text-xs font-semibold truncate px-1">{user.email}</span>
                        </div>

                        <div className="w-full border-t border-(--border-color) pt-4 flex flex-col gap-3 text-left">
                            <div className="flex items-center gap-2.5 text-xs text-(--text-muted) font-semibold">
                                <Calendar className="h-4.5 w-4.5 text-(--text-light)" />
                                <span>Joined {moment(user.createdAt).format('LL')}</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-xs text-(--text-muted) font-semibold">
                                <Shield className="h-4.5 w-4.5 text-(--text-light)" />
                                <span className="text-(--color-primary) font-extrabold">Account Verified</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit Form columns */}
                <div className="md:col-span-2 flex flex-col gap-6">
                    {/* Form 1: Edit Profile Details */}
                    <div className="card surface-soft rounded-[28px] p-6 md:p-8 shadow-premium-hover">
                        <div className="flex items-center gap-3 border-b border-(--border-color) pb-4 mb-6">
                            <div className="p-2 bg-(--color-primary)/10 text-(--color-primary) rounded-xl shadow-3xs">
                                <User className="h-5 w-5" />
                            </div>
                            <h2 className="font-extrabold text-(--text-main) text-base md:text-lg">Edit Personal Details</h2>
                        </div>

                        <form onSubmit={handleUpdateProfile} className="flex flex-col gap-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] text-(--text-light) font-extrabold uppercase tracking-wider px-1">Username</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-(--text-light)" />
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="Enter username"
                                            className="w-full pl-11 pr-4 py-3 bg-(--card-bg-solid) border border-(--border-color) focus:border-(--color-primary) rounded-xl outline-none text-(--text-main) placeholder:text-(--text-light) text-sm transition-all shadow-2xs"
                                            required
                                            disabled={updatingProfile}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] text-(--text-light) font-extrabold uppercase tracking-wider px-1">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-(--text-light)" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Enter email address"
                                            className="w-full pl-11 pr-4 py-3 bg-(--card-bg-solid) border border-(--border-color) focus:border-(--color-primary) rounded-xl outline-none text-(--text-main) placeholder:text-(--text-light) text-sm transition-all shadow-2xs"
                                            required
                                            disabled={updatingProfile}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end mt-2">
                                <button
                                    type="submit"
                                    disabled={updatingProfile}
                                    className="btn btn-primary font-bold shadow-md hover:scale-[1.01]"
                                >
                                    {updatingProfile ? 'Saving Details...' : 'Save Profile Changes'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Form 2: Change Password */}
                    <div className="card surface-soft rounded-[28px] p-6 md:p-8 shadow-premium-hover">
                        <div className="flex items-center gap-3 border-b border-(--border-color) pb-4 mb-6">
                            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl shadow-3xs">
                                <Key className="h-5 w-5 animate-pulse" />
                            </div>
                            <h2 className="font-extrabold text-(--text-main) text-base md:text-lg">Change Security Password</h2>
                        </div>

                        <form onSubmit={handleChangePassword} className="flex flex-col gap-5">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] text-(--text-light) font-extrabold uppercase tracking-wider px-1">Current Password</label>
                                <div className="relative">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-(--text-light)" />
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-11 pr-4 py-3 bg-(--card-bg-solid) border border-(--border-color) focus:border-(--color-primary) rounded-xl outline-none text-(--text-main) placeholder:text-(--text-light) text-sm transition-all shadow-2xs"
                                        required
                                        disabled={updatingPassword}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] text-(--text-light) font-extrabold uppercase tracking-wider px-1">New Password</label>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-(--text-light)" />
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-11 pr-4 py-3 bg-(--card-bg-solid) border border-(--border-color) focus:border-(--color-primary) rounded-xl outline-none text-(--text-main) placeholder:text-(--text-light) text-sm transition-all shadow-2xs"
                                            required
                                            disabled={updatingPassword}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] text-(--text-light) font-extrabold uppercase tracking-wider px-1">Confirm New Password</label>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-(--text-light)" />
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-11 pr-4 py-3 bg-(--card-bg-solid) border border-(--border-color) focus:border-(--color-primary) rounded-xl outline-none text-(--text-main) placeholder:text-(--text-light) text-sm transition-all shadow-2xs"
                                            required
                                            disabled={updatingPassword}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end mt-2">
                                <button
                                    type="submit"
                                    disabled={updatingPassword}
                                    className="btn btn-accent font-bold text-xs shadow-md hover:scale-[1.01]"
                                >
                                    {updatingPassword ? 'Changing Password...' : 'Change Account Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProfilePage