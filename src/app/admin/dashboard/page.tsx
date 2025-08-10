'use client';

import AdminLayout from '@/components/AdminLayout';
import { adminApiClient } from '@/lib/admin-api';
import { useAuth } from '@/lib/auth-context';
import {
  ArrowRightIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface DashboardStats {
  totalUsers: number;
  totalRooms: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  rejectedBookings: number;
}

interface RecentBooking {
  _id: string;
  roomId: {
    name: string;
  };
  userId: {
    email: string;
  };
  date: string;
  startMinutes: number;
  endMinutes: number;
  status: string;
  createdAt: string;
}

interface UsersResponse {
  users: Array<{
    _id: string;
    email: string;
    role: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface MeetingRoomsResponse {
  rooms: Array<{
    _id: string;
    name: string;
    capacity: number;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface BookingsResponse {
  bookings: Array<{
    _id: string;
    status: string;
    roomId: {
      name: string;
    };
    userId: {
      email: string;
    };
    date: string;
    startMinutes: number;
    endMinutes: number;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !['ADMIN', 'STAFF'].includes(user.role))) {
      console.log(user);
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && ['ADMIN', 'STAFF'].includes(user.role)) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats and recent bookings in parallel
      const [usersResponse, roomsResponse, bookingsResponse, recentBookingsResponse] = await Promise.all([adminApiClient.getUsers(), adminApiClient.getMeetingRooms(), adminApiClient.getBookings(), adminApiClient.getBookings({ limit: '10', sort: 'createdAt' })]);

      if (usersResponse.success && roomsResponse.success && bookingsResponse.success) {
        const allBookings = (bookingsResponse.data as BookingsResponse).bookings || [];
        const allUsers = (usersResponse.data as UsersResponse).users || [];
        const allRooms = (roomsResponse.data as MeetingRoomsResponse).rooms || [];

        const dashboardStats: DashboardStats = {
          totalUsers: allUsers.length,
          totalRooms: allRooms.length,
          totalBookings: allBookings.length,
          pendingBookings: allBookings.filter((b) => b.status === 'PENDING').length,
          confirmedBookings: allBookings.filter((b) => b.status === 'CONFIRMED').length,
          rejectedBookings: allBookings.filter((b) => b.status === 'REJECTED').length,
        };
        setStats(dashboardStats);
      }

      if (recentBookingsResponse.success && recentBookingsResponse.data) {
        setRecentBookings((recentBookingsResponse.data as BookingsResponse).bookings || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
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

  const minutesToTimeAMPM = (minutes: number) => {
    const date = new Date(0, 0, 0, minutes / 60, minutes % 60);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric', hour12: true });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !['ADMIN', 'STAFF'].includes(user.role)) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Overview of the RFL Meeting Room Booking System</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/admin/users" className="group bg-card overflow-hidden shadow rounded-lg border border-border hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UsersIcon className="h-6 w-6 text-primary group-hover:text-primary/80 transition-colors" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-muted-foreground truncate">Total Users</dt>
                      <dd className="text-lg font-medium text-foreground">{stats.totalUsers}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/admin/meeting-rooms" className="group bg-card overflow-hidden shadow rounded-lg border border-border hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BuildingOfficeIcon className="h-6 w-6 text-primary group-hover:text-primary/80 transition-colors" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-muted-foreground truncate">Meeting Rooms</dt>
                      <dd className="text-lg font-medium text-foreground">{stats.totalRooms}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/admin/bookings" className="group bg-card overflow-hidden shadow rounded-lg border border-border hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CalendarIcon className="h-6 w-6 text-primary group-hover:text-primary/80 transition-colors" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-muted-foreground truncate">Total Bookings</dt>
                      <dd className="text-lg font-medium text-foreground">{stats.totalBookings}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/admin/bookings?status=PENDING" className="group bg-card overflow-hidden shadow rounded-lg border border-border hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-muted-foreground truncate">Pending Bookings</dt>
                      <dd className="text-lg font-medium text-foreground">{stats.pendingBookings}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Booking Status Overview */}
        {stats && (
          <div className="bg-card shadow rounded-lg border border-border">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-lg font-medium text-foreground">Booking Status Overview</h2>
            </div>
            <div className="p-6 sm:p-6 md:p-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center">
                  <CalendarIcon className="h-8 w-8 text-blue-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total</p>
                    <p className="text-2xl font-semibold text-foreground">{stats.totalBookings}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <CheckCircleIcon className="h-8 w-8 text-green-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Confirmed</p>
                    <p className="text-2xl font-semibold text-foreground">{stats.confirmedBookings}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <ClockIcon className="h-8 w-8 text-yellow-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending</p>
                    <p className="text-2xl font-semibold text-foreground">{stats.pendingBookings}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <XCircleIcon className="h-8 w-8 text-red-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                    <p className="text-2xl font-semibold text-foreground">{stats.rejectedBookings}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Bookings */}
        <div className="bg-card shadow rounded-lg border border-border">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-medium text-foreground">Recent Bookings</h2>
          </div>
          <div className="p-4 sm:p-6 md:p-4">
            {recentBookings.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-foreground">No recent bookings</h3>
                <p className="mt-1 text-sm text-muted-foreground">Recent booking activity will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <Link
                    key={booking._id}
                    href={`/admin/booking/${booking._id}`}
                    className="group block border border-border rounded-lg p-4 hover:bg-muted hover:shadow-md transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-foreground">{booking.roomId.name}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>{booking.status.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center space-x-1 mt-1 text-sm text-muted-foreground">
                          <UsersIcon className="h-4 w-4" />
                          <span>{booking.userId.email}</span>
                        </div>
                        <div className="mt-1 flex items-center text-sm text-muted-foreground">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {new Date(booking.date).toLocaleDateString()}
                          <ClockIcon className="h-4 w-4 ml-4 mr-1" />
                          {minutesToTimeAMPM(booking.startMinutes)} - {minutesToTimeAMPM(booking.endMinutes)}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </Link>
                ))}

                <div className="text-center pt-4">
                  <Link href="/admin/bookings" className="text-primary hover:text-primary/80 text-sm font-medium">
                    View all bookings →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
