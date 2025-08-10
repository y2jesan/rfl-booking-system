'use client';

import Layout from '@/components/Layout';
import Tooltip from '@/components/Tooltip';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ArrowRightIcon, CalendarIcon, ClockIcon, FunnelIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
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
  cancelReason?: string;
  rejectReason?: string;
}

interface BookingsResponse {
  bookings: Booking[];
}

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  // const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoadingBookings(true);
      try {
        const params: Record<string, string> = {};
        if (filterStatus !== 'all') {
          params.status = filterStatus;
        }
        if (searchQuery) {
          params.search = searchQuery;
        }
        if (filterDate) {
          params.from = filterDate;
          params.to = filterDate;
        }
        const response = await apiClient.getBookings(params);
        if (response.success) {
          setBookings((response.data as BookingsResponse).bookings);
        } else {
          // setError(response.error?.message || "Failed to fetch bookings");
        }
      } catch (err) {
        // setError("An unexpected error occurred");
        console.error(err);
      } finally {
        setLoadingBookings(false);
      }
    };
    if (user) {
      fetchBookings();
    }
  }, [user, filterStatus, searchQuery, filterDate]);

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

  const minutesToTimeAMPM = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Booking History</h1>
            <p className="mt-1 text-sm text-muted-foreground">View your past and upcoming meeting room bookings</p>
          </div>
          <div className="sm:hidden">
            <Tooltip content="Toggle Filters">
              <button onClick={() => setShowFilters(!showFilters)} className="inline-flex items-center p-2 border border-border text-sm font-medium rounded-md text-primary bg-muted hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                <FunnelIcon className="h-5 w-5" />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Filters and Search */}
        <div className={`bg-card shadow rounded-lg border border-border p-6 ${showFilters ? 'block' : 'hidden'} sm:block`}>
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
                <input type="text" name="search" id="search" className="block w-full px-3 py-2 pl-10 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-muted text-foreground text-sm" placeholder="Search by room name or purpose" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Booking List */}
        <div className="bg-card shadow rounded-lg border border-border">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-medium text-foreground">Your Bookings</h2>
          </div>

          <div className="p-6">
            {loadingBookings ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-foreground">No bookings found</h3>
                <p className="mt-1 text-sm text-muted-foreground">Adjust your filters or make a new booking.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <Link key={booking._id} href={`/booking/${booking._id}`} className="group block border border-border rounded-lg p-4 hover:bg-muted hover:shadow-md transition-all duration-200 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-foreground">{booking.roomId.name}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>{booking.status.replace('_', ' ')}</span>
                        </div>
                        <div className="mt-1 flex flex-col sm:flex-row sm:items-center text-sm text-muted-foreground space-y-1 sm:space-y-0">
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {format(parseISO(booking.date), 'MMM dd, yyyy')}
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
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
