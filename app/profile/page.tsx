'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import PageHeader from '@/components/PageHeader';
import { getCurrentUser, logout } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { User, Mail, Building, Shield, Calendar, Edit2, Save, X, Camera, Trash2 } from 'lucide-react';
import Image from 'next/image';

const ProfilePage = () => {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    department: '',
    phone: '',
  });

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);
    loadUserData();
  }, [router]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const user = getCurrentUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        // Parse full_name into separate fields
        const nameParts = (data.full_name || '').trim().split(/\s+/);
        let first_name = '';
        let middle_name = '';
        let last_name = '';

        if (nameParts.length === 1) {
          first_name = nameParts[0];
        } else if (nameParts.length === 2) {
          first_name = nameParts[0];
          last_name = nameParts[1];
        } else if (nameParts.length >= 3) {
          first_name = nameParts[0];
          middle_name = nameParts.slice(1, -1).join(' ');
          last_name = nameParts[nameParts.length - 1];
        }

        setFormData({
          first_name,
          middle_name,
          last_name,
          email: data.email || '',
          department: data.department || '',
          phone: '', // Phone field removed - not in schema
        });
        setCurrentUser(data);
        setProfileImageUrl(data.profile_image || null);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const user = getCurrentUser();
      if (!user) {
        alert('User not found. Please log in again.');
        return;
      }

      // Combine name fields into full_name
      const middlePart = formData.middle_name.trim() ? ` ${formData.middle_name.trim()}` : '';
      const full_name = `${formData.first_name.trim()}${middlePart} ${formData.last_name.trim()}`.trim();

      // Prepare update data
      const updateData: any = {
        full_name: full_name,
        department: formData.department || null,
      };

      // Include profile_image if it was updated
      if (imagePreview) {
        updateData.profile_image = imagePreview;
      }

      const { error, data } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        alert(`Failed to save profile: ${error.message}`);
        return;
      }

      // Reload user data to get updated full_name
      const { data: updatedData, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching updated user:', fetchError);
      }

      // Update local storage
      const updatedUser = {
        ...currentUser,
        ...formData,
        profile_image: imagePreview || profileImageUrl || null,
        full_name: updatedData?.full_name || `${formData.first_name} ${formData.middle_name ? formData.middle_name + ' ' : ''}${formData.last_name}`.trim(),
      };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      
      if (imagePreview) {
        setProfileImageUrl(imagePreview);
        setImagePreview(null);
      }
      
      setIsEditing(false);
      alert('Profile saved successfully!');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      alert(`Failed to save profile: ${error.message || 'Please try again.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    loadUserData();
    setIsEditing(false);
    setImagePreview(null);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 2MB for base64 storage)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB');
      return;
    }

    try {
      setIsUploadingImage(true);
      const user = getCurrentUser();
      if (!user) return;

      // Convert image to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = reader.result as string;
          
          // Set preview immediately (don't save to DB yet, wait for Save button)
          setImagePreview(base64String);
          setIsUploadingImage(false);
        } catch (err: any) {
          console.error('Error processing image:', err);
          alert('Failed to process image. Please try again.');
          setIsUploadingImage(false);
          setImagePreview(null);
        }
      };

      reader.onerror = () => {
        alert('Failed to read image file');
        setIsUploadingImage(false);
        setImagePreview(null);
      };

      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
      setImagePreview(null);
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    try {
      const user = getCurrentUser();
      if (!user || !profileImageUrl) return;

      // Update user record to remove image
      const { error } = await supabase
        .from('users')
        .update({ profile_image: null })
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      setProfileImageUrl(null);
      setImagePreview(null);
      const updatedUser = { ...currentUser, profile_image: null };
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    } catch (error: any) {
      console.error('Error removing image:', error);
      alert('Failed to remove image. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="ml-20 flex-1 min-h-screen p-8 transition-all duration-300">
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading profile...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-20 flex-1 min-h-screen p-8 transition-all duration-300">
        <PageHeader
          title="My Profile"
          description="View and edit your profile information"
        />

        <div className="max-w-4xl mx-auto mt-8">
          {/* Profile Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-gray-200 dark:border-gray-700 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div className="relative h-20 w-20 bg-gradient-to-br from-green-600 to-emerald-700 rounded-full flex items-center justify-center shadow-lg ring-4 ring-green-400/20 overflow-hidden">
                    {(imagePreview || profileImageUrl) ? (
                      <Image
                        src={imagePreview || profileImageUrl || ''}
                        alt={currentUser?.full_name || 'User'}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-3xl">
                        {currentUser?.full_name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  {isEditing && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <label className="cursor-pointer">
                        <Camera className="w-6 h-6 text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={isUploadingImage}
                        />
                      </label>
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentUser?.full_name || 'User'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{currentUser?.email || ''}</p>
                </div>
              </div>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  {profileImageUrl && (
                    <button
                      onClick={handleRemoveImage}
                      className="p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg"
                      title="Remove profile image"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={handleCancel}
                    className="p-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all shadow-md hover:shadow-lg"
                    title="Cancel"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="p-2.5 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    title={isSaving ? 'Saving...' : 'Save Changes'}
                  >
                    <Save className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Profile Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  First Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                ) : (
                  <p className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-gray-900 dark:text-white">
                    {formData.first_name || 'Not set'}
                  </p>
                )}
              </div>

              {/* Middle Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Middle Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.middle_name}
                    onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-gray-900 dark:text-white">
                    {formData.middle_name || 'Not set'}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Last Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                ) : (
                  <p className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-gray-900 dark:text-white">
                    {formData.last_name || 'Not set'}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </label>
                <p className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-gray-900 dark:text-white">
                  {formData.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed</p>
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Building className="w-4 h-4 inline mr-2" />
                  Department
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-gray-900 dark:text-white">
                    {formData.department || 'Not set'}
                  </p>
                )}
              </div>

            </div>

            {/* Additional Info */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Role</p>
                    <p className="font-semibold text-gray-900 dark:text-white capitalize">
                      {currentUser?.role || 'User'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Employee ID</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {currentUser?.employee_id || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;

