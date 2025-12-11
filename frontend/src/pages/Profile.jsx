import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ArrowLeft, Lock, Save, Camera, X, LogOut, FileText, Eye, EyeOff, Trash2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const Profile = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setMessage({ type: '', text: '' });

        try {
            const token = sessionStorage.getItem("quick-notes-token");

            // 1. Upload to Cloudinary
            const formData = new FormData();
            formData.append('file', file);

            const uploadRes = await fetch(`${API_BASE_URL}/api/notes/uploads`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });

            if (!uploadRes.ok) throw new Error('Failed to upload image');
            const uploadData = await uploadRes.json();
            const imageUrl = uploadData.url;
            const publicId = uploadData.public_id;

            // 2. Update User Profile
            const updateRes = await fetch(`${API_BASE_URL}/api/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ profilePic: imageUrl, profilePicPublicId: publicId })
            });

            if (!updateRes.ok) throw new Error('Failed to update profile');

            const updatedUser = await updateRes.json();
            setUser(updatedUser);
            setMessage({ type: 'success', text: 'Profile picture updated!' });

        } catch (error) {
            console.error('Upload error:', error);
            setMessage({ type: 'error', text: error.message || 'Failed to update profile picture' });
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteImage = async () => {
        if (!confirm("Are you sure you want to delete your profile picture?")) return;
        setUploading(true);
        try {
            const token = sessionStorage.getItem("quick-notes-token");
            const response = await fetch(`${API_BASE_URL}/api/users/profile/picture`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to delete profile picture');
            const updatedUser = await response.json();
            setUser(updatedUser);
            setMessage({ type: 'success', text: 'Profile picture removed' });
        } catch (error) {
            console.error('Delete error:', error);
            setMessage({ type: 'error', text: 'Failed to remove picture' });
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = sessionStorage.getItem("quick-notes-token");
                if (!token) {
                    navigate('/login');
                    return;
                }

                const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!response.ok) throw new Error('Failed to fetch profile');

                const data = await response.json();
                setUser(data);
            } catch (error) {
                console.error('Error fetching profile:', error);
                setMessage({ type: 'error', text: 'Failed to load profile' });
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    const handlePasswordChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (passwords.newPassword !== passwords.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        try {
            const token = sessionStorage.getItem("quick-notes-token");
            const response = await fetch(`${API_BASE_URL}/api/users/profile/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: passwords.currentPassword,
                    newPassword: passwords.newPassword
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update password');
            }

            setMessage({ type: 'success', text: 'Password updated successfully' });
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setShowPasswordForm(false);

            // Optional: Logout user to force re-login with new password
            // setTimeout(() => {
            //     sessionStorage.clear();
            //     navigate('/login');
            // }, 2000);

        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        }
    };

    const handleLogout = () => {
        sessionStorage.clear();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-900 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto">
                <button
                    onClick={() => navigate('/notes')}
                    className="flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors"
                >
                    <ArrowLeft size={20} className="mr-2" />
                    Back to Notes
                </button>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Header with Profile Image */}
                    <div className="bg-gray-900 px-6 py-8 text-white relative overflow-hidden flex flex-col items-center">
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-gray-800 rounded-full opacity-50 blur-3xl"></div>

                        <div className="relative z-10 group cursor-pointer mb-4" onClick={() => fileInputRef.current.click()}>
                            <div className="h-28 w-28 rounded-full border-4 border-white/20 overflow-hidden bg-gray-700 flex items-center justify-center shadow-lg relative">
                                {user?.profilePic ? (
                                    <img src={user.profilePic} alt="Profile" className="h-full w-full object-cover" />
                                ) : (
                                    <User size={48} className="text-gray-400" />
                                )}

                                {/* Overlay on hover */}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <Camera size={24} className="text-white" />
                                </div>

                                {uploading && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                                    </div>
                                )}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>

                        {user?.profilePic && (
                            <button
                                onClick={handleDeleteImage}
                                className="absolute top-4 right-4 bg-red-600/80 hover:bg-red-600 text-white p-2 rounded-full transition-colors z-20"
                                title="Remove Profile Picture"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}

                        <h1 className="text-2xl font-bold relative z-10">{user?.name}</h1>
                        <p className="text-gray-300 relative z-10">{user?.email}</p>
                    </div>

                    <div className="p-6 sm:p-8">
                        {message.text && (
                            <div className={`p-4 rounded-lg mb-6 text-sm flex items-center ${message.type === 'error'
                                ? 'bg-red-50 text-red-700 border border-red-100'
                                : 'bg-green-50 text-green-700 border border-green-100'
                                }`}>
                                {message.text}
                            </div>
                        )}

                        {/* Mini Dashboard */}
                        <div className="grid grid-cols-1 gap-4 mb-8">
                            <div className="bg-gray-50 rounded-xl p-4 flex items-center border border-gray-100">
                                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                                    <FileText size={24} className="text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Total Notes</p>
                                    <p className="text-2xl font-bold text-gray-900">{user?.noteCount || 0}</p>
                                </div>
                            </div>
                        </div>

                        {!showPasswordForm ? (
                            <button
                                onClick={() => setShowPasswordForm(true)}
                                className="w-full bg-white border border-gray-200 hover:border-gray-900 text-gray-700 hover:text-gray-900 font-medium py-3 rounded-lg transition-all duration-200 flex items-center justify-center"
                            >
                                Change Password
                            </button>
                        ) : (
                            <div className="animate-fade-in-down">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                    <Lock size={20} className="mr-2 text-gray-500" />
                                    Change Password
                                </h2>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Current Password
                                        </label>
                                        <input
                                            type="password"
                                            name="currentPassword"
                                            value={passwords.currentPassword}
                                            onChange={handlePasswordChange}
                                            required
                                            className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all outline-none"
                                            placeholder="••••••••"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            New Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showNewPassword ? "text" : "password"}
                                                name="newPassword"
                                                value={passwords.newPassword}
                                                onChange={handlePasswordChange}
                                                required
                                                minLength="6"
                                                className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all outline-none pr-10"
                                                placeholder="••••••••"
                                            />
                                            <button
                                                type="button"
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                            >
                                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Confirm New Password
                                        </label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={passwords.confirmPassword}
                                            onChange={handlePasswordChange}
                                            required
                                            minLength="6"
                                            className="block w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all outline-none"
                                            placeholder="••••••••"
                                        />
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowPasswordForm(false);
                                                setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                                setMessage({ type: '', text: '' });
                                            }}
                                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-lg transition-colors flex items-center justify-center"
                                        >
                                            <X size={20} className="mr-2" />
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center"
                                        >
                                            <Save size={20} className="mr-2" />
                                            Save
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {!showPasswordForm && (
                            <button
                                onClick={handleLogout}
                                className="w-full mt-4 bg-white border border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 font-medium py-3 rounded-lg transition-all duration-200 flex items-center justify-center"
                            >
                                <LogOut size={20} className="mr-2" />
                                Log Out
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
