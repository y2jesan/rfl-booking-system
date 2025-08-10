'use client';

import AdminLayout from '@/components/AdminLayout';
import Tooltip from '@/components/Tooltip';
import { adminApiClient } from '@/lib/admin-api';
import { useAuth } from '@/lib/auth-context';
import { CheckCircleIcon, ExclamationCircleIcon, KeyIcon, MagnifyingGlassIcon, NoSymbolIcon, PencilIcon, PlusIcon, UsersIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface User {
  _id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface CreateUserResponse {
  user: {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: string;
  };
  generatedPassword: string;
  message: string;
}

interface ResetPasswordResponse {
  message: string;
  newPassword: string;
}

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState('USER');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [passwordModalTitle, setPasswordModalTitle] = useState('');
  const [passwordModalMessage, setPasswordModalMessage] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (searchQuery) {
          params.search = searchQuery;
        }

        const response = await adminApiClient.getUsers(params);
        if (response.success && response.data) {
          const data = response.data as { users: User[] };
          setUsers(data.users || []);
        } else {
          setError(response.error?.message || 'Failed to fetch users');
        }
      } catch (err) {
        setError('An unexpected error occurred');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user && user.role === 'ADMIN') {
      fetchUsers();
    }
  }, [user, searchQuery]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await adminApiClient.getUsers(params);
      if (response.success && response.data) {
        const data = response.data as { users: User[] };
        setUsers(data.users || []);
      } else {
        setError(response.error?.message || 'Failed to fetch users');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setCurrentUser(null);
    setFormEmail('');
    setFormRole('USER');
    setModalError(null);
    setModalSuccess(null);
    setShowAddEditModal(true);
  };

  const handleEditUser = (user: User) => {
    setCurrentUser(user);
    setFormEmail(user.email);
    setFormRole(user.role);
    setModalError(null);
    setModalSuccess(null);
    setShowAddEditModal(true);
  };

  const handleToggleUser = (user: User) => {
    setCurrentUser(user);
    setModalError(null);
    setModalSuccess(null);
    setShowToggleModal(true);
  };

  const handleResetPassword = (user: User) => {
    setCurrentUser(user);
    setModalError(null);
    setModalSuccess(null);
    setShowResetPasswordModal(true);
  };

  const handleSubmitAddEdit = async () => {
    setModalError(null);
    setModalSuccess(null);
    if (!formEmail || !formRole) {
      setModalError('Email and Role are required.');
      return;
    }

    try {
      let response;
      if (currentUser) {
        response = await adminApiClient.updateUser(currentUser._id, { email: formEmail, role: formRole });
        if (response.success) {
          setModalSuccess('User updated successfully.');
          setShowAddEditModal(false);
          fetchUsers();
        } else {
          setModalError(response.error?.message || 'Failed to update user.');
        }
      } else {
        response = await adminApiClient.createUser({ email: formEmail, role: formRole as 'ADMIN' | 'STAFF' | 'USER' });
        if (response.success && response.data) {
          const data = response.data as CreateUserResponse;
          setGeneratedPassword(data.generatedPassword);
          setPasswordModalTitle('User Created Successfully');
          setPasswordModalMessage(`User ${data.user.email} has been created with the following password:`);
          setShowAddEditModal(false);
          setShowPasswordModal(true);
          fetchUsers();
        } else {
          setModalError(response.error?.message || 'Failed to create user.');
        }
      }
    } catch (err) {
      console.error(err);
      setModalError('An unexpected error occurred.');
    }
  };

  const handleSubmitToggle = async () => {
    setModalError(null);
    setModalSuccess(null);
    if (!currentUser) return;

    try {
      const response = await adminApiClient.toggleUserStatus(currentUser._id);
      if (response.success) {
        setModalSuccess(`User ${currentUser.isActive ? 'deactivated' : 'activated'} successfully.`);
        setShowToggleModal(false);
        fetchUsers();
      } else {
        setModalError(response.error?.message || 'Failed to update user status.');
      }
    } catch (err) {
      console.error(err);
      setModalError('An unexpected error occurred.');
    }
  };

  const handleSubmitResetPassword = async () => {
    setModalError(null);
    setModalSuccess(null);
    if (!currentUser) {
      setModalError('User is required.');
      return;
    }

    try {
      const response = await adminApiClient.resetUserPassword(currentUser._id);
      if (response.success && response.data) {
        const data = response.data as ResetPasswordResponse;
        setGeneratedPassword(data.newPassword);
        setPasswordModalTitle('Password Reset Successfully');
        setPasswordModalMessage(`New password for ${currentUser.email}:`);
        setShowResetPasswordModal(false);
        setShowPasswordModal(true);
      } else {
        setModalError(response.error?.message || 'Failed to reset password.');
      }
    } catch (err) {
      console.error(err);
      setModalError('An unexpected error occurred.');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <ExclamationCircleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-lg font-medium text-foreground">Access Denied</h3>
          <p className="mt-1 text-sm text-muted-foreground">You do not have permission to view this page.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">User Management</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage system users and their roles</p>
          </div>
          <div className="flex items-center space-x-2">
            {/* Mobile Add User Button */}
            <button onClick={handleAddUser} className="sm:hidden inline-flex items-center justify-center w-10 h-10 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              <PlusIcon className="h-5 w-5" />
            </button>

            {/* Desktop Add User Button */}
            <button onClick={handleAddUser} className="hidden sm:inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              <PlusIcon className="h-5 w-5 mr-2" />
              Add User
            </button>
          </div>
        </div>

        {/* User List */}
        <div className="bg-card shadow rounded-lg border border-border">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-medium text-foreground">All Users</h2>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input type="text" className="block w-48 sm:w-64 pl-10 pr-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-muted text-foreground text-sm" placeholder="Search users by email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
          <div className="p-6">
            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/10 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-400">Error</h3>
                    <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {modalSuccess && (
              <div className="rounded-md bg-green-50 dark:bg-green-900/10 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800 dark:text-green-400">Success</h3>
                    <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                      <p>{modalSuccess}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {users.length === 0 ? (
              <div className="text-center py-8">
                <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-foreground">No users found</h3>
                <p className="mt-1 text-sm text-muted-foreground">Add new users to the system.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-muted">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Role
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Created At
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-gray-200 dark:divide-gray-700">
                    {users.map((user) => (
                      <tr key={user._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-foreground">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary/10 text-primary">{user.role}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{format(new Date(user.createdAt), 'MMM dd, yyyy hh:mm a')}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/10 dark:text-green-400' : 'bg-primary/10 text-primary'}`}>{user.isActive ? 'Active' : 'Inactive'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium ">
                          <div className="flex items-center space-x-2">
                            <Tooltip content="Edit User">
                              <button onClick={() => handleEditUser(user)} className="text-primary hover:text-primary/80">
                                <PencilIcon className="h-5 w-5" />
                              </button>
                            </Tooltip>
                            <Tooltip content="Reset Password">
                              <button onClick={() => handleResetPassword(user)} className="text-yellow-600 hover:text-yellow-800">
                                <KeyIcon className="h-5 w-5" />
                              </button>
                            </Tooltip>
                            <Tooltip content={user.isActive ? 'Deactivate User' : 'Activate User'}>
                              <button onClick={() => handleToggleUser(user)} className={`${user.isActive ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}>
                                {user.isActive ? <NoSymbolIcon className="h-5 w-5" /> : <CheckCircleIcon className="h-5 w-5" />}
                              </button>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit User Modal */}
      {showAddEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="relative p-8 bg-card rounded-lg shadow-xl max-w-md w-full mx-auto">
            <h3 className="text-lg font-medium leading-6 text-foreground mb-4">{currentUser ? 'Edit User' : 'Add New User'}</h3>
            <div className="mt-2 space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-secondary-foreground">
                  Email
                </label>
                <input type="email" id="email" className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-muted text-foreground" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} required />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-secondary-foreground">
                  Role
                </label>
                <select id="role" className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-muted text-foreground" value={formRole} onChange={(e) => setFormRole(e.target.value)}>
                  <option value="USER">User</option>
                  <option value="STAFF">Staff</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              {modalError && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/10 p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800 dark:text-red-400">{modalError}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
              <button type="button" className="inline-flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:col-start-2 sm:text-sm" onClick={handleSubmitAddEdit}>
                {currentUser ? 'Save Changes' : 'Add User'}
              </button>
              <button type="button" className="mt-3 inline-flex w-full justify-center rounded-md border border-border bg-muted px-4 py-2 text-base font-medium text-secondary-foreground shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm" onClick={() => setShowAddEditModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle User Status Modal */}
      {showToggleModal && currentUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="relative p-8 bg-card rounded-lg shadow-xl max-w-md w-full mx-auto">
            <h3 className="text-lg font-medium leading-6 text-foreground mb-4">{currentUser.isActive ? 'Deactivate User' : 'Activate User'}</h3>
            <div className="mt-2">
              <p className="text-sm text-secondary-foreground">
                Are you sure you want to {currentUser.isActive ? 'deactivate' : 'activate'} user <span className="font-semibold">{currentUser.email}</span>?{currentUser.isActive ? ' Deactivated users cannot access the system.' : ' Activated users can access the system again.'}
              </p>
              {modalError && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/10 p-3 mt-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800 dark:text-red-400">{modalError}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
              <button type="button" className={`inline-flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-base font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:col-start-2 sm:text-sm ${currentUser.isActive ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'}`} onClick={handleSubmitToggle}>
                {currentUser.isActive ? 'Deactivate User' : 'Activate User'}
              </button>
              <button type="button" className="mt-3 inline-flex w-full justify-center rounded-md border border-border bg-muted px-4 py-2 text-base font-medium text-secondary-foreground shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm" onClick={() => setShowToggleModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && currentUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="relative p-8 bg-card rounded-lg shadow-xl max-w-md w-full mx-auto">
            <h3 className="text-lg font-medium leading-6 text-foreground mb-4">Reset Password for {currentUser.email}</h3>
            <div className="mt-2 space-y-4">
              <div>
                <p className="text-sm text-secondary-foreground">This will generate a new random password for the user. The new password will be displayed after the reset is complete.</p>
              </div>
              {modalError && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/10 p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800 dark:text-red-400">{modalError}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
              <button type="button" className="inline-flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:col-start-2 sm:text-sm" onClick={handleSubmitResetPassword}>
                Reset Password
              </button>
              <button type="button" className="mt-3 inline-flex w-full justify-center rounded-md border border-border bg-muted px-4 py-2 text-base font-medium text-secondary-foreground shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm" onClick={() => setShowResetPasswordModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Generated Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="relative p-8 bg-card rounded-lg shadow-xl max-w-md w-full mx-auto">
            <h3 className="text-lg font-medium leading-6 text-foreground mb-4">{passwordModalTitle}</h3>
            <div className="mt-2 space-y-4">
              <div>
                <p className="text-sm text-secondary-foreground mb-2">{passwordModalMessage}</p>
                <div className="flex items-center space-x-2">
                  <input type="text" id="generated-password" className="flex-1 px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-muted text-foreground font-mono text-sm" value={generatedPassword} readOnly />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedPassword);
                      setModalSuccess('Password copied to clipboard!');
                    }}
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-600 text-secondary-foreground rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-primary">
                    Copy
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Please save this password securely. It will not be shown again.</p>
              </div>
              {modalError && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/10 p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800 dark:text-red-400">{modalError}</p>
                    </div>
                  </div>
                </div>
              )}
              {modalSuccess && (
                <div className="rounded-md bg-green-50 dark:bg-green-900/10 p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800 dark:text-green-400">{modalSuccess}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
              <button type="button" className="inline-flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:col-start-2 sm:text-sm" onClick={() => setShowPasswordModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
