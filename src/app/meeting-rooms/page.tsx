'use client';

import Layout from '@/components/Layout';
import Tooltip from '@/components/Tooltip';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { BuildingOfficeIcon, CalendarIcon, FunnelIcon, UsersIcon } from '@heroicons/react/24/outline';
import { ComputerDesktopIcon as ComputerSolidIcon, SpeakerWaveIcon as SpeakerSolidIcon, TvIcon as TvSolidIcon, WifiIcon as WifiSolidIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface MeetingRoom {
  _id: string;
  name: string;
  description?: string;
  capacity: number;
  tables: number;
  ac: number;
  washroom: number;
  podium: boolean;
  soundSystem: boolean;
  projector: boolean;
  monitors: number;
  tvs: number;
  ethernet: boolean;
  wifi: boolean;
  images: Array<{
    _id: string;
    fileName: string;
    url: string;
  }>;
}

interface RoomsResponse {
  rooms: MeetingRoom[];
}

export default function MeetingRoomsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    capacity: '',
    wifi: '',
    ethernet: '',
    projector: '',
    soundSystem: '',
    podium: '',
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const params: Record<string, string> = {};

        if (filters.capacity) params.capacity = filters.capacity;
        if (filters.wifi) params.wifi = filters.wifi;
        if (filters.ethernet) params.ethernet = filters.ethernet;
        if (filters.projector) params.projector = filters.projector;
        if (filters.soundSystem) params.soundSystem = filters.soundSystem;
        if (filters.podium) params.podium = filters.podium;

        const response = await apiClient.getMeetingRooms(params);
        if (response.success) {
          setRooms((response.data as RoomsResponse).rooms);
        }
      } catch (error) {
        console.error('Error fetching rooms:', error);
      } finally {
        setLoadingRooms(false);
      }
    };
    if (user) {
      fetchRooms();
    }
  }, [user, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      capacity: '',
      wifi: '',
      ethernet: '',
      projector: '',
      soundSystem: '',
      podium: '',
    });
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Meeting Rooms</h1>
            <p className="mt-1 text-sm text-muted-foreground">Browse and book available meeting rooms</p>
          </div>
          <div className="sm:hidden">
            <Tooltip content="Toggle Filters">
              <button onClick={() => setShowFilters(!showFilters)} className="inline-flex items-center p-2 border border-border text-sm font-medium rounded-md text-primary bg-muted hover:bg-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                <FunnelIcon className="h-5 w-5" />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Filters */}
        <div className={`bg-card shadow rounded-lg border border-border p-6 ${showFilters ? 'block' : 'hidden'} sm:block`}>
          <h2 className="text-lg font-medium text-foreground mb-4">Filters</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-foreground mb-1">Min Capacity</label>
              <input type="number" min="1" className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-muted text-foreground" value={filters.capacity} onChange={(e) => handleFilterChange('capacity', e.target.value)} placeholder="Any" />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-foreground mb-1">WiFi</label>
              <select className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-muted text-foreground" value={filters.wifi} onChange={(e) => handleFilterChange('wifi', e.target.value)}>
                <option value="">Any</option>
                <option value="true">Required</option>
                <option value="false">Not Required</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-foreground mb-1">Ethernet</label>
              <select className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-muted text-foreground" value={filters.ethernet} onChange={(e) => handleFilterChange('ethernet', e.target.value)}>
                <option value="">Any</option>
                <option value="true">Required</option>
                <option value="false">Not Required</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-foreground mb-1">Projector</label>
              <select className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-muted text-foreground" value={filters.projector} onChange={(e) => handleFilterChange('projector', e.target.value)}>
                <option value="">Any</option>
                <option value="true">Required</option>
                <option value="false">Not Required</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-foreground mb-1">Sound System</label>
              <select className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-muted text-foreground" value={filters.soundSystem} onChange={(e) => handleFilterChange('soundSystem', e.target.value)}>
                <option value="">Any</option>
                <option value="true">Required</option>
                <option value="false">Not Required</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-foreground mb-1">Podium</label>
              <select className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-muted text-foreground" value={filters.podium} onChange={(e) => handleFilterChange('podium', e.target.value)}>
                <option value="">Any</option>
                <option value="true">Required</option>
                <option value="false">Not Required</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button onClick={clearFilters} className="px-4 py-2 text-sm font-medium text-secondary-foreground bg-muted border border-border rounded-md shadow-sm hover:bg-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              Clear Filters
            </button>
          </div>
        </div>

        {/* Rooms Grid */}
        <div>
          {loadingRooms ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card rounded-lg shadow border border-border p-6 animate-pulse">
                  <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-muted rounded w-full mb-2"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-12">
              <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-foreground">No meeting rooms found</h3>
              <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters to see more results.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room) => (
                <div key={room._id} onClick={() => router.push(`/meeting-rooms/${room._id}`)} className="block bg-card rounded-lg shadow hover:shadow-md transition-shadow border border-border overflow-hidden group cursor-pointer">
                  {/* Room Image */}
                  {room.images.length > 0 ? (
                    <div className="h-48 bg-muted">
                      <img src={room.images[0].url} alt={room.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-48 bg-muted flex items-center justify-center">
                      <BuildingOfficeIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium text-foreground group-hover:text-primary transition-colors">{room.name}</h3>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <UsersIcon className="h-4 w-4 mr-1" />
                        {room.capacity}
                      </div>
                    </div>

                    {room.description && <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{room.description}</p>}

                    {/* Amenities with Book Button */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex flex-wrap gap-2 flex-1">
                        {room.ac > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800 dark:bg-cyan-900/10 dark:text-cyan-400">
                            <span className="text-xs mr-1">❄️</span>
                            {room.ac} AC{room.ac > 1 ? 's' : ''}
                          </span>
                        )}
                        {room.wifi && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/10 dark:text-blue-400">
                            <WifiSolidIcon className="h-3 w-3 mr-1" />
                            WiFi
                          </span>
                        )}
                        {room.projector && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/10 dark:text-green-400">
                            <ComputerSolidIcon className="h-3 w-3 mr-1" />
                            Projector
                          </span>
                        )}
                        {room.soundSystem && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/10 dark:text-purple-400">
                            <SpeakerSolidIcon className="h-3 w-3 mr-1" />
                            Sound
                          </span>
                        )}
                        {room.tvs > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/10 dark:text-orange-400">
                            <TvSolidIcon className="h-3 w-3 mr-1" />
                            {room.tvs} TV{room.tvs > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {/* Book Button */}
                      <div className="ml-2">
                        <Tooltip content="Book This Room">
                          <Link href={`/booking?roomId=${room._id}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            Book
                          </Link>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
