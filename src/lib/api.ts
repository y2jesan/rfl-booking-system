interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

class ApiClient {
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

  // Auth methods
  async login(email: string, password: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    return this.request('/api/auth/logout', {
      method: 'POST',
    });
  }

  async refreshToken() {
    return this.request('/api/auth/refresh', {
      method: 'POST',
    });
  }

  async getCurrentUser() {
    return this.request('/api/auth/me');
  }

  // Meeting Rooms methods
  async getMeetingRooms(params?: Record<string, string>) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/api/meeting-rooms${queryString}`);
  }

  async getMeetingRoom(id: string) {
    return this.request(`/api/meeting-rooms/${id}`);
  }

  async getBookedSlots(roomId: string, date: string) {
    return this.request(`/api/meeting-rooms/${roomId}/booked-slots?date=${date}`);
  }

  // Bookings methods
  async getBookings(params?: Record<string, string>) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/api/bookings${queryString}`);
  }

  async getBooking(id: string) {
    return this.request(`/api/bookings/${id}`);
  }

  async createBooking(bookingData: { roomId: string; date: string; startTime: string; endTime: string; purpose?: string }) {
    return this.request('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  async updateBooking(id: string, updateData: unknown) {
    return this.request(`/api/bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
  }

  async cancelBooking(id: string, reason: string) {
    return this.request(`/api/bookings/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async rescheduleBooking(id: string, rescheduleData: unknown) {
    return this.request(`/api/bookings/${id}/reschedule`, {
      method: 'POST',
      body: JSON.stringify(rescheduleData),
    });
  }
}

export const apiClient = new ApiClient();
export type { ApiResponse };
