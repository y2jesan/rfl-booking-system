'use client';

import AdminLayout from '@/components/AdminLayout';
import Tooltip from '@/components/Tooltip';
import { adminApiClient } from '@/lib/admin-api';
import { useAuth } from '@/lib/auth-context';
import { ArrowPathIcon, BuildingOfficeIcon, CheckCircleIcon, ExclamationCircleIcon, PencilIcon, PhotoIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
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
  isActive: boolean;
  images: Array<{
    _id: string;
    fileName: string;
    url: string;
  }>;
}

interface MeetingRoomsResponse {
  rooms: MeetingRoom[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function AdminMeetingRoomsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<MeetingRoom | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCapacity, setFormCapacity] = useState(1);
  const [formTables, setFormTables] = useState(0);
  const [formAC, setFormAC] = useState(1);
  const [formWashroom, setFormWashroom] = useState(0);
  const [formPodium, setFormPodium] = useState(false);
  const [formSoundSystem, setFormSoundSystem] = useState(false);
  const [formProjector, setFormProjector] = useState(false);
  const [formMonitors, setFormMonitors] = useState(0);
  const [formTVs, setFormTVs] = useState(0);
  const [formEthernet, setFormEthernet] = useState(false);
  const [formWifi, setFormWifi] = useState(true);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !['ADMIN', 'STAFF'].includes(user.role))) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && ['ADMIN', 'STAFF'].includes(user.role)) {
      fetchRooms();
    }
  }, [user]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const response = await adminApiClient.getMeetingRooms();
      if (response.success && response.data) {
        const data = response.data as MeetingRoomsResponse;
        setRooms(data.rooms || []);
      } else {
        setError(response.error?.message || 'Failed to fetch meeting rooms');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = () => {
    setCurrentRoom(null);
    setFormName('');
    setFormDescription('');
    setFormCapacity(1);
    setFormTables(0);
    setFormAC(1);
    setFormWashroom(0);
    setFormPodium(false);
    setFormSoundSystem(false);
    setFormProjector(false);
    setFormMonitors(0);
    setFormTVs(0);
    setFormEthernet(false);
    setFormWifi(true);
    setModalError(null);
    setModalSuccess(null);
    setShowAddEditModal(true);
  };

  const handleEditRoom = (room: MeetingRoom) => {
    setCurrentRoom(room);
    setFormName(room.name);
    setFormDescription(room.description || '');
    setFormCapacity(room.capacity);
    setFormTables(room.tables);
    setFormAC(room.ac);
    setFormWashroom(room.washroom);
    setFormPodium(room.podium);
    setFormSoundSystem(room.soundSystem);
    setFormProjector(room.projector);
    setFormMonitors(room.monitors);
    setFormTVs(room.tvs);
    setFormEthernet(room.ethernet);
    setFormWifi(room.wifi);
    setModalError(null);
    setModalSuccess(null);
    setShowAddEditModal(true);
  };

  const handleDeleteRoom = (room: MeetingRoom) => {
    setCurrentRoom(room);
    setModalError(null);
    setModalSuccess(null);
    setShowDeleteModal(true);
  };

  const handleImageUpload = (room: MeetingRoom) => {
    setCurrentRoom(room);
    setSelectedFiles(null);
    setModalError(null);
    setModalSuccess(null);
    setShowImageUploadModal(true);
  };

  const handleSubmitAddEdit = async () => {
    setModalError(null);
    setModalSuccess(null);
    if (!formName || !formCapacity) {
      setModalError('Name and Capacity are required.');
      return;
    }

    const roomData = {
      name: formName,
      description: formDescription,
      capacity: formCapacity,
      tables: formTables,
      ac: formAC,
      washroom: formWashroom,
      podium: formPodium,
      soundSystem: formSoundSystem,
      projector: formProjector,
      monitors: formMonitors,
      tvs: formTVs,
      ethernet: formEthernet,
      wifi: formWifi,
    };

    try {
      let response;
      if (currentRoom) {
        response = await adminApiClient.updateMeetingRoom(currentRoom._id, roomData);
      } else {
        response = await adminApiClient.createMeetingRoom(roomData);
      }

      if (response.success) {
        setModalSuccess(`Meeting room ${currentRoom ? 'updated' : 'created'} successfully.`);
        setShowAddEditModal(false);
        fetchRooms();
      } else {
        setModalError(response.error?.message || `Failed to ${currentRoom ? 'update' : 'create'} meeting room.`);
      }
    } catch (err) {
      console.error(err);
      setModalError('An unexpected error occurred.');
    }
  };

  const handleSubmitDelete = async () => {
    setModalError(null);
    setModalSuccess(null);
    if (!currentRoom) return;

    try {
      const response = await adminApiClient.toggleMeetingRoomStatus(currentRoom._id);
      if (response.success) {
        setModalSuccess(`Meeting room ${currentRoom.isActive ? 'deactivated' : 'activated'} successfully.`);
        setShowDeleteModal(false);
        fetchRooms();
      } else {
        setModalError(response.error?.message || `Failed to ${currentRoom.isActive ? 'deactivate' : 'activate'} meeting room.`);
      }
    } catch (err) {
      console.error(err);
      setModalError('An unexpected error occurred.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files);
  };

  const handleImageUploadSubmit = async () => {
    setModalError(null);
    setModalSuccess(null);
    if (!currentRoom || !selectedFiles || selectedFiles.length === 0) {
      setModalError('Please select at least one file.');
      return;
    }

    setUploadingImages(true);
    const formData = new FormData();
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append('images', selectedFiles[i]);
    }

    try {
      const response = await adminApiClient.uploadRoomImages(currentRoom._id, formData);
      if (response.success) {
        setModalSuccess('Images uploaded successfully.');
        setShowImageUploadModal(false);
        fetchRooms(); // Refresh room list to show new images
      } else {
        setModalError(response.error?.message || 'Failed to upload images.');
      }
    } catch (err) {
      console.error(err);
      setModalError('An unexpected error occurred during image upload.');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    setModalError(null);
    setModalSuccess(null);
    if (!currentRoom) return;

    try {
      const response = await adminApiClient.deleteRoomImage(currentRoom._id, imageId);
      if (response.success) {
        setModalSuccess('Image deleted successfully.');
        fetchRooms(); // Refresh room list
      } else {
        setModalError(response.error?.message || 'Failed to delete image.');
      }
    } catch (err) {
      console.error(err);
      setModalError('An unexpected error occurred during image deletion.');
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
            <h1 className="text-2xl font-bold text-foreground">Meeting Room Management</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage meeting rooms and their details</p>
          </div>
          <div className="flex items-center space-x-2">
            {/* Mobile Add Room Button */}
            <button onClick={handleAddRoom} className="sm:hidden inline-flex items-center justify-center w-10 h-10 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              <PlusIcon className="h-5 w-5" />
            </button>

            {/* Desktop Add Room Button */}
            <button onClick={handleAddRoom} className="hidden sm:inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Room
            </button>
          </div>
        </div>

        {/* Room List */}
        <div className="bg-card shadow rounded-lg border border-border">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-medium text-foreground">All Meeting Rooms</h2>
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
            {rooms.length === 0 ? (
              <div className="text-center py-8">
                <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-foreground">No meeting rooms found</h3>
                <p className="mt-1 text-sm text-muted-foreground">Add new meeting rooms to the system.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-muted">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Capacity
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Images
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-gray-200 dark:divide-gray-700">
                    {rooms.map((room) => (
                      <tr key={room._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-foreground">{room.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-foreground">{room.capacity}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${room.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/10 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/10 dark:text-red-400'}`}>{room.isActive ? 'Active' : 'Inactive'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex -space-x-2 overflow-hidden">
                            {room.images.slice(0, 3).map((image) => (
                              <Image key={image._id} className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800 object-cover" src={image.url} alt={room.name} width={32} height={32} />
                            ))}
                            {room.images.length > 3 && <span className="flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800 bg-muted text-xs text-gray-600 dark:text-gray-300">+{room.images.length - 3}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium ">
                          <div className="flex items-center space-x-2">
                            <Tooltip content="Edit Room">
                              <button onClick={() => handleEditRoom(room)} className="text-primary hover:text-primary/80">
                                <PencilIcon className="h-5 w-5" />
                              </button>
                            </Tooltip>
                            <Tooltip content="Upload Images">
                              <button onClick={() => handleImageUpload(room)} className="text-blue-600 hover:text-blue-800">
                                <PhotoIcon className="h-5 w-5" />
                              </button>
                            </Tooltip>
                            <Tooltip content={room.isActive ? 'Deactivate Room' : 'Activate Room'}>
                              <button onClick={() => handleDeleteRoom(room)} className={`${room.isActive ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}>
                                {room.isActive ? <ExclamationCircleIcon className="h-5 w-5" /> : <CheckCircleIcon className="h-5 w-5" />}
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

      {/* Add/Edit Room Modal */}
      {showAddEditModal && (
        <div className="fixed inset-0 bg-black/60 overflow-y-auto h-full w-full z-50">
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="relative bg-card border border-border rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-medium leading-6 text-foreground mb-4">{currentRoom ? 'Edit Meeting Room' : 'Add New Meeting Room'}</h3>
                <div className="mt-2 space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-secondary-foreground">
                      Name
                    </label>
                    <input type="text" id="name" className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-muted text-foreground" value={formName} onChange={(e) => setFormName(e.target.value)} required />
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-secondary-foreground">
                      Description
                    </label>
                    <textarea id="description" rows={3} className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-muted text-foreground" value={formDescription} onChange={(e) => setFormDescription(e.target.value)}></textarea>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="capacity" className="block text-sm font-medium text-secondary-foreground">
                        Capacity
                      </label>
                      <input type="number" id="capacity" min="1" className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-muted text-foreground" value={formCapacity} onChange={(e) => setFormCapacity(parseInt(e.target.value))} required />
                    </div>
                    <div>
                      <label htmlFor="tables" className="block text-sm font-medium text-secondary-foreground">
                        Tables
                      </label>
                      <input type="number" id="tables" min="0" className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-muted text-foreground" value={formTables} onChange={(e) => setFormTables(parseInt(e.target.value))} />
                    </div>
                    <div>
                      <label htmlFor="ac" className="block text-sm font-medium text-secondary-foreground">
                        AC Units
                      </label>
                      <input type="number" id="ac" min="0" className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-muted text-foreground" value={formAC} onChange={(e) => setFormAC(parseInt(e.target.value))} />
                    </div>
                    <div>
                      <label htmlFor="washroom" className="block text-sm font-medium text-secondary-foreground">
                        Washrooms
                      </label>
                      <input type="number" id="washroom" min="0" className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-muted text-foreground" value={formWashroom} onChange={(e) => setFormWashroom(parseInt(e.target.value))} />
                    </div>
                    <div>
                      <label htmlFor="monitors" className="block text-sm font-medium text-secondary-foreground">
                        Monitors
                      </label>
                      <input type="number" id="monitors" min="0" className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-muted text-foreground" value={formMonitors} onChange={(e) => setFormMonitors(parseInt(e.target.value))} />
                    </div>
                    <div>
                      <label htmlFor="tvs" className="block text-sm font-medium text-secondary-foreground">
                        TVs
                      </label>
                      <input type="number" id="tvs" min="0" className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-muted text-foreground" value={formTVs} onChange={(e) => setFormTVs(parseInt(e.target.value))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center">
                      <input id="podium" name="podium" type="checkbox" className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary" checked={formPodium} onChange={(e) => setFormPodium(e.target.checked)} />
                      <label htmlFor="podium" className="ml-2 block text-sm text-foreground">
                        Podium
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input id="soundSystem" name="soundSystem" type="checkbox" className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary" checked={formSoundSystem} onChange={(e) => setFormSoundSystem(e.target.checked)} />
                      <label htmlFor="soundSystem" className="ml-2 block text-sm text-foreground">
                        Sound System
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input id="projector" name="projector" type="checkbox" className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary" checked={formProjector} onChange={(e) => setFormProjector(e.target.checked)} />
                      <label htmlFor="projector" className="ml-2 block text-sm text-foreground">
                        Projector
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input id="ethernet" name="ethernet" type="checkbox" className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary" checked={formEthernet} onChange={(e) => setFormEthernet(e.target.checked)} />
                      <label htmlFor="ethernet" className="ml-2 block text-sm text-foreground">
                        Ethernet
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input id="wifi" name="wifi" type="checkbox" className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary" checked={formWifi} onChange={(e) => setFormWifi(e.target.checked)} />
                      <label htmlFor="wifi" className="ml-2 block text-sm text-foreground">
                        WiFi
                      </label>
                    </div>
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
                  <button type="button" className="inline-flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:col-start-2 sm:text-sm" onClick={handleSubmitAddEdit}>
                    {currentRoom ? 'Save Changes' : 'Add Room'}
                  </button>
                  <button type="button" className="mt-3 inline-flex w-full justify-center rounded-md border border-border bg-muted px-4 py-2 text-base font-medium text-secondary-foreground shadow-sm hover:bg-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm" onClick={() => setShowAddEditModal(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Room Status Modal */}
      {showDeleteModal && currentRoom && (
        <div className="fixed inset-0 bg-black/60 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="relative bg-card border border-border p-8 rounded-lg shadow-xl max-w-md w-full mx-auto">
            <h3 className="text-lg font-medium leading-6 text-foreground mb-4">{currentRoom.isActive ? 'Deactivate' : 'Activate'} Meeting Room</h3>
            <div className="mt-2">
              <p className="text-sm text-secondary-foreground">
                Are you sure you want to {currentRoom.isActive ? 'deactivate' : 'activate'} meeting room <span className="font-semibold">{currentRoom.name}</span>?{currentRoom.isActive ? ' This will make the room unavailable for new bookings.' : ' This will make the room available for new bookings.'}
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
              <button type="button" className={`inline-flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-base font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:col-start-2 sm:text-sm ${currentRoom.isActive ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'}`} onClick={handleSubmitDelete}>
                {currentRoom.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button type="button" className="mt-3 inline-flex w-full justify-center rounded-md border border-border bg-muted px-4 py-2 text-base font-medium text-secondary-foreground shadow-sm hover:bg-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Upload Modal */}
      {showImageUploadModal && currentRoom && (
        <div className="fixed inset-0 bg-black/60 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="relative p-8 border border-border bg-card rounded-lg shadow-xl max-w-2xl w-full mx-auto">
            <h3 className="text-lg font-medium leading-6 text-foreground mb-4">Upload Images for {currentRoom.name}</h3>
            <div className="mt-2 space-y-4">
              <div>
                <label htmlFor="image-upload" className="block text-sm font-medium text-secondary-foreground">
                  Select Images
                </label>
                <input type="file" id="image-upload" className="mt-1 block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90" multiple accept="image/*" onChange={handleFileChange} />
              </div>
              {currentRoom.images.length > 0 && (
                <div>
                  <p className="block text-sm font-medium text-secondary-foreground mb-2">Existing Images:</p>
                  <div className="grid grid-cols-3 gap-4">
                    {currentRoom.images.map((image) => (
                      <div key={image._id} className="relative group">
                        <Image src={image.url} alt={image.fileName} width={200} height={150} className="rounded-md object-cover w-full h-32" />
                        <button onClick={() => handleDeleteImage(image._id)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity" title="Delete Image">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
              <button type="button" className="inline-flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:col-start-2 sm:text-sm" onClick={handleImageUploadSubmit} disabled={uploadingImages}>
                {uploadingImages ? <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" /> : <PhotoIcon className="h-5 w-5 mr-2" />}
                {uploadingImages ? 'Uploading...' : 'Upload Images'}
              </button>
              <button type="button" className="mt-3 inline-flex w-full justify-center rounded-md border border-border bg-muted px-4 py-2 text-base font-medium text-secondary-foreground shadow-sm hover:bg-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm" onClick={() => setShowImageUploadModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
