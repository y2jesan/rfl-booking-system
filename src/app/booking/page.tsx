'use client';

import Layout from '@/components/Layout';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { isValidTimeRange, timeToMinutes } from '@/lib/utils/time';
import { ArrowPathIcon, BuildingOfficeIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface MeetingRoom {
  _id: string;
  name: string;
  capacity: number;
  images: Array<{
    url: string;
  }>;
}

interface BookedSlot {
  start: string;
  end: string;
  bookingId: string;
  status: string;
}

interface RoomsResponse {
  rooms: MeetingRoom[];
}

interface BookedSlotsResponse {
  bookedSlots: BookedSlot[];
}

export default function BookingWizardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRoomId = searchParams.get('roomId');

  const [step, setStep] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState<MeetingRoom | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedStartTime, setSelectedStartTime] = useState<string>('');
  const [selectedEndTime, setSelectedEndTime] = useState<string>('');
  const [purpose, setPurpose] = useState('');
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchRooms();
    }
  }, [user]);

  useEffect(() => {
    if (initialRoomId && rooms.length > 0) {
      const room = rooms.find((r) => r._id === initialRoomId);
      if (room) {
        setSelectedRoom(room);
        setStep(2); // Skip to date selection if room is pre-selected
      }
    }
  }, [initialRoomId, rooms]);

  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!selectedRoom || !selectedDate) return;
      setLoadingSlots(true);
      try {
        const response = await apiClient.getBookedSlots(selectedRoom._id, selectedDate);
        if (response.success) {
          setBookedSlots((response.data as BookedSlotsResponse).bookedSlots);
        }
      } catch (error) {
        console.error('Error fetching booked slots:', error);
      } finally {
        setLoadingSlots(false);
      }
    };
    if (selectedRoom && selectedDate) {
      fetchBookedSlots();
    }
  }, [selectedRoom, selectedDate]);

  const fetchRooms = async () => {
    try {
      const response = await apiClient.getMeetingRooms();
      if (response.success) {
        setRooms((response.data as RoomsResponse).rooms);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleRoomSelect = (room: MeetingRoom) => {
    setSelectedRoom(room);
    setStep(2);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
    setSelectedStartTime('');
    setSelectedEndTime('');
    setBookingError(null);
  };

  const handleTimeChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') {
      setSelectedStartTime(value);
    } else {
      setSelectedEndTime(value);
    }
    setBookingError(null);
  };

  const convertToAMPM = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
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

  const handleBookingSubmit = async () => {
    setBookingError(null);
    setSuccessMessage(null);

    if (!selectedRoom || !selectedDate || !selectedStartTime || !selectedEndTime) {
      setBookingError('Please fill all required fields.');
      return;
    }

    if (!isValidTimeRange(selectedStartTime, selectedEndTime)) {
      setBookingError('Start time must be before end time.');
      return;
    }

    if (isTimeSlotBooked(selectedStartTime, selectedEndTime)) {
      setBookingError('The selected time slot is already booked.');
      return;
    }

    try {
      const response = await apiClient.createBooking({
        roomId: selectedRoom._id,
        date: selectedDate,
        startTime: selectedStartTime,
        endTime: selectedEndTime,
        purpose,
      });

      if (response.success) {
        setSuccessMessage('Booking created successfully!');
        setStep(4); // Go to success step
      } else {
        setBookingError(response.error?.message || 'Failed to create booking.');
      }
    } catch (error) {
      console.error('Booking creation error:', error);
      setBookingError('An unexpected error occurred during booking.');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirect handled by useEffect
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Book a Meeting Room</h1>
          <p className="mt-1 text-sm text-muted-foreground">Follow the steps to reserve your space</p>
        </div>

        {/* Progress Stepper */}
        <div className="flex justify-between items-center text-sm font-medium text-muted-foreground">
          <div className={`flex-1 text-center ${step >= 1 ? 'text-primary' : ''}`}>1. Select Room</div>
          <div className="w-8 border-t border-border"></div>
          <div className={`flex-1 text-center ${step >= 2 ? 'text-primary' : ''}`}>2. Select Date & Time</div>
          <div className="w-8 border-t border-border"></div>
          <div className={`flex-1 text-center ${step >= 3 ? 'text-primary' : ''}`}>3. Confirm Details</div>
          <div className="w-8 border-t border-border"></div>
          <div className={`flex-1 text-center ${step >= 4 ? 'text-primary' : ''}`}>4. Complete</div>
        </div>

        {/* Step 1: Select Room */}
        {step === 1 && (
          <div className="bg-card shadow rounded-lg border border-border p-4 lg:p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Select a Meeting Room</h2>
            {loadingRooms ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-700 rounded-lg p-4 h-32"></div>
                ))}
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-8">
                <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-foreground">No meeting rooms available</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {rooms.map((room) => (
                  <div key={room._id} className="lg:flex lg:justify-between border border-border rounded-lg p-2 cursor-pointer hover:bg-muted transition-colors" onClick={() => handleRoomSelect(room)}>
                    <div className='lg:my-auto'>
                      <h3 className="text-lg font-medium text-foreground">{room.name}</h3>
                      <p className="text-sm text-muted-foreground">Capacity: {room.capacity}</p>
                    </div>
                    {room.images.length > 0 ? <img src={room.images[0].url} alt={room.name} className="lg:w-1/2 w-full h-24 mt-2 lg:mt-0 object-cover rounded-md" /> : 
                    <div className="lg:w-1/2 h-24 mt-2 lg:mt-0 bg-muted flex items-center justify-center rounded-md">
                      <BuildingOfficeIcon className="h-12 w-12 text-gray-400" />
                    </div>
                    }
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Date & Time */}
        {step === 2 && selectedRoom && (
          <div className="bg-card shadow rounded-lg border border-border p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Book for {selectedRoom.name}</h2>

            <div className="mb-4">
              <label htmlFor="booking-date" className="block text-sm font-medium text-secondary-foreground">
                Select Date
              </label>
              {mounted ? <input type="date" id="booking-date" className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-muted text-foreground" value={selectedDate} onChange={handleDateChange} min={format(new Date(), 'yyyy-MM-dd')} /> : <input type="date" id="booking-date" className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-muted text-foreground" value="" onChange={handleDateChange} min={format(new Date(), 'yyyy-MM-dd')} />}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="start-time" className="block text-sm font-medium text-secondary-foreground">
                  Start Time
                </label>
                <input type="time" id="start-time" className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-muted text-foreground" value={selectedStartTime} onChange={(e) => handleTimeChange('start', e.target.value)} required />
              </div>
              <div>
                <label htmlFor="end-time" className="block text-sm font-medium text-secondary-foreground">
                  End Time
                </label>
                <input type="time" id="end-time" className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-muted text-foreground" value={selectedEndTime} onChange={(e) => handleTimeChange('end', e.target.value)} required />
              </div>
            </div>

            {loadingSlots ? (
              <div className="text-center py-4">
                <ArrowPathIcon className="mx-auto h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading booked slots...</p>
              </div>
            ) : (
              bookedSlots.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-secondary-foreground mb-2">Booked Slots for {format(parseISO(selectedDate), 'MMM dd, yyyy')}:</p>
                  <div className="flex flex-wrap gap-2">
                    {bookedSlots.map((slot, index) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/10 dark:text-red-400">
                        {convertToAMPM(slot.start)} - {convertToAMPM(slot.end)}
                      </span>
                    ))}
                  </div>
                </div>
              )
            )}

            {bookingError && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/10 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-400">Error</h3>
                    <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                      <p>{bookingError}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(1)} className="px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium text-secondary-foreground bg-muted hover:bg-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                Previous
              </button>
              <button onClick={() => setStep(3)} disabled={!selectedStartTime || !selectedEndTime || !isValidTimeRange(selectedStartTime, selectedEndTime) || isTimeSlotBooked(selectedStartTime, selectedEndTime)} className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed">
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm Details */}
        {step === 3 && selectedRoom && (
          <div className="bg-card shadow rounded-lg border border-border p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Confirm Your Booking</h2>

            <div className="space-y-4 text-secondary-foreground">
              <p>
                <strong>Room:</strong> {selectedRoom.name}
              </p>
              <p>
                <strong>Date:</strong> {format(parseISO(selectedDate), 'MMM dd, yyyy')}
              </p>
              <p>
                <strong>Time:</strong> {selectedStartTime} - {selectedEndTime}
              </p>
              <div>
                <label htmlFor="purpose" className="block text-sm font-medium text-secondary-foreground">
                  Purpose (Optional)
                </label>
                <textarea id="purpose" rows={3} className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-muted text-foreground" value={purpose} onChange={(e) => setPurpose(e.target.value)}></textarea>
              </div>
            </div>

            {bookingError && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/10 p-4 mt-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-400">Error</h3>
                    <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                      <p>{bookingError}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(2)} className="px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium text-secondary-foreground bg-muted hover:bg-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                Previous
              </button>
              <button onClick={handleBookingSubmit} className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                Confirm Booking
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 4 && (
          <div className="bg-card shadow rounded-lg border border-border p-6 text-center">
            <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Booking Successful!</h2>
            <p className="text-secondary-foreground mb-6">{successMessage}</p>
            <Link href="/" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              Go to Dashboard
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
