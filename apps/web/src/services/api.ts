export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  meta?: {
    traceId?: string;
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
    nextCursor?: string;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

class ApiClient {
  private baseUrl = '/api/v1';

  private getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Trace-Id': `web_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...customHeaders,
    };

    const token = localStorage.getItem('metriflow_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const activeBranchId = localStorage.getItem('metriflow_branch_id');
    if (activeBranchId) {
      headers['X-Branch-Id'] = activeBranchId;
    }

    return headers;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('http') || endpoint.startsWith('/health') || endpoint.startsWith('/ready')
      ? endpoint 
      : `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const customHeaders = (options.headers as Record<string, string>) || {};
    const headers = this.getHeaders(customHeaders);

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      const isJson = response.headers.get('content-type')?.includes('application/json');
      const body = isJson ? await response.json() : null;

      if (!response.ok) {
        if (response.status === 401 && !endpoint.includes('/auth/login')) {
          localStorage.removeItem('metriflow_token');
          localStorage.removeItem('metriflow_user');
          if (window.location.pathname.startsWith('/app')) {
            window.location.href = '/login';
          }
        }
        const errorMessage = body?.error?.message || body?.message || `Request failed with status ${response.status}`;
        const error = new Error(errorMessage) as any;
        error.code = body?.error?.code || 'API_ERROR';
        error.status = response.status;
        error.details = body?.error?.details;
        throw error;
      }

      return body?.data !== undefined ? body.data : body;
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        throw new Error('Unable to connect to the MetriFlow server. Please ensure the backend is running.');
      }
      throw err;
    }
  }

  get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint;
    if (params) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, String(val));
        }
      });
      const queryString = query.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }
    return this.request<T>(url, { method: 'GET' });
  }

  post<T>(endpoint: string, body?: any, customHeaders?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers: customHeaders,
    });
  }

  put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
