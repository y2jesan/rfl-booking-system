'use client';

import Layout from '@/components/Layout';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { isValidTimeRange, timeToMinutes } from '@/lib/utils/time';
import { ArrowPathIcon, CalendarIcon, ExclamationCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';
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
    requestedBy: string | { _id: string; email: string };
    roomId?: string | { _id: string; name: string };
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

interface MeetingRoom {
  _id: string;
  name: string;
}

interface BookedSlot {
  bookingId: string;
  start: string;
  end: string;
}

interface BookingResponse {
  booking: Booking;
}

interface BookedSlotsResponse {
  bookedSlots: BookedSlot[];
}

export default function BookingDetailsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [newRescheduleDate, setNewRescheduleDate] = useState<string>('');
  const [newRescheduleStartTime, setNewRescheduleStartTime] = useState<string>('');
  const [newRescheduleEndTime, setNewRescheduleEndTime] = useState<string>('');
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<MeetingRoom[]>([]);
  const [newRescheduleRoomId, setNewRescheduleRoomId] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const response = await apiClient.getBooking(bookingId);
        if (response.success && response.data) {
          const bookingData = (response.data as BookingResponse).booking;
          setBooking(bookingData);
          setNewRescheduleDate(bookingData.date);
          // Convert minutes to HH:mm format for time inputs
          const startHours = Math.floor(bookingData.startMinutes / 60);
          const startMinutes = bookingData.startMinutes % 60;
          const endHours = Math.floor(bookingData.endMinutes / 60);
          const endMinutes = bookingData.endMinutes % 60;

          setNewRescheduleStartTime(`${startHours.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}`);
          setNewRescheduleEndTime(`${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`);
          setNewRescheduleRoomId(bookingData.roomId._id);
        } else {
          setError(response.error?.message || 'Failed to fetch booking details');
        }
      } catch (err) {
        setError('An unexpected error occurred');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user && bookingId) {
      fetchBookingDetails();
    }
  }, [user, bookingId]);

  useEffect(() => {
    const fetchBookedSlotsForReschedule = async () => {
      if (!newRescheduleRoomId || !newRescheduleDate) return;
      setLoadingSlots(true);
      try {
        const response = await apiClient.getBookedSlots(newRescheduleRoomId, newRescheduleDate);
        if (response.success) {
          // Filter out the current booking's original slot if it's not cancelled
          const bookedSlotsData = (response.data as BookedSlotsResponse).bookedSlots;
          const filteredSlots = bookedSlotsData.filter((slot: BookedSlot) => slot.bookingId !== bookingId);
          setBookedSlots(filteredSlots);
        }
      } catch (error) {
        console.error('Error fetching booked slots for reschedule:', error);
      } finally {
        setLoadingSlots(false);
      }
    };
    if (showRescheduleModal && newRescheduleRoomId && newRescheduleDate) {
      fetchBookedSlotsForReschedule();
    }
  }, [bookingId, showRescheduleModal, newRescheduleRoomId, newRescheduleDate]);

  useEffect(() => {
    if (showRescheduleModal) {
      fetchAvailableRooms();
    }
  }, [showRescheduleModal]);

  const fetchBookingDetails = async () => {
    try {
      const response = await apiClient.getBooking(bookingId);
      if (response.success && response.data) {
        const bookingData = (response.data as BookingResponse).booking;
        setBooking(bookingData);
        setNewRescheduleDate(bookingData.date);
        // Convert minutes to HH:mm format for time inputs
        const startHours = Math.floor(bookingData.startMinutes / 60);
        const startMinutes = bookingData.startMinutes % 60;
        const endHours = Math.floor(bookingData.endMinutes / 60);
        const endMinutes = bookingData.endMinutes % 60;

        setNewRescheduleStartTime(`${startHours.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}`);
        setNewRescheduleEndTime(`${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`);
        setNewRescheduleRoomId(bookingData.roomId._id);
      } else {
        setError(response.error?.message || 'Failed to fetch booking details');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableRooms = async () => {
    try {
      const response = await apiClient.getMeetingRooms();
      if (response.success) {
        setAvailableRooms((response.data as { rooms: MeetingRoom[] }).rooms);
      }
    } catch (error) {
      console.error('Error fetching available rooms:', error);
    }
  };

  const isTimeSlotBooked = (start: string, end: string): boolean => {
    const newStartMinutes = timeToMinutes(start);
    const newEndMinutes = timeToMinutes(end);

    for (const slot of bookedSlots) {
      const existingStartMinutes = timeToMinutes(slot.start);
      const existingEndMinutes = timeToMinutes(slot.end);

      if (newStartMinutes < existingEndMinutes && existingStartMinutes < newEndMinutes) {
        return true; // Overlap detected
      }
    }
    return false;
  };

  // const generateTimeOptions = () => {
  //   const options = [];
  //   for (let i = 0; i < 24 * 60; i += 30) {
  //     // 30 minute intervals
  //     const time = minutesToTime(i);
  //     options.push(time);
  //   }
  //   return options;
  // };

  const convertToAMPM = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const minutesToTimeAMPM = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} ${period}`;
  };

  const handleReschedule = async () => {
    setRescheduleError(null);
    if (!newRescheduleRoomId || !newRescheduleDate || !newRescheduleStartTime || !newRescheduleEndTime) {
      setRescheduleError('All reschedule fields are required.');
      return;
    }

    if (!isValidTimeRange(newRescheduleStartTime, newRescheduleEndTime)) {
      setRescheduleError('Start time must be before end time.');
      return;
    }

    if (isTimeSlotBooked(newRescheduleStartTime, newRescheduleEndTime)) {
      setRescheduleError('The selected time slot is already booked.');
      return;
    }

    try {
      const response = await apiClient.rescheduleBooking(bookingId, {
        roomId: newRescheduleRoomId,
        date: newRescheduleDate,
        startTime: newRescheduleStartTime,
        endTime: newRescheduleEndTime,
      });

      if (response.success) {
        setShowRescheduleModal(false);
        fetchBookingDetails(); // Refresh booking details
      } else {
        setRescheduleError(response.error?.message || 'Failed to submit reschedule request.');
      }
    } catch (err) {
      console.error('Reschedule error:', err);
      setRescheduleError('An unexpected error occurred during reschedule.');
    }
  };

  const handleCancel = async () => {
    setCancelError(null);
    if (!cancelReason) {
      setCancelError('Cancellation reason is required.');
      return;
    }

    try {
      const response = await apiClient.cancelBooking(bookingId, cancelReason);
      if (response.success) {
        setShowCancelModal(false);
        fetchBookingDetails(); // Refresh booking details
      } else {
        setCancelError(response.error?.message || 'Failed to cancel booking.');
      }
    } catch (err) {
      console.error('Cancel error:', err);
      setCancelError('An unexpected error occurred during cancellation.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'RESCHEDULE_REQUESTED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirect handled by useEffect
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-12">
          <XCircleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Error</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error}</p>
        </div>
      </Layout>
    );
  }

  if (!booking) {
    return (
      <Layout>
        <div className="text-center py-12">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Booking Not Found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">The booking you are looking for does not exist or you do not have access.</p>
        </div>
      </Layout>
    );
  }

  // const isBookingEditable = booking.status === 'PENDING';
  const isBookingReschedulable = ['CONFIRMED', 'PENDING'].includes(booking.status);
  const isBookingCancellable = !['CANCELLED', 'REJECTED'].includes(booking.status);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Booking Details</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Details for booking ID: {booking._id}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Booking Information</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <strong>Room:</strong> {booking.roomId.name}
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <strong>Date:</strong> {format(parseISO(booking.date), 'MMM dd, yyyy')}
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <strong>Time:</strong> {minutesToTimeAMPM(booking.startMinutes)} - {minutesToTimeAMPM(booking.endMinutes)}
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <strong>Purpose:</strong> {booking.purpose || 'N/A'}
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <strong>Status:</strong>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-2 ${getStatusColor(booking.status)}`}>{booking.status.replace('_', ' ')}</span>
                {booking.status === 'CONFIRMED' && booking.reschedule && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-2 bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">Reschedule: Rejected</span>}
              </p>
              {booking.cancelReason && (
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  <strong>Cancellation Reason:</strong> {booking.cancelReason}
                </p>
              )}
              {booking.rejectReason && (
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  <strong>Rejection Reason:</strong> {booking.rejectReason}
                </p>
              )}
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <strong>Booked By:</strong> {booking.userId.email} ({booking.createdByRole})
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <strong>Booked On:</strong> {format(parseISO(booking.createdAt), 'MMM dd, yyyy hh:mm a')}
              </p>
            </div>

            {booking.reschedule && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Reschedule Request</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  <strong>Requested By:</strong> {typeof booking.reschedule.requestedBy === 'string' ? booking.reschedule.requestedBy : booking.reschedule.requestedBy.email}
                </p>
                {booking.reschedule.roomId && (
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    <strong>New Room:</strong> {typeof booking.reschedule.roomId === 'string' ? booking.reschedule.roomId : booking.reschedule.roomId.name}
                  </p>
                )}
                {booking.reschedule.date && (
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    <strong>New Date:</strong> {format(parseISO(booking.reschedule.date), 'MMM dd, yyyy')}
                  </p>
                )}
                {booking.reschedule.startMinutes !== undefined && booking.reschedule.endMinutes !== undefined && (
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    <strong>New Time:</strong> {minutesToTimeAMPM(booking.reschedule.startMinutes)} - {minutesToTimeAMPM(booking.reschedule.endMinutes)}
                  </p>
                )}
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  <strong>Requested At:</strong> {format(parseISO(booking.reschedule.requestedAt), 'MMM dd, yyyy hh:mm a')}
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-4 justify-end">
            {isBookingReschedulable && (
              <button onClick={() => setShowRescheduleModal(true)} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Reschedule
              </button>
            )}
            {isBookingCancellable && (
              <button onClick={() => setShowCancelModal(true)} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                <XCircleIcon className="h-5 w-5 mr-2" />
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="relative p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-auto">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">Reschedule Booking</h3>
            <div className="mt-2 space-y-4">
              <div>
                <label htmlFor="reschedule-room" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Room
                </label>
                <select id="reschedule-room" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={newRescheduleRoomId} onChange={(e) => setNewRescheduleRoomId(e.target.value)}>
                  <option value="">Select a room</option>
                  {availableRooms.map((room) => (
                    <option key={room._id} value={room._id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="reschedule-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  New Date
                </label>
                {mounted ? <input type="date" id="reschedule-date" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={newRescheduleDate} onChange={(e) => setNewRescheduleDate(e.target.value)} min={format(new Date(), 'yyyy-MM-dd')} /> : <input type="date" id="reschedule-date" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value="" onChange={(e) => setNewRescheduleDate(e.target.value)} min={format(new Date(), 'yyyy-MM-dd')} />}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reschedule-start-time" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    New Start Time
                  </label>
                  <input type="time" id="reschedule-start-time" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={newRescheduleStartTime} onChange={(e) => setNewRescheduleStartTime(e.target.value)} required />
                </div>
                <div>
                  <label htmlFor="reschedule-end-time" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    New End Time
                  </label>
                  <input type="time" id="reschedule-end-time" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={newRescheduleEndTime} onChange={(e) => setNewRescheduleEndTime(e.target.value)} required />
                </div>
              </div>
              {loadingSlots ? (
                <div className="text-center py-2">
                  <ArrowPathIcon className="mx-auto h-6 w-6 animate-spin text-primary" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Loading booked slots...</p>
                </div>
              ) : (
                bookedSlots.length > 0 && (
                  <div className="mb-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Booked Slots for {format(parseISO(newRescheduleDate), 'MMM dd, yyyy')}:</p>
                    <div className="flex flex-wrap gap-1">
                      {bookedSlots.map((slot, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                          {convertToAMPM(slot.start)} - {convertToAMPM(slot.end)}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              )}
              {rescheduleError && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800 dark:text-red-400">{rescheduleError}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
              <button type="button" className="inline-flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:col-start-2 sm:text-sm" onClick={handleReschedule} disabled={!newRescheduleRoomId || !newRescheduleDate || !newRescheduleStartTime || !newRescheduleEndTime || !isValidTimeRange(newRescheduleStartTime, newRescheduleEndTime) || isTimeSlotBooked(newRescheduleStartTime, newRescheduleEndTime)}>
                Submit Reschedule Request
              </button>
              <button type="button" className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm" onClick={() => setShowRescheduleModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="relative p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-auto">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">Cancel Booking</h3>
            <div className="mt-2">
              <div>
                <label htmlFor="cancel-reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Reason for Cancellation
                </label>
                <textarea id="cancel-reason" rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}></textarea>
              </div>
              {cancelError && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 mt-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800 dark:text-red-400">{cancelError}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
              <button type="button" className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm" onClick={handleCancel}>
                Confirm Cancellation
              </button>
              <button type="button" className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm" onClick={() => setShowCancelModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
