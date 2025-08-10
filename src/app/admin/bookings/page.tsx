'use client';

import AdminLayout from '@/components/AdminLayout';
import { adminApiClient } from '@/lib/admin-api';
import { useAuth } from '@/lib/auth-context';
import { CalendarIcon, CheckCircleIcon, ExclamationCircleIcon, EyeIcon, MagnifyingGlassIcon, PlusIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Booking {
  _id: string;
  roomId: {
    _id: string;
    name: string;
  };
  userId: {
    _id: string;
    email: string;
  };
  date: string;
  startMinutes: number;
  endMinutes: number;
  purpose?: string;
  status: string;
  reschedule?: {
    requestedBy: string;
    roomId?: string;
    date?: string;
    startMinutes?: number;
    endMinutes?: number;
    requestedAt: string;
  };
  cancelReason?: string;
  rejectReason?: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
}

interface BookingsResponse {
  bookings: Booking[];
}

export default function AdminBookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialBookingId = searchParams.get('id');

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [showConfirmRejectModal, setShowConfirmRejectModal] = useState(false);
  const [confirmRejectAction, setConfirmRejectAction] = useState<'confirm' | 'reject' | 'approve_reschedule' | 'reject_reschedule' | null>(null);
  const [reason, setReason] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !['ADMIN', 'STAFF'].includes(user.role))) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (filterStatus !== 'all') {
          params.status = filterStatus;
        }
        if (searchQuery) {
          params.search = searchQuery;
        }
        if (filterDate) {
          params.dateFrom = filterDate;
          params.dateTo = filterDate;
        }
        const response = await adminApiClient.getBookings(params);
        if (response.success) {
          setBookings((response.data as BookingsResponse).bookings);
        } else {
          setError(response.error?.message || 'Failed to fetch bookings');
        }
      } catch (err) {
        setError('An unexpected error occurred');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user && ['ADMIN', 'STAFF'].includes(user.role)) {
      fetchBookings();
    }
  }, [user, filterStatus, searchQuery, filterDate]);

  useEffect(() => {
    if (initialBookingId && bookings.length > 0) {
      const booking = bookings.find((b) => b._id === initialBookingId);
      if (booking) {
        setCurrentBooking(booking);
      }
    }
  }, [initialBookingId, bookings]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }
      if (filterDate) {
        params.dateFrom = filterDate;
        params.dateTo = filterDate;
      }
      const response = await adminApiClient.getBookings(params);
      if (response.success) {
        setBookings((response.data as BookingsResponse).bookings);
      } else {
        setError(response.error?.message || 'Failed to fetch bookings');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (booking: Booking, action: 'confirm' | 'reject' | 'approve_reschedule' | 'reject_reschedule') => {
    setCurrentBooking(booking);
    setConfirmRejectAction(action);
    setReason('');
    setModalError(null);
    setModalSuccess(null);
    setShowConfirmRejectModal(true);
  };

  const handleAddBooking = () => {
    router.push('/admin/booking');
  };

  const handleSubmitAction = async () => {
    setModalError(null);
    setModalSuccess(null);
    if (!currentBooking || !confirmRejectAction) return;

    try {
      let response;
      if (confirmRejectAction === 'confirm') {
        response = await adminApiClient.confirmBooking(currentBooking._id);
      } else if (confirmRejectAction === 'reject') {
        if (!reason) {
          setModalError('Reason for rejection is required.');
          return;
        }
        response = await adminApiClient.rejectBooking(currentBooking._id, reason);
      } else if (confirmRejectAction === 'approve_reschedule') {
        response = await adminApiClient.approveReschedule(currentBooking._id);
      } else if (confirmRejectAction === 'reject_reschedule') {
        if (!reason) {
          setModalError('Reason for rejecting reschedule is required.');
          return;
        }
        response = await adminApiClient.rejectReschedule(currentBooking._id, reason);
      }

      if (response && response.success) {
        setModalSuccess(`Booking ${confirmRejectAction.replace('_', ' ')} successfully.`);
        setShowConfirmRejectModal(false);
        fetchBookings();
      } else {
        setModalError(response?.error?.message || `Failed to ${confirmRejectAction.replace('_', ' ')} booking.`);
      }
    } catch (err) {
      console.error(err);
      setModalError('An unexpected error occurred.');
    }
  };

  const minutesToTimeAMPM = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/10 dark:text-green-400';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/10 dark:text-yellow-400';
      case 'RESCHEDULE_REQUESTED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/10 dark:text-blue-400';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/10 dark:text-red-400';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/10 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/10 dark:text-gray-400';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !['ADMIN', 'STAFF'].includes(user.role)) {
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
            <h1 className="text-2xl font-bold text-foreground">Booking Management</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage all meeting room bookings</p>
          </div>
          <div className="flex items-center space-x-2">
            {/* Mobile Add Booking Button */}
            <button onClick={handleAddBooking} className="sm:hidden inline-flex items-center justify-center w-10 h-10 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              <PlusIcon className="h-5 w-5" />
            </button>

            {/* Desktop Add Booking Button */}
            <button onClick={handleAddBooking} className="hidden sm:inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Booking
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-card shadow rounded-lg border border-border p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-secondary-foreground">
                Filter by Status
              </label>
              <select id="status-filter" className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-muted text-foreground" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PENDING">Pending</option>
                <option value="RESCHEDULE_REQUESTED">Reschedule Requested</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <div>
              <label htmlFor="date-filter" className="block text-sm font-medium text-secondary-foreground">
                Filter by Date
              </label>
              <input type="date" id="date-filter" className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-muted text-foreground" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
            </div>
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-secondary-foreground">
                Search Bookings
              </label>
              <div className="mt-1 relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input type="text" name="search" id="search" className="block w-full px-3 py-2 pl-10 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-muted text-foreground text-sm" placeholder="Search by room name, user email or purpose" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Booking List */}
        <div className="bg-card shadow rounded-lg border border-border">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-medium text-foreground">All Bookings</h2>
          </div>
          <div className="p-4 lg:p-6">
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
            {bookings.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-foreground">No bookings found</h3>
                <p className="mt-1 text-sm text-muted-foreground">Adjust your filters or add new bookings.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-muted">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Room
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        User
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Time
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
                    {bookings.map((booking) => (
                      <tr key={booking._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-foreground">{booking.roomId.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-foreground">{booking.userId.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{format(parseISO(booking.date), 'MMM dd, yyyy')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {minutesToTimeAMPM(booking.startMinutes)} - {minutesToTimeAMPM(booking.endMinutes)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>{booking.status.replace('_', ' ')}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium ">
                          {booking.status === 'PENDING' && (
                            <>
                              <button onClick={() => handleAction(booking, 'confirm')} className="text-green-600 hover:text-green-800 mr-3" title="Confirm Booking">
                                <CheckCircleIcon className="h-5 w-5" />
                              </button>
                              <button onClick={() => handleAction(booking, 'reject')} className="text-red-600 hover:text-red-800 mr-3" title="Reject Booking">
                                <XCircleIcon className="h-5 w-5" />
                              </button>
                            </>
                          )}
                          {booking.status === 'RESCHEDULE_REQUESTED' && (
                            <>
                              <button onClick={() => handleAction(booking, 'approve_reschedule')} className="text-green-600 hover:text-green-800 mr-3" title="Approve Reschedule">
                                <CheckCircleIcon className="h-5 w-5" />
                              </button>
                              <button onClick={() => handleAction(booking, 'reject_reschedule')} className="text-red-600 hover:text-red-800 mr-3" title="Reject Reschedule">
                                <XCircleIcon className="h-5 w-5" />
                              </button>
                            </>
                          )}
                          <Link href={`/admin/booking/${booking._id}`} className="inline-flex items-center px-2 py-1 border border-border rounded text-primary hover:text-primary/80 hover:bg-gray-50 dark:hover:bg-gray-700 mr-3" title="View Details">
                            <EyeIcon className="h-4 w-4" />
                          </Link>
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

      {/* Confirm/Reject Modal */}
      {showConfirmRejectModal && currentBooking && confirmRejectAction && (
        <div className="fixed inset-0 bg-black/60 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="relative p-8 border border-border bg-card rounded-lg shadow-xl max-w-md w-full mx-auto">
            <h3 className="text-lg font-medium leading-6 text-foreground mb-4">{confirmRejectAction === 'confirm' ? 'Confirm Booking' : confirmRejectAction === 'reject' ? 'Reject Booking' : confirmRejectAction === 'approve_reschedule' ? 'Approve Reschedule' : 'Reject Reschedule'}</h3>
            <div className="mt-2">
              <p className="text-sm text-secondary-foreground mb-4">
                Are you sure you want to {confirmRejectAction.replace('_', ' ')} this booking for <span className="font-semibold">{currentBooking.roomId.name}</span> on <span className="font-semibold">{format(parseISO(currentBooking.date), 'MMM dd, yyyy')}</span>?
              </p>
              {(confirmRejectAction === 'reject' || confirmRejectAction === 'reject_reschedule') && (
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-secondary-foreground">
                    Reason
                  </label>
                  <textarea id="reason" rows={3} className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-muted text-foreground" value={reason} onChange={(e) => setReason(e.target.value)} required></textarea>
                </div>
              )}
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
              <button type="button" className="inline-flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:col-start-2 sm:text-sm" onClick={handleSubmitAction}>
                {confirmRejectAction === 'confirm' ? 'Confirm' : confirmRejectAction === 'reject' ? 'Reject' : confirmRejectAction === 'approve_reschedule' ? 'Approve' : 'Reject'}
              </button>
              <button type="button" className="mt-3 inline-flex w-full justify-center rounded-md border border-border bg-muted px-4 py-2 text-base font-medium text-secondary-foreground shadow-sm hover:bg-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm" onClick={() => setShowConfirmRejectModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
