'use client';

import AdminLayout from '@/components/AdminLayout';
import { adminApiClient } from '@/lib/admin-api';
import { useAuth } from '@/lib/auth-context';
import { minutesToTime, timeToMinutes } from '@/lib/utils/time';
import { ArrowPathIcon, CalendarIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { format, isBefore, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface MeetingRoom {
  _id: string;
  name: string;
  capacity: number;
}

interface User {
  _id: string;
  email: string;
}

interface BookedSlot {
  startMinutes?: number;
  endMinutes?: number;
  startTime?: string;
  endTime?: string;
  start?: string;
  end?: string;
}

// interface ApiResponse<T> {
//   success: boolean;
//   data: T;
//   error?: { message: string };
// }

interface RoomsResponse {
  rooms: MeetingRoom[];
}

interface UsersResponse {
  users: User[];
}

interface BookedSlotsResponse {
  bookedSlots: BookedSlot[];
}

export default function AdminCreateBookingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('10:00');
  const [purpose, setPurpose] = useState('');
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    setMounted(true);
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoadingData(true);
      try {
        const [roomsResponse, usersResponse] = await Promise.all([adminApiClient.getMeetingRooms(), adminApiClient.getUsers()]);

        if (roomsResponse.success) {
          setRooms((roomsResponse.data as RoomsResponse).rooms);
          if ((roomsResponse.data as RoomsResponse).rooms.length > 0) {
            setSelectedRoom((roomsResponse.data as RoomsResponse).rooms[0]._id);
          }
        }
        if (usersResponse.success) {
          setUsers((usersResponse.data as UsersResponse).users.filter((u: User) => u.email !== user?.email)); // Exclude current admin
          if ((usersResponse.data as UsersResponse).users.length > 0) {
            setSelectedUser((usersResponse.data as UsersResponse).users[0]._id);
          }
        }
      } catch (err) {
        setError('Failed to load initial data.');
        console.error(err);
      } finally {
        setLoadingData(false);
      }
    };
    if (user && user.role === 'ADMIN') {
      fetchInitialData();
    }
  }, [user]);

  useEffect(() => {
    const fetchBookedSlots = async () => {
      setError(null);
      try {
        const response = await adminApiClient.getRoomBookedSlots(selectedRoom, selectedDate);
        console.log('Booked slots response:', response);
        if (response.success && (response.data as BookedSlotsResponse).bookedSlots) {
          setBookedSlots((response.data as BookedSlotsResponse).bookedSlots);
        } else {
          setBookedSlots([]);
        }
      } catch (err) {
        setError('Failed to fetch booked slots.');
        console.error(err);
        setBookedSlots([]);
      }
    };
    if (selectedRoom && selectedDate) {
      fetchBookedSlots();
    }
  }, [selectedRoom, selectedDate]);

  const validateBooking = () => {
    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);

    if (endMin <= startMin) {
      setError('End time must be after start time.');
      return false;
    }

    // const selectedDateTimeStart = parseISO(`${selectedDate}T${startTime}:00`);
    const selectedDateTimeEnd = parseISO(`${selectedDate}T${endTime}:00`);
    const now = new Date();

    if (isBefore(selectedDateTimeEnd, now)) {
      setError('Booking cannot be in the past.');
      return false;
    }

    // Check for overlap with existing bookings
    for (const slot of bookedSlots) {
      const slotStart = slot.startMinutes || 0;
      const slotEnd = slot.endMinutes || 0;

      if (
        (startMin < slotEnd && endMin > slotStart) || // Overlap
        (startMin === slotStart && endMin === slotEnd) // Exact match
      ) {
        setError('Selected time slot overlaps with an existing booking.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const fetchBookedSlots = async () => {
      setError(null);
      try {
        const response = await adminApiClient.getRoomBookedSlots(selectedRoom, selectedDate);
        console.log('Booked slots response:', response);
        if (response.success && (response.data as BookedSlotsResponse).bookedSlots) {
          setBookedSlots((response.data as BookedSlotsResponse).bookedSlots);
        } else {
          setBookedSlots([]);
        }
      } catch (err) {
        setError('Failed to fetch booked slots.');
        console.error(err);
        setBookedSlots([]);
      }
    };

    if (!validateBooking()) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await adminApiClient.createBooking({
        roomId: selectedRoom,
        userId: selectedUser,
        date: selectedDate,
        startTime: startTime,
        endTime: endTime,
        purpose,
      });

      if (response.success) {
        setSuccess('Booking created successfully!');
        setPurpose(''); // Clear form
        fetchBookedSlots(); // Refresh booked slots
      } else {
        setError(response.error?.message || 'Failed to create booking.');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loadingData) {
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
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create New Booking</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manually create a booking for a user</p>
        </div>

        <div className="bg-card shadow rounded-lg border border-border p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {success && (
              <div className="rounded-md bg-green-50 dark:bg-green-900/10 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800 dark:text-green-400">Success</h3>
                    <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                      <p>{success}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/10 p-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="room" className="block text-sm font-medium text-secondary-foreground">
                  Meeting Room
                </label>
                <select id="room" className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-muted text-foreground" value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)} required>
                  {rooms.map((room) => (
                    <option key={room._id} value={room._id}>
                      {room.name} (Capacity: {room.capacity})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="user" className="block text-sm font-medium text-secondary-foreground">
                  Book For User
                </label>
                <select id="user" className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-muted text-foreground" value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} required>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-secondary-foreground">
                Date
              </label>
              {mounted ? <input type="date" id="date" className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-muted text-foreground" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} min={format(new Date(), 'yyyy-MM-dd')} required /> : <input type="date" id="date" className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-muted text-foreground" value="" onChange={(e) => setSelectedDate(e.target.value)} min={format(new Date(), 'yyyy-MM-dd')} required />}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="start-time" className="block text-sm font-medium text-secondary-foreground">
                  Start Time
                </label>
                <input type="time" id="start-time" className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-muted text-foreground" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
              </div>
              <div>
                <label htmlFor="end-time" className="block text-sm font-medium text-secondary-foreground">
                  End Time
                </label>
                <input type="time" id="end-time" className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-muted text-foreground" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
              </div>
            </div>

            {bookedSlots.length > 0 && (
              <div>
                <p className="text-sm font-medium text-secondary-foreground mb-2">Booked Slots for {format(parseISO(selectedDate), 'MMM dd, yyyy')}:</p>
                <div className="flex flex-wrap gap-2">
                  {bookedSlots.map((slot, index) => (
                    <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/10 dark:text-red-400">
                      {slot.start || slot.startTime || minutesToTime(slot.startMinutes || 0)} - {slot.end || slot.endTime || minutesToTime(slot.endMinutes || 0)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label htmlFor="purpose" className="block text-sm font-medium text-secondary-foreground">
                Purpose (Optional)
              </label>
              <textarea id="purpose" rows={3} className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-muted text-foreground" value={purpose} onChange={(e) => setPurpose(e.target.value)}></textarea>
            </div>

            <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:text-sm" disabled={submitting}>
              {submitting ? <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" /> : <CalendarIcon className="h-5 w-5 mr-2" />}
              {submitting ? 'Creating Booking...' : 'Create Booking'}
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
