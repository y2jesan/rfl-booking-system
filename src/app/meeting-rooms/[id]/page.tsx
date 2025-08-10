'use client';

import Layout from '@/components/Layout';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ArrowLeftIcon, BuildingOfficeIcon, CalendarIcon, CheckCircleIcon, ChevronLeftIcon, ChevronRightIcon, CloudIcon, ComputerDesktopIcon, HomeModernIcon, SpeakerWaveIcon, TableCellsIcon, TvIcon, UsersIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { ComputerDesktopIcon as ComputerSolidIcon, WifiIcon as WifiSolidIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
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

interface RoomResponse {
  room: MeetingRoom;
}

export default function MeetingRoomDetailsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const roomId = params.id as string;

  const [room, setRoom] = useState<MeetingRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchRoomDetails = async () => {
      try {
        const response = await apiClient.getMeetingRoom(roomId);
        if (response.success && response.data) {
          setRoom((response.data as RoomResponse).room);
        } else {
          setError(response.error?.message || 'Failed to fetch room details');
        }
      } catch (err) {
        setError('An unexpected error occurred');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user && roomId) {
      fetchRoomDetails();
    }
  }, [user, roomId]);

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
          <h3 className="mt-2 text-lg font-medium text-foreground">Error</h3>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </div>
      </Layout>
    );
  }

  if (!room) {
    return (
      <Layout>
        <div className="text-center py-12">
          <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-foreground">Meeting Room Not Found</h3>
          <p className="mt-1 text-sm text-muted-foreground">The room you are looking for does not exist.</p>
        </div>
      </Layout>
    );
  }

  const renderAmenity = (label: string, value: boolean | number, Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>) => {
    if (typeof value === 'boolean') {
      return value ? (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/10 dark:text-green-400">
          <CheckCircleIcon className="h-3 w-3 mr-1" />
          {label}
        </span>
      ) : (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/10 dark:text-red-400">
          <XCircleIcon className="h-3 w-3 mr-1" />
          No {label}
        </span>
      );
    } else if (value > 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/10 dark:text-blue-400">
          <Icon className="h-3 w-3 mr-1" />
          {value} {label}
        </span>
      );
    }
    return null;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{room.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Details for {room.name}</p>
        </div>

        <div className="w-full bg-card shadow rounded-lg border border-border p-6">
          <div className="flex flex-col lg:flex-row lg:space-x-6">
            {/* Image Carousel - Takes full width on mobile, 50% on desktop */}
            <div className="w-full lg:w-1/2 mb-6 lg:mb-0">
              {room.images && room.images.length > 0 ? (
                <div className="relative rounded-lg overflow-hidden aspect-[16/9]">
                  <Image 
                    src={room.images[currentIndex].url} 
                    alt={`${room.name} - Image ${currentIndex + 1}`} 
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="rounded-lg object-cover"
                  />
                  {room.images.length > 1 && (
                    <>
                      <button onClick={() => setCurrentIndex((prev) => (prev === 0 ? room.images.length - 1 : prev - 1))} 
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 border border-border text-sm font-medium text-secondary-foreground bg-muted hover:bg-muted-foreground/40 focus:outline-none rounded-full hover:bg-opacity-75 transition-all">
                        <ChevronLeftIcon className="h-6 w-6" />
                      </button>
                      <button onClick={() => setCurrentIndex((prev) => (prev === room.images.length - 1 ? 0 : prev + 1))} 
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 border border-border text-sm font-medium text-secondary-foreground bg-muted hover:bg-muted-foreground/40 focus:outline-none rounded-full hover:bg-opacity-75 transition-all">
                        <ChevronRightIcon className="h-6 w-6" />
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="aspect-[16/9] bg-muted rounded-lg flex items-center justify-center">
                  <BuildingOfficeIcon className="h-24 w-24 text-gray-400" />
                </div>
              )}
            </div>

            {/* Room Info & Amenities - Takes full width on mobile, 50% on desktop */}
            <div className="w-full lg:w-1/2 flex flex-col relative">
              <div className="flex-grow space-y-6">
                {/* Room Information */}
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-3">Room Information</h2>
                  <p className="text-secondary-foreground mb-4">{room.description || 'No description available.'}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center text-secondary-foreground">
                      <UsersIcon className="h-5 w-5 mr-2 text-primary" />
                      <span>Capacity: <span className="font-medium">{room.capacity}</span></span>
                    </div>
                    <div className="flex items-center text-secondary-foreground">
                      <TableCellsIcon className="h-5 w-5 mr-2 text-primary" />
                      <span>Tables: <span className="font-medium">{room.tables}</span></span>
                    </div>
                    <div className="flex items-center text-secondary-foreground">
                      <CloudIcon className="h-5 w-5 mr-2 text-primary" />
                      <span>AC Units: <span className="font-medium">{room.ac}</span></span>
                    </div>
                    <div className="flex items-center text-secondary-foreground">
                      <HomeModernIcon className="h-5 w-5 mr-2 text-primary" />
                      <span>Washrooms: <span className="font-medium">{room.washroom}</span></span>
                    </div>
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-3">Amenities</h2>
                  <div className="flex flex-wrap gap-2">
                    {renderAmenity('WiFi', room.wifi, WifiSolidIcon)}
                    {renderAmenity('Ethernet', room.ethernet, ComputerSolidIcon)}
                    {renderAmenity('Projector', room.projector, ComputerDesktopIcon)}
                    {renderAmenity('Sound System', room.soundSystem, SpeakerWaveIcon)}
                    {renderAmenity('Podium', room.podium, BuildingOfficeIcon)}
                    {renderAmenity('Monitors', room.monitors, TvIcon)}
                    {renderAmenity('TVs', room.tvs, TvIcon)}
                  </div>
                </div>

                {/* Booking Buttons */}
                <div className='md:absolute md:bottom-0 w-full'>
                  <div className="flex justify-between items-center pt-4 mt-auto">
                    <button 
                      onClick={() => router.back()} 
                      className="inline-flex items-center p-2 border border-border rounded-md text-secondary-foreground bg-muted hover:bg-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors" 
                      title="Go Back"
                    >
                      <ArrowLeftIcon className="h-5 w-5" />
                    </button>

                    <Link 
                      href={`/booking?roomId=${room._id}`} 
                      className="inline-flex items-center p-2 border border-transparent rounded-md text-white bg-primary hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      <CalendarIcon className="h-5 w-5 mr-2" />
                      <span>Book This Room</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
