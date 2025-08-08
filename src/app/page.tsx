'use client';

import Layout from '@/components/Layout';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ArrowRightIcon, CalendarIcon, ClockIcon, MapPinIcon, PlusIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Booking {
  _id: string;
  roomId: {
    _id: string;
    name: string;
  };
  date: string;
  startMinutes: number;
  endMinutes: number;
  purpose?: string;
  status: string;
}

interface BookingsResponse {
  bookings: Booking[];
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // useEffect(() => {
  //   if (!loading && !user) {
  //     router.push("/login");
  //   }
  // }, [user, loading, router]);

  useEffect(() => {
    // Only redirect if authentication is not loading
    if (!loading) {
      if (user?.role === 'ADMIN' || user?.role === 'STAFF') {
        router.push('/admin/dashboard');
      } else if (!user) {
        router.push('/login');
      }
      // If user is USER role, stay on this page
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchUpcomingBookings();
    }
  }, [user]);

  const fetchUpcomingBookings = async () => {
    try {
      const response = await apiClient.getBookings({ scope: 'upcoming', limit: '5' });
      if (response.success && response.data) {
        setBookings((response.data as BookingsResponse).bookings || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoadingBookings(false);
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
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'RESCHEDULE_REQUESTED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 sm:hidden">Welcome back</p>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:hidden">{user.email.split('@')[0]}</h1>
              
              {/* Desktop welcome message */}
              <h1 className="hidden sm:block text-2xl font-bold text-gray-900 dark:text-white">Welcome back, {user.email.split('@')[0]}!</h1>
              <p className="hidden sm:block mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your meeting room bookings</p>
            </div>
            <div className="sm:hidden">
              <Link href="/booking" className="inline-flex items-center justify-center w-10 h-10 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                <PlusIcon className="h-5 w-5" />
              </Link>
            </div>
          </div>
          <div className="mt-4 sm:mt-0 hidden sm:block">
            <Link href="/booking" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              <PlusIcon className="h-4 w-4 mr-2" />
              New Booking
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-3 gap-4">
          <Link href="/booking" className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700">
            <div className="flex items-center sm:items-start flex-col sm:flex-row">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-8 w-8 text-primary" />
              </div>
              <div className="mt-2 sm:mt-0 sm:ml-4 text-center sm:text-left">
                <h3 className="text-sm sm:text-lg font-medium text-gray-900 dark:text-white">
                  <span className="sm:hidden">Book</span>
                  <span className="hidden sm:inline">Book Room</span>
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 sm:block hidden">Reserve a meeting room</p>
              </div>
            </div>
          </Link>

          <Link href="/meeting-rooms" className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700">
            <div className="flex items-center sm:items-start flex-col sm:flex-row">
              <div className="flex-shrink-0">
                <MapPinIcon className="h-8 w-8 text-primary" />
              </div>
              <div className="mt-2 sm:mt-0 sm:ml-4 text-center sm:text-left">
                <h3 className="text-sm sm:text-lg font-medium text-gray-900 dark:text-white">
                  <span className="sm:hidden">Rooms</span>
                  <span className="hidden sm:inline">Meeting Rooms</span>
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 sm:block hidden">Browse available rooms</p>
              </div>
            </div>
          </Link>

          <Link href="/history" className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700">
            <div className="flex items-center sm:items-start flex-col sm:flex-row">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-primary" />
              </div>
              <div className="mt-2 sm:mt-0 sm:ml-4 text-center sm:text-left">
                <h3 className="text-sm sm:text-lg font-medium text-gray-900 dark:text-white">
                  <span className="sm:hidden">History</span>
                  <span className="hidden sm:inline">History</span>
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 sm:block hidden">View past bookings</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Upcoming Bookings */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Upcoming Bookings</h2>
          </div>

          <div className="p-4 sm:p-6 md:p-4">
            {loadingBookings ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No upcoming bookings</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by booking a meeting room.</p>
                <div className="mt-6">
                  <Link href="/booking" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Book Room
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <Link
                    key={booking._id}
                    href={`/booking/${booking._id}`}
                    className="group block border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:shadow-md transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">{booking.roomId.name}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>{booking.status.replace('_', ' ')}</span>
                        </div>
                        <div className="mt-1 flex flex-col sm:flex-row sm:items-center text-sm text-gray-500 dark:text-gray-400 space-y-1 sm:space-y-0">
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {format(new Date(booking.date), 'MMM dd, yyyy')}
                          </div>
                          <div className="flex items-center sm:ml-4">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {minutesToTimeAMPM(booking.startMinutes)} - {minutesToTimeAMPM(booking.endMinutes)}
                          </div>
                        </div>
                        {booking.purpose && <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{booking.purpose}</p>}
                      </div>
                      <div className="flex-shrink-0">
                        <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </Link>
                ))}

                {bookings.length >= 5 && (
                  <div className="text-center pt-4">
                    <Link href="/history" className="text-primary hover:text-primary/80 text-sm font-medium">
                      View all bookings →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
