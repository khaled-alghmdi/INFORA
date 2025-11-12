'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isPasswordResetMode, setIsPasswordResetMode] = useState(false);
  const [resetUserEmail, setResetUserEmail] = useState('');

  useEffect(() => {
    // Check if user came from password reset email link
    const checkPasswordReset = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // User came from email reset link
        setIsPasswordResetMode(true);
        setResetUserEmail(session.user.email || '');
      }
    };

    checkPasswordReset();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Check if user exists in our users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        setError('Invalid email or password');
        setIsLoading(false);
        return;
      }

      if (!userData.is_active) {
        setError('Your account has been deactivated. Please contact the administrator.');
        setIsLoading(false);
        return;
      }

      // Verify password
      if (userData.initial_password) {
        if (password !== userData.initial_password) {
          setError('Invalid email or password');
          setIsLoading(false);
          return;
        }

        // Check if user has already changed their password
        // Only force password change if they haven't changed it yet
        if (!userData.password_changed_at) {
          // First time login - force password change
          setCurrentUserData(userData);
          setShowPasswordChange(true);
          setIsLoading(false);
          return;
        }

        // Password already changed before - allow login
        // Store user session in localStorage
        localStorage.setItem('infora_user', JSON.stringify(userData));
        
        // Redirect to dashboard
        router.push('/');
        return;
      } else {
        setError('No password set for this account. Please contact the administrator.');
        setIsLoading(false);
        return;
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate new password
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (currentUserData && newPassword === currentUserData.initial_password) {
      setError('New password must be different from your initial password');
      return;
    }

    setIsLoading(true);

    try {
      // Update password and mark as changed
      const { data, error: updateError } = await supabase
        .from('users')
        .update({ 
          initial_password: newPassword,
          password_changed_at: new Date().toISOString()
        })
        .eq('id', currentUserData.id)
        .select()
        .single();

      if (updateError) {
        console.error('Update error:', updateError);
        
        // Fallback
        const { error: fallbackError } = await supabase
          .from('users')
          .update({ 
            initial_password: newPassword,
            password_changed_at: new Date().toISOString()
          })
          .eq('email', currentUserData.email);
        
        if (fallbackError) {
          setError('Failed to update password. Please contact your administrator.');
          setIsLoading(false);
          return;
        }
      }

      // Update user data with new password and timestamp
      const updatedUserData = {
        ...currentUserData,
        initial_password: newPassword,
        password_changed_at: new Date().toISOString(),
      };

      // Store user session in localStorage
      localStorage.setItem('infora_user', JSON.stringify(updatedUserData));
      
      // Redirect to dashboard
      router.push('/');
    } catch (err) {
      console.error('Password change error:', err);
      setError('An error occurred. Please contact your administrator.');
      setIsLoading(false);
    }
  };

  const handleEmailVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Check if user exists in our users table first
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', forgotEmail)
        .single();

      if (userError || !userData) {
        setError('No account found with this email address');
        setIsLoading(false);
        return;
      }

      // Use Supabase Auth to send password reset email
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        forgotEmail,
        {
          redirectTo: `${window.location.origin}/login`,
        }
      );

      if (resetError) {
        console.error('Reset error:', resetError);
        setError('Failed to send reset email. Please try again or contact your administrator.');
        setIsLoading(false);
        return;
      }

      // Show success message
      setResetSuccess(true);
      setIsLoading(false);
    } catch (err) {
      console.error('Email verification error:', err);
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };


  const handleCloseForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotEmail('');
    setResetSuccess(false);
    setError('');
  };

  // Forgot Password Modal - Contact Admin Message
  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 dark:bg-blue-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-200 dark:bg-indigo-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-md w-full space-y-8 animate-fade-in-up">
            {/* Title */}
            <div className="text-center">
              <div className="flex justify-center mb-8">
                <div className="relative bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xl ring-1 ring-gray-900/5 dark:ring-white/10">
                  <Mail className="w-16 h-16 text-blue-600" />
                </div>
              </div>
              <h2 className="text-4xl font-extrabold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent mb-3">
                Forgot Password?
              </h2>
              <p className="text-base text-gray-600 dark:text-gray-400 font-medium">
                Please contact your administrator for assistance
              </p>
            </div>

            {/* Contact Administrator Message */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-2xl p-8 shadow-lg">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 dark:bg-blue-500 rounded-full mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Contact Your Administrator
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  To reset your password, please reach out to:
                </p>
              </div>

              {/* Admin Contact Info */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-blue-200 dark:border-blue-800 shadow-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Administrator Email</p>
                    <a
                      href="mailto:Bayan.khudhari@tamergroup.com"
                      className="text-lg font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors break-all"
                    >
                      Bayan.khudhari@tamergroup.com
                    </a>
                  </div>
                </div>

                {/* Copy Email Button */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('Bayan.khudhari@tamergroup.com');
                    alert('Email address copied to clipboard!');
                  }}
                  className="w-full py-3 px-4 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Copy Email Address</span>
                </button>
              </div>

              {/* Instructions */}
              <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-xl p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium">
                  💡 <strong>Note:</strong> The administrator will reset your password and provide you with temporary credentials.
                </p>
              </div>
            </div>

            {/* Back to Login */}
            <div className="text-center pt-6">
              <button
                onClick={handleCloseForgotPassword}
                className="group relative w-full flex justify-center items-center space-x-3 py-4 px-6 rounded-xl text-white font-bold text-lg bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 hover:from-green-700 hover:via-emerald-700 hover:to-green-800 shadow-lg hover:shadow-2xl hover:shadow-green-500/50 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              >
                <LogIn className="w-6 h-6" />
                <span>Back to Login</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Password change modal/screen
  if (showPasswordChange) {
    return (
      <div className="min-h-screen flex relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-10 w-72 h-72 bg-green-200 dark:bg-green-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-emerald-200 dark:bg-emerald-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>

        {/* Password Change Form */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-md w-full space-y-8 animate-fade-in-up">
            {/* Title */}
            <div className="text-center">
              <div className="flex justify-center mb-8">
                <div className="relative bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xl ring-1 ring-gray-900/5 dark:ring-white/10">
                  <Lock className="w-16 h-16 text-green-600" />
                </div>
              </div>
              <h2 className="text-4xl font-extrabold bg-gradient-to-r from-gray-900 via-green-800 to-emerald-900 dark:from-white dark:via-green-400 dark:to-emerald-400 bg-clip-text text-transparent mb-3">
                Change Your Password
              </h2>
              <p className="text-base text-gray-600 dark:text-gray-400 font-medium">
                For security, please change your initial password
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-xl p-4 flex items-start space-x-3 backdrop-blur-sm animate-shake">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-300 font-medium">{error}</p>
              </div>
            )}

            {/* Password Change Form */}
            <form className="mt-8 space-y-6" onSubmit={handlePasswordChange}>
              <div className="space-y-5">
                {/* New Password Field */}
                <div className="group">
                  <label htmlFor="new-password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                    </div>
                    <input
                      id="new-password"
                      name="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="block w-full pl-12 pr-12 py-3.5 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-900 dark:text-white placeholder-gray-400 shadow-sm hover:border-green-400 dark:hover:border-green-600"
                      placeholder="At least 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center hover:scale-110 transition-transform"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div className="group">
                  <label htmlFor="confirm-password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                    </div>
                    <input
                      id="confirm-password"
                      name="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full pl-12 pr-12 py-3.5 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-900 dark:text-white placeholder-gray-400 shadow-sm hover:border-green-400 dark:hover:border-green-600"
                      placeholder="Re-enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center hover:scale-110 transition-transform"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">Password Requirements:</p>
                <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                  <li className="flex items-center space-x-2">
                    <span className={newPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'}>
                      {newPassword.length >= 8 ? '✓' : '○'}
                    </span>
                    <span>At least 8 characters</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className={newPassword === confirmPassword && newPassword ? 'text-green-600' : 'text-gray-400'}>
                      {newPassword === confirmPassword && newPassword ? '✓' : '○'}
                    </span>
                    <span>Passwords match</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className={newPassword && newPassword !== currentUserData?.initial_password ? 'text-green-600' : 'text-gray-400'}>
                      {newPassword && newPassword !== currentUserData?.initial_password ? '✓' : '○'}
                    </span>
                    <span>Different from initial password</span>
                  </li>
                </ul>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`group relative w-full flex justify-center items-center space-x-3 py-4 px-6 rounded-xl text-white font-bold text-lg transition-all duration-300 ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 hover:from-green-700 hover:via-emerald-700 hover:to-green-800 shadow-lg hover:shadow-2xl hover:shadow-green-500/50 transform hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-6 h-6" />
                    <span>Change Password</span>
                  </>
                )}
              </button>
            </form>

            {/* Info Message */}
            <div className="text-center pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This is a one-time security measure to protect your account
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"></div>
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-200 dark:bg-green-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-emerald-200 dark:bg-emerald-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-20 left-1/2 w-72 h-72 bg-teal-200 dark:bg-teal-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-md w-full space-y-8 animate-fade-in-up">
          {/* Logo and Title */}
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full blur-lg group-hover:blur-xl transition-all duration-300 opacity-30"></div>
                <div className="relative bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xl ring-1 ring-gray-900/5 dark:ring-white/10">
                  <Image
                    src="/Tamer_logo.png"
                    alt="Tamer Logo"
                    width={90}
                    height={90}
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
            <h2 className="text-5xl font-extrabold bg-gradient-to-r from-gray-900 via-green-800 to-emerald-900 dark:from-white dark:via-green-400 dark:to-emerald-400 bg-clip-text text-transparent mb-3">
              Welcome 
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-400 font-medium">
              
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-xl p-4 flex items-start space-x-3 backdrop-blur-sm animate-shake">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-300 font-medium">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-5">
              {/* Email Field */}
              <div className="group">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-900 dark:text-white placeholder-gray-400 shadow-sm hover:border-green-400 dark:hover:border-green-600"
                    placeholder="you@tamergroup.com"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="group">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-12 pr-12 py-3.5 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-900 dark:text-white placeholder-gray-400 shadow-sm hover:border-green-400 dark:hover:border-green-600"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:scale-110 transition-transform"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded transition-all hover:scale-110"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300 font-medium cursor-pointer hover:text-green-600 transition-colors">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="font-semibold text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300 transition-colors underline-offset-4 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center items-center space-x-3 py-4 px-6 rounded-xl text-white font-bold text-lg transition-all duration-300 ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 hover:from-green-700 hover:via-emerald-700 hover:to-green-800 shadow-lg hover:shadow-2xl hover:shadow-green-500/50 transform hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 group-hover:animate-shimmer"></div>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  <span>Sign In</span>
                  <svg className="w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Contact Admin Message */}
          <div className="text-center pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don&apos;t have an account?{' '}
              <span className="font-bold text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors cursor-default">
                Contact your administrator
              </span>
            </p>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
            <p className="font-medium">© 2025 Tamer Consumer Company.</p>
          </div>
        </div>
      </div>

      {/* Right Side - Enhanced Branding */}
      <div className="hidden lg:flex lg:w-1/3 relative overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700 animate-gradient-shift"></div>
        
        {/* Mesh Gradient Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)] animate-pulse-slow"></div>
        
        {/* Glassmorphism Container */}
        <div className="relative z-10 flex flex-col justify-center items-center text-white px-12 w-full">
          {/* Logo with Advanced Effects */}
          <div className="mb-12 animate-float">
            <div className="relative group">
              {/* Glow Effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-green-400 via-emerald-300 to-teal-400 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500 animate-pulse-slow"></div>
              
              {/* Logo Container */}
              <div className="relative w-40 h-40 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/30 shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                <Image
                  src="/Tamer_logo.png"
                  alt="Tamer Logo"
                  width={96}
                  height={96}
                  className="object-contain drop-shadow-2xl"
                />
              </div>
            </div>
          </div>

          {/* Brand Name with Gradient */}
          <h1 className="text-7xl font-black mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-white via-green-100 to-emerald-100 bg-clip-text text-transparent drop-shadow-2xl animate-gradient-text">
              INFORA
            </span>
          </h1>

          {/* Tagline */}
          <p className="text-2xl text-white/90 text-center max-w-lg font-semibold tracking-wide">
            IT Device Inventory Management System
          </p>
        </div>
        
        {/* Enhanced Decorative Elements */}
        <div className="absolute top-10 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-emerald-300/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-teal-300/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"></div>
      </div>
    </div>
  );
};

export default LoginPage;

