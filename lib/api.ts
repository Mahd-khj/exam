// lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  [key: string]: any;
}

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || 'Request failed',
        };
      }

      return {
        success: true,
        ...data,
        data: data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  }

  // ===============================
  // 🔐 Auth
  // ===============================
  async login(email: string, password: string) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.token) {
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
  }

  async logout() {
    const response = await this.request('/auth/logout', {
      method: 'POST',
    });

    if (response.success) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }

    return response;
  }

  // ===============================
  // 🧑‍💻 Admin - Exams
  // ===============================
  async getExams(filters?: { search?: string; date?: string; roomId?: number }) {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.date) params.append('date', filters.date);
    if (filters?.roomId) params.append('roomId', filters.roomId.toString());

    const query = params.toString();
    return this.request(`/admin/exams${query ? `?${query}` : ''}`);
  }

  async getExam(id: number) {
    return this.request(`/admin/exams/${id}`);
  }

  async createExam(data: any) {
    return this.request('/admin/exams', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateExam(id: number, data: any) {
    return this.request(`/admin/exams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteExam(id: number) {
    return this.request(`/admin/exams/${id}`, {
      method: 'DELETE',
    });
  }

  async deleteAllExams() {
    return this.request('/admin/exams', {
      method: 'DELETE',
    });
  }

  // ===============================
  // 🏫 Admin - Class Codes
  // ===============================
  async getClassCodes() {
    return this.request('/admin/classcodes');
  }

  // ===============================
  // 🏠 Admin - Rooms
  // ===============================
  async getRooms() {
    return this.request('/admin/rooms');
  }

  // ===============================
  // 📤 Admin - CSV Upload
  // ===============================
  async uploadCSV(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const token = this.getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();
      return {
        success: response.ok,
        ...data,
        error: response.ok ? undefined : data.error || data.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Upload failed',
      };
    }
  }

  // ===============================
  // 🎓 Student - Timetable
  // ===============================
  async getTimetable(courseCodes: string[]) {
    const params = new URLSearchParams();
    params.append('courseCodes', JSON.stringify(courseCodes));
    return this.request(`/student/timetable?${params.toString()}`);
  }

  // ===============================
  // 🎓 Student - Courses
  // ===============================
  async getCourses() {
    return this.request('/student/courses');
  }

  // ===============================
  // 🎓 Student - All Exams (read-only)
  // ===============================
  async getAllExamsForStudent(filters?: { search?: string; date?: string; roomId?: number }) {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.date) params.append('date', filters.date);
    if (filters?.roomId) params.append('roomId', filters.roomId.toString());

    const query = params.toString();
    return this.request(`/student/exams${query ? `?${query}` : ''}`);
  }

  // ===============================
  // 🧍 Student - Classes (New user isolation system)
  // ===============================
  async getUserClasses() {
    return this.request('/student/classes');
  }

  async addUserClass(examId?: number, classCodeId?: number) {
    return this.request('/student/classes', {
      method: 'POST',
      body: JSON.stringify({ examId, classCodeId }),
    });
  }

  async removeUserClass(examId?: number, classCodeId?: number) {
    return this.request('/student/classes', {
      method: 'DELETE',
      body: JSON.stringify({ examId, classCodeId }),
    });
  }

  // ===============================
  // ⚙️ Utility
  // ===============================
  getUser() {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated() {
    return !!this.getToken();
  }
}

export const apiClient = new ApiClient();
