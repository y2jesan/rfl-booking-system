interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

class AdminApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'include', // Include cookies for authentication
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || {
            code: 'UNKNOWN_ERROR',
            message: 'An unknown error occurred',
          },
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network error occurred',
          details: error,
        },
      };
    }
  }

  // User Management
  async getUsers(params?: Record<string, string>) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/api/admin/users${queryString}`);
  }

  async createUser(userData: { email: string; role: 'ADMIN' | 'STAFF' | 'USER' }) {
    return this.request('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: string, updateData: unknown) {
    return this.request(`/api/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
  }

  async toggleUserStatus(id: string) {
    return this.request(`/api/admin/users/${id}`, {
      method: 'DELETE',
    });
  }

  async resetUserPassword(id: string) {
    return this.request(`/api/admin/users/${id}/reset-password`, {
      method: 'POST',
    });
  }

  // Meeting Room Management
  async getMeetingRooms(params?: Record<string, string>) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/api/admin/meeting-rooms${queryString}`);
  }

  async createMeetingRoom(roomData: unknown) {
    return this.request('/api/admin/meeting-rooms', {
      method: 'POST',
      body: JSON.stringify(roomData),
    });
  }

  async updateMeetingRoom(id: string, updateData: unknown) {
    return this.request(`/api/admin/meeting-rooms/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
  }

  async toggleMeetingRoomStatus(id: string) {
    return this.request(`/api/admin/meeting-rooms/${id}`, {
      method: 'DELETE',
    });
  }

  async uploadRoomImages(roomId: string, formData: FormData) {
    try {
      const url = `${this.baseUrl}/api/admin/meeting-rooms/${roomId}/images`;
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || {
            code: 'UNKNOWN_ERROR',
            message: 'An unknown error occurred',
          },
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network error occurred',
          details: error,
        },
      };
    }
  }

  async deleteRoomImage(roomId: string, imageId: string) {
    return this.request(`/api/admin/meeting-rooms/${roomId}/images/${imageId}`, {
      method: 'DELETE',
    });
  }

  async getRoomBookedSlots(roomId: string, date: string) {
    return this.request(`/api/meeting-rooms/${roomId}/booked-slots?date=${date}`);
  }

  // Booking Management
  async getBookings(params?: Record<string, string>) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/api/admin/bookings${queryString}`);
  }

  async createBooking(bookingData: unknown) {
    return this.request('/api/admin/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  async confirmBooking(id: string) {
    return this.request(`/api/admin/bookings/${id}/confirm`, {
      method: 'POST',
    });
  }

  async rejectBooking(id: string, reason: string) {
    return this.request(`/api/admin/bookings/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async approveReschedule(id: string) {
    return this.request(`/api/admin/bookings/${id}/approve-reschedule`, {
      method: 'POST',
    });
  }

  async rejectReschedule(id: string, reason: string) {
    return this.request(`/api/admin/bookings/${id}/reject-reschedule`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async updateBooking(id: string, updateData: unknown) {
    return this.request(`/api/admin/bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
  }
}

export const adminApiClient = new AdminApiClient();
export type { ApiResponse };
