const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') || 'http://127.0.0.1:8000/';

const defaultHeaders = {
  'Content-Type': 'application/json',
};

const parseResponse = async (response) => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch (error) {
    return { raw: text };
  }
};

const buildError = (status, data) => {
  const fallbackMessage = 'Unable to complete the request. Please try again.';
  const apiMessage =
    data?.message ||
    data?.errors?.detail ||
    data?.errors?.email?.[0] ||
    data?.errors?.otp_code ||
    data?.errors?.non_field_errors?.[0] ||
    data?.detail ||
    data?.error;

  const message = apiMessage || fallbackMessage;

  const normalized = message.toString();
  const shouldSuggestSignup =
    /not\s+registered|not\s+found|does\s+not\s+exist|no\s+account/i.test(normalized);

  return {
    status,
    message: normalized,
    suggestSignup: shouldSuggestSignup,
    data,
  };
};

export const authService = {
  async requestOtp(email) {
    const response = await fetch(`${BASE_URL}/registration/login/`, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify({ email }),
    });

    const data = await parseResponse(response);

    if (!response.ok || data?.success === false) {
      throw buildError(response.status, data);
    }

    return data;
  },

  async signup(payload) {
    const response = await fetch(`${BASE_URL}/registration/signup/`, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify(payload),
    });

    const data = await parseResponse(response);

    if (!response.ok || data?.success === false) {
      throw buildError(response.status, data);
    }

    return data;
  },

  async verifyOtp({ email, otp_code }) {
    const response = await fetch(`${BASE_URL}/registration/otp/`, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify({ email, otp_code }),
    });

    const data = await parseResponse(response);

    if (!response.ok || data?.success === false) {
      throw buildError(response.status, data);
    }

    return data;
  },

  async refreshAccessToken(refreshToken) {
    if (!refreshToken) {
      throw buildError(400, { message: 'Refresh token is required.' });
    }

    try {
      const response = await fetch(`${BASE_URL}/registration/refresh/`, {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify({ refresh: refreshToken }),
      });

      const data = await parseResponse(response);

      if (response.ok && data?.access) {
        // SimpleJWT returns only access token, preserve the refresh token
        return { access: data.access, refresh: refreshToken };
      }

      // Handle error response
      throw buildError(response.status, data);
    } catch (error) {
      // If it's already a buildError, rethrow it
      if (error?.status && error?.message) {
        throw error;
      }
      // Otherwise, wrap it
      throw buildError(error?.status || 400, error?.data || { message: 'Unable to refresh session.' });
    }
  },

  async getProtected(endpoint, accessToken, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}${endpoint}`, {
        headers: {
          ...defaultHeaders,
          Authorization: `Bearer ${token}`,
        },
      });

    let response = await makeRequest(accessToken);

    if (response.status === 401 && refreshToken && onTokenRefreshed) {
      try {
        const refreshed = await this.refreshAccessToken(refreshToken);
        onTokenRefreshed(refreshed);
        response = await makeRequest(refreshed.access);
      } catch (refreshError) {
        if (typeof onSessionExpired === 'function') {
          onSessionExpired();
        }
        if (refreshError?.status && refreshError?.message) {
          throw refreshError;
        }
        throw buildError(
          refreshError?.status || 401,
          refreshError?.data || { message: 'Session expired. Please log in again.' }
        );
      }
    }

    const data = await parseResponse(response);

    if (!response.ok) {
      throw buildError(response.status, data);
    }

    return data;
  },

  async getDashboardStats(accessToken, options = {}) {
    const endpoints = [
      { key: 'totalStudents', path: '/institution/total-students/' },
      { key: 'totalLecturers', path: '/institution/total-lecturers/' },
      { key: 'totalStaff', path: '/institution/total-staff/' },
      { key: 'activeStudents', path: '/institution/active-students/' },
      { key: 'activeLecturers', path: '/institution/active-lecturers/' },
      { key: 'activeStaff', path: '/institution/active-staff/' },
    ];

    const results = await Promise.allSettled(
      endpoints.map(({ path }) => this.getProtected(path, accessToken, options))
    );

    return results.reduce((acc, result, index) => {
      const key = endpoints[index].key;

      if (result.status === 'fulfilled') {
        acc[key] = result.value;
      } else {
        const reason = result.reason;
        acc[key] = {
          error:
            typeof reason === 'string'
              ? reason
              : reason?.message || 'Unable to fetch this statistic.',
        };
      }

      return acc;
    }, {});
  },

  async getSchedule(accessToken, options = {}) {
    const data = await this.getProtected('/institution/schedule/', accessToken, options);
    if (!data?.schedule) {
      throw buildError(500, { message: 'Schedule data missing from response.' });
    }
    return data.schedule;
  },

  async checkVerificationStatus(email, accessToken) {
    if (!email) {
      throw buildError(400, { message: 'Email is required to check verification status.' });
    }

    if (!accessToken) {
      throw buildError(401, { message: 'Access token is required to check verification status.' });
    }

    const response = await fetch(`${BASE_URL}/registration/is-verified/?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        ...defaultHeaders,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      throw buildError(response.status, data);
    }

    return data;
  },

  async validateDocumentWithAI(file, accessToken) {
    if (!accessToken) {
      throw buildError(401, { message: 'Access token is required for AI document validation.' });
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${BASE_URL}/ai/doc/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      throw buildError(response.status, data);
    }

    return data;
  },

  async verifyInstitution(accessToken, payload, { refreshToken, onTokenRefreshed } = {}) {
    const formData = new FormData();

    // Append text fields
    if (payload.title) formData.append('title', payload.title);
    if (payload.location) formData.append('location', payload.location);
    if (payload.phone_number) formData.append('phone_number', payload.phone_number);
    if (payload.about) formData.append('about', payload.about);

    // Append file fields
    if (payload.profile_image) formData.append('profile_image', payload.profile_image);
    if (payload.idcard_back) formData.append('idcard_back', payload.idcard_back);
    if (payload.idcard_front) formData.append('idcard_front', payload.idcard_front);
    if (payload.residence_front) formData.append('residence_front', payload.residence_front);
    if (payload.residence_back) formData.append('residence_back', payload.residence_back);

    const response = await fetch(`${BASE_URL}/institution/verify/`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    // Handle token refresh if needed
    if (response.status === 401 && refreshToken && onTokenRefreshed) {
      try {
        const tokens = await this.refreshAccessToken(refreshToken);
        if (typeof onTokenRefreshed === 'function') {
          onTokenRefreshed(tokens);
        }

        // Retry the request with new token
        const retryResponse = await fetch(`${BASE_URL}/institution/verify/`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${tokens.access}`,
          },
          body: formData,
        });

        const retryData = await parseResponse(retryResponse);

        if (!retryResponse.ok) {
          throw buildError(retryResponse.status, retryData);
        }

        return retryData;
      } catch (refreshError) {
        console.error('Token refresh failed during verification:', refreshError);
        throw buildError(
          refreshError?.status || 401,
          refreshError?.data || { message: 'Session expired. Please log in again.' }
        );
      }
    }

    const data = await parseResponse(response);

    if (!response.ok) {
      throw buildError(response.status, data);
    }

    return data;
  },

  async editInstitutionProfile(accessToken, payload, { refreshToken, onTokenRefreshed } = {}) {
    const formData = new FormData();

    // Append text fields (all optional)
    if (payload.username) formData.append('username', payload.username);
    if (payload.first_name) formData.append('first_name', payload.first_name);
    if (payload.last_name) formData.append('last_name', payload.last_name);
    if (payload.title) formData.append('title', payload.title);
    if (payload.location) formData.append('location', payload.location);
    if (payload.phone_number) formData.append('phone_number', payload.phone_number);
    if (payload.about) formData.append('about', payload.about);

    // Append file fields (only if provided)
    if (payload.profile_image) formData.append('profile_image', payload.profile_image);
    if (payload.idcard_back) formData.append('idcard_back', payload.idcard_back);
    if (payload.idcard_front) formData.append('idcard_front', payload.idcard_front);
    if (payload.residence_front) formData.append('residence_front', payload.residence_front);
    if (payload.residence_back) formData.append('residence_back', payload.residence_back);

    const response = await fetch(`${BASE_URL}/institution/edit/`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    // Handle token refresh if needed
    if (response.status === 401 && refreshToken && onTokenRefreshed) {
      try {
        const tokens = await this.refreshAccessToken(refreshToken);
        if (typeof onTokenRefreshed === 'function') {
          onTokenRefreshed(tokens);
        }

        // Retry the request with new token
        const retryResponse = await fetch(`${BASE_URL}/institution/edit/`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${tokens.access}`,
          },
          body: formData,
        });

        const retryData = await parseResponse(retryResponse);

        if (!retryResponse.ok) {
          throw buildError(retryResponse.status, retryData);
        }

        return retryData;
      } catch (refreshError) {
        console.error('Token refresh failed during profile edit:', refreshError);
        throw buildError(
          refreshError?.status || 401,
          refreshError?.data || { message: 'Session expired. Please log in again.' }
        );
      }
    }

    const data = await parseResponse(response);

    if (!response.ok) {
      throw buildError(response.status, data);
    }

    return data;
  },

  async getFeed(accessToken = null, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;
    
    const headers = { ...defaultHeaders };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const makeRequest = async (token = null) => {
      const requestHeaders = { ...defaultHeaders };
      if (token) {
        requestHeaders.Authorization = `Bearer ${token}`;
      }
      return fetch(`${BASE_URL}/home/feed/`, {
        headers: requestHeaders,
      });
    };

    let response = await makeRequest(accessToken);

    // Handle token refresh if needed (only if token was provided)
    if (response.status === 401 && accessToken && refreshToken && onTokenRefreshed) {
      try {
        const refreshed = await this.refreshAccessToken(refreshToken);
        onTokenRefreshed(refreshed);
        response = await makeRequest(refreshed.access);
      } catch (refreshError) {
        if (typeof onSessionExpired === 'function') {
          onSessionExpired();
        }
        if (refreshError?.status && refreshError?.message) {
          throw refreshError;
        }
        throw buildError(
          refreshError?.status || 401,
          refreshError?.data || { message: 'Session expired. Please log in again.' }
        );
      }
    }

    const data = await parseResponse(response);

    if (!response.ok) {
      throw buildError(response.status, data);
    }

    return data;
  },

  async getNotifications(accessToken, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/notifications/`, {
        headers: {
          ...defaultHeaders,
          Authorization: `Bearer ${token}`,
        },
      });

    let response = await makeRequest(accessToken);

    // Handle token refresh if needed
    if (response.status === 401 && refreshToken && onTokenRefreshed) {
      try {
        const refreshed = await this.refreshAccessToken(refreshToken);
        onTokenRefreshed(refreshed);
        response = await makeRequest(refreshed.access);
      } catch (refreshError) {
        if (typeof onSessionExpired === 'function') {
          onSessionExpired();
        }
        if (refreshError?.status && refreshError?.message) {
          throw refreshError;
        }
        throw buildError(
          refreshError?.status || 401,
          refreshError?.data || { message: 'Session expired. Please log in again.' }
        );
      }
    }

    const data = await parseResponse(response);

    if (!response.ok) {
      throw buildError(response.status, data);
    }

    return data;
  },

  async exploreSearch(query = '', filter = null, accessToken = null, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    // Build query string
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (filter) params.append('filter', filter);
    const queryString = params.toString();

    const headers = { ...defaultHeaders };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const makeRequest = async (token = null) => {
      const requestHeaders = { ...defaultHeaders };
      if (token) {
        requestHeaders.Authorization = `Bearer ${token}`;
      }
      return fetch(`${BASE_URL}/explore/${queryString ? `?${queryString}` : ''}`, {
        headers: requestHeaders,
      });
    };

    let response = await makeRequest(accessToken);

    // Handle token refresh if needed (only if token was provided)
    if (response.status === 401 && accessToken && refreshToken && onTokenRefreshed) {
      try {
        const refreshed = await this.refreshAccessToken(refreshToken);
        onTokenRefreshed(refreshed);
        response = await makeRequest(refreshed.access);
      } catch (refreshError) {
        if (typeof onSessionExpired === 'function') {
          onSessionExpired();
        }
        if (refreshError?.status && refreshError?.message) {
          throw refreshError;
        }
        throw buildError(
          refreshError?.status || 401,
          refreshError?.data || { message: 'Session expired. Please log in again.' }
        );
      }
    }

    const data = await parseResponse(response);

    if (!response.ok) {
      throw buildError(response.status, data);
    }

    return data;
  },

  async getLecturerProfile(accessToken, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/lecturer/profile/self/`, {
        headers: {
          ...defaultHeaders,
          Authorization: `Bearer ${token}`,
        },
      });

    let response = await makeRequest(accessToken);

    // Handle token refresh if needed
    if (response.status === 401 && refreshToken && onTokenRefreshed) {
      try {
        const refreshed = await this.refreshAccessToken(refreshToken);
        onTokenRefreshed(refreshed);
        response = await makeRequest(refreshed.access);
      } catch (refreshError) {
        if (typeof onSessionExpired === 'function') {
          onSessionExpired();
        }
        if (refreshError?.status && refreshError?.message) {
          throw refreshError;
        }
        throw buildError(
          refreshError?.status || 401,
          refreshError?.data || { message: 'Session expired. Please log in again.' }
        );
      }
    }

    const data = await parseResponse(response);

    if (!response.ok) {
      throw buildError(response.status, data);
    }

    return data;
  },

  async getStudentProfile(accessToken, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/student/profile/self/`, {
        headers: {
          ...defaultHeaders,
          Authorization: `Bearer ${token}`,
        },
      });

    let response = await makeRequest(accessToken);

    // Handle token refresh if needed
    if (response.status === 401 && refreshToken && onTokenRefreshed) {
      try {
        const refreshed = await this.refreshAccessToken(refreshToken);
        onTokenRefreshed(refreshed);
        response = await makeRequest(refreshed.access);
      } catch (refreshError) {
        if (typeof onSessionExpired === 'function') {
          onSessionExpired();
        }
        if (refreshError?.status && refreshError?.message) {
          throw refreshError;
        }
        throw buildError(
          refreshError?.status || 401,
          refreshError?.data || { message: 'Session expired. Please log in again.' }
        );
      }
    }

    const data = await parseResponse(response);

    if (!response.ok) {
      throw buildError(response.status, data);
    }

    return data;
  },

  async editLecturerProfile(accessToken, payload, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    const formData = new FormData();

    // Append text fields (only if provided)
    if (payload.username) formData.append('username', payload.username);
    if (payload.first_name) formData.append('first_name', payload.first_name);
    if (payload.last_name) formData.append('last_name', payload.last_name);
    if (payload.city) formData.append('city', payload.city);
    if (payload.phone_number) formData.append('phone_number', payload.phone_number);
    if (payload.about) formData.append('about', payload.about);
    if (payload.academic_achievement) formData.append('academic_achievement', payload.academic_achievement);
    if (payload.specialty) formData.append('specialty', payload.specialty);
    if (payload.skills) formData.append('skills', payload.skills);
    if (payload.experience !== undefined) formData.append('experience', payload.experience);
    if (payload.free_time) formData.append('free_time', payload.free_time);

    // Append file fields (only if provided)
    if (payload.profile_image) formData.append('profile_image', payload.profile_image);
    if (payload.idcard_back) formData.append('idcard_back', payload.idcard_back);
    if (payload.idcard_front) formData.append('idcard_front', payload.idcard_front);
    if (payload.residence_front) formData.append('residence_front', payload.residence_front);
    if (payload.residence_back) formData.append('residence_back', payload.residence_back);

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/lecturer/profile/edit/`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

    let response = await makeRequest(accessToken);

    // Handle token refresh if needed
    if (response.status === 401 && refreshToken && onTokenRefreshed) {
      try {
        const refreshed = await this.refreshAccessToken(refreshToken);
        onTokenRefreshed(refreshed);
        response = await makeRequest(refreshed.access);
      } catch (refreshError) {
        if (typeof onSessionExpired === 'function') {
          onSessionExpired();
        }
        if (refreshError?.status && refreshError?.message) {
          throw refreshError;
        }
        throw buildError(
          refreshError?.status || 401,
          refreshError?.data || { message: 'Session expired. Please log in again.' }
        );
      }
    }

    const data = await parseResponse(response);

    if (!response.ok) {
      throw buildError(response.status, data);
    }

    return data;
  },

  async editStudentProfile(accessToken, payload, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    const formData = new FormData();

    // Append text fields (only if provided)
    if (payload.username) formData.append('username', payload.username);
    if (payload.first_name) formData.append('first_name', payload.first_name);
    if (payload.last_name) formData.append('last_name', payload.last_name);
    if (payload.city) formData.append('city', payload.city);
    if (payload.phone_number) formData.append('phone_number', payload.phone_number);
    if (payload.about) formData.append('about', payload.about);
    if (payload.studying_level) formData.append('studying_level', payload.studying_level);
    if (payload.interesting_keywords) formData.append('interesting_keywords', payload.interesting_keywords);
    if (payload.responsible_phone) formData.append('responsible_phone', payload.responsible_phone);
    if (payload.responsible_email) formData.append('responsible_email', payload.responsible_email);

    // Append file fields (only if provided)
    if (payload.profile_image) formData.append('profile_image', payload.profile_image);
    if (payload.idcard_back) formData.append('idcard_back', payload.idcard_back);
    if (payload.idcard_front) formData.append('idcard_front', payload.idcard_front);
    if (payload.residence_front) formData.append('residence_front', payload.residence_front);
    if (payload.residence_back) formData.append('residence_back', payload.residence_back);

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/student/profile/edit/`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

    let response = await makeRequest(accessToken);

    // Handle token refresh if needed
    if (response.status === 401 && refreshToken && onTokenRefreshed) {
      try {
        const refreshed = await this.refreshAccessToken(refreshToken);
        onTokenRefreshed(refreshed);
        response = await makeRequest(refreshed.access);
      } catch (refreshError) {
        if (typeof onSessionExpired === 'function') {
          onSessionExpired();
        }
        if (refreshError?.status && refreshError?.message) {
          throw refreshError;
        }
        throw buildError(
          refreshError?.status || 401,
          refreshError?.data || { message: 'Session expired. Please log in again.' }
        );
      }
    }

    const data = await parseResponse(response);

    if (!response.ok) {
      throw buildError(response.status, data);
    }

    return data;
  },

  async getInstitutionProfile(accessToken, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/institution/profile/self/`, {
        headers: {
          ...defaultHeaders,
          Authorization: `Bearer ${token}`,
        },
      });

    let response = await makeRequest(accessToken);

    // Handle token refresh if needed
    if (response.status === 401 && refreshToken && onTokenRefreshed) {
      try {
        const refreshed = await this.refreshAccessToken(refreshToken);
        onTokenRefreshed(refreshed);
        response = await makeRequest(refreshed.access);
      } catch (refreshError) {
        if (typeof onSessionExpired === 'function') {
          onSessionExpired();
        }
        if (refreshError?.status && refreshError?.message) {
          throw refreshError;
        }
        throw buildError(
          refreshError?.status || 401,
          refreshError?.data || { message: 'Session expired. Please log in again.' }
        );
      }
    }

    const data = await parseResponse(response);

    if (!response.ok) {
      throw buildError(response.status, data);
    }

    return data;
  },

  // Get public lecturer profile by username (no auth required)
  async getLecturerPublicProfile(username) {
    const response = await fetch(`${BASE_URL}/lecturer/profile/${username}/`, {
      headers: defaultHeaders,
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      throw buildError(response.status, data);
    }

    return data;
  },

  // Get public institution profile by username (no auth required)
  async getInstitutionPublicProfile(username) {
    const response = await fetch(`${BASE_URL}/institution/profile/${username}/`, {
      headers: defaultHeaders,
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      throw buildError(response.status, data);
    }

    return data;
  },

  // Get institution posts (public, no auth required)
  async getInstitutionPosts(username) {
    const response = await fetch(`${BASE_URL}/institution/${username}/posts/`, {
      headers: defaultHeaders,
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      throw buildError(response.status, data);
    }

    return data;
  },

  // Get public student profile by username (no auth required)
  async getStudentPublicProfile(username) {
    const response = await fetch(`${BASE_URL}/student/profile/${username}/`, {
      headers: defaultHeaders,
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      throw buildError(response.status, data);
    }

    return data;
  },

  // Get single job post details
  async getJobDetails(jobId) {
    const response = await fetch(`${BASE_URL}/institution/job/${jobId}/`, {
      method: 'GET',
      headers: defaultHeaders,
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      throw buildError(response.status, data);
    }

    return data;
  },

  // Apply to a job post (lecturer only, verified)
  async applyToJob(accessToken, jobId, message = '', options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/lecturer/job/${jobId}/apply/`, {
        method: 'POST',
        headers: {
          ...defaultHeaders,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: message || '' }),
      });

    let response = await makeRequest(accessToken);

    // Handle token refresh if needed
    if (response.status === 401 && refreshToken && onTokenRefreshed) {
      try {
        const refreshed = await this.refreshAccessToken(refreshToken);
        onTokenRefreshed(refreshed);
        response = await makeRequest(refreshed.access);
      } catch (refreshError) {
        if (typeof onSessionExpired === 'function') {
          onSessionExpired();
        }
        if (refreshError?.status && refreshError?.message) {
          throw refreshError;
        }
        throw buildError(
          refreshError?.status || 401,
          refreshError?.data || { message: 'Session expired. Please log in again.' }
        );
      }
    }

    const data = await parseResponse(response);

    if (!response.ok) {
      throw buildError(response.status, data);
    }

    return data;
  },

  async getInstitutionJobs(username) {
    const response = await fetch(`${BASE_URL}/institution/${username}/jobs/`, {
      headers: defaultHeaders,
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      throw buildError(response.status, data);
    }

    return data;
  },

  // Edit institution profile
  async editInstitutionProfile(accessToken, payload, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    const formData = new FormData();

    // Append text fields (only if provided)
    if (payload.username) formData.append('username', payload.username);
    if (payload.first_name) formData.append('first_name', payload.first_name);
    if (payload.last_name) formData.append('last_name', payload.last_name);
    if (payload.city) formData.append('city', payload.city);
    if (payload.phone_number) formData.append('phone_number', payload.phone_number);
    if (payload.about) formData.append('about', payload.about);
    if (payload.title) formData.append('title', payload.title);
    if (payload.location) formData.append('location', payload.location);

    // Append file fields (only if provided)
    if (payload.profile_image) formData.append('profile_image', payload.profile_image);
    if (payload.idcard_back) formData.append('idcard_back', payload.idcard_back);
    if (payload.idcard_front) formData.append('idcard_front', payload.idcard_front);
    if (payload.residence_front) formData.append('residence_front', payload.residence_front);
    if (payload.residence_back) formData.append('residence_back', payload.residence_back);

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/institution/edit/`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

    let response = await makeRequest(accessToken);

    // Handle token refresh if needed
    if (response.status === 401 && refreshToken && onTokenRefreshed) {
      try {
        const refreshed = await this.refreshAccessToken(refreshToken);
        onTokenRefreshed(refreshed);
        response = await makeRequest(refreshed.access);
      } catch (refreshError) {
        if (typeof onSessionExpired === 'function') {
          onSessionExpired();
        }
        if (refreshError?.status && refreshError?.message) {
          throw refreshError;
        }
        throw buildError(
          refreshError?.status || 401,
          refreshError?.data || { message: 'Session expired. Please log in again.' }
        );
      }
    }

    const data = await parseResponse(response);

    if (!response.ok) {
      throw buildError(response.status, data);
    }

    return data;
  },

  // Get lecturer schedule (requires auth + verified)
  async getLecturerSchedule(accessToken, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/lecturer/schedule/`, {
        headers: {
          ...defaultHeaders,
          Authorization: `Bearer ${token}`,
        },
      });

    let response = await makeRequest(accessToken);

    // Handle token refresh if needed
    if (response.status === 401 && refreshToken && onTokenRefreshed) {
      try {
        const refreshed = await this.refreshAccessToken(refreshToken);
        onTokenRefreshed(refreshed);
        response = await makeRequest(refreshed.access);
      } catch (refreshError) {
        if (typeof onSessionExpired === 'function') {
          onSessionExpired();
        }
        if (refreshError?.status && refreshError?.message) {
          throw refreshError;
        }
        throw buildError(
          refreshError?.status || 401,
          refreshError?.data || { message: 'Session expired. Please log in again.' }
        );
      }
    }

    const data = await parseResponse(response);

    if (!response.ok) {
      throw buildError(response.status, data);
    }

    return data;
  },

  // Get student schedule (requires auth + verified)
  async getStudentSchedule(accessToken, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/student/schedule/`, {
        headers: {
          ...defaultHeaders,
          Authorization: `Bearer ${token}`,
        },
      });

    let response = await makeRequest(accessToken);

    // Handle token refresh if needed
    if (response.status === 401 && refreshToken && onTokenRefreshed) {
      try {
        const refreshed = await this.refreshAccessToken(refreshToken);
        onTokenRefreshed(refreshed);
        response = await makeRequest(refreshed.access);
      } catch (refreshError) {
        if (typeof onSessionExpired === 'function') {
          onSessionExpired();
        }
        if (refreshError?.status && refreshError?.message) {
          throw refreshError;
        }
        throw buildError(
          refreshError?.status || 401,
          refreshError?.data || { message: 'Session expired. Please log in again.' }
        );
      }
    }

    const data = await parseResponse(response);

    if (!response.ok) {
      throw buildError(response.status, data);
    }

    return data;
  },

  // Create job post
  async createJobPost(accessToken, payload, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    // Validate access token
    if (!accessToken || typeof accessToken !== 'string' || accessToken.trim() === '') {
      throw buildError(401, {
        message: 'Authentication token is missing or invalid. Please log in again.',
        detail: 'Authentication credentials were not provided.'
      });
    }

    // Prepare request body (can be JSON or form-data, using JSON for simplicity)
    const requestBody = {
      title: payload.title,
      description: payload.description || '',
      specialty: payload.specialty,
      experience_required: payload.experience_required,
      skills_required: payload.skills_required || '',
      salary_offer: payload.salary_offer,
    };

    const makeRequest = async (token) => {
      if (!token || typeof token !== 'string' || token.trim() === '') {
        throw buildError(401, {
          message: 'Authentication token is missing or invalid.',
          detail: 'Authentication credentials were not provided.'
        });
      }

      return fetch(`${BASE_URL}/institution/job/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });
    };

    let response = await makeRequest(accessToken);

    // Handle token refresh if needed
    if (response.status === 401 && refreshToken && onTokenRefreshed) {
      try {
        const refreshed = await this.refreshAccessToken(refreshToken);
        onTokenRefreshed(refreshed);
        response = await makeRequest(refreshed.access);
      } catch (refreshError) {
        if (typeof onSessionExpired === 'function') {
          onSessionExpired();
        }
        if (refreshError?.status && refreshError?.message) {
          throw refreshError;
        }
        throw buildError(
          refreshError?.status || 401,
          refreshError?.data || { message: 'Session expired. Please log in again.' }
        );
      }
    }

    const data = await parseResponse(response);

    if (!response.ok) {
      throw buildError(response.status, data);
    }

    return data;
  },

  // Create institution post
  async createInstitutionPost(accessToken, payload, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    // Validate access token
    if (!accessToken || typeof accessToken !== 'string' || accessToken.trim() === '') {
      throw buildError(401, {
        message: 'Authentication token is missing or invalid. Please log in again.',
        detail: 'Authentication credentials were not provided.'
      });
    }

    const formData = new FormData();
    
    // Required field: title
    formData.append('title', payload.title);
    
    // Optional field: description (send empty string if not provided)
    formData.append('description', payload.description || '');
    
    // Optional field: images (0..N files, only append if provided)
    if (payload.images && Array.isArray(payload.images) && payload.images.length > 0) {
      payload.images.forEach((image) => {
        if (image instanceof File) {
          formData.append('images', image);
        }
      });
    }

    const makeRequest = async (token) => {
      if (!token || typeof token !== 'string' || token.trim() === '') {
        throw buildError(401, {
          message: 'Authentication token is missing or invalid.',
          detail: 'Authentication credentials were not provided.'
        });
      }

      return fetch(`${BASE_URL}/institution/create-post/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
    };

    let response = await makeRequest(accessToken);

    // Handle token refresh if needed
    if (response.status === 401 && refreshToken && onTokenRefreshed) {
      try {
        const refreshed = await this.refreshAccessToken(refreshToken);
        onTokenRefreshed(refreshed);
        response = await makeRequest(refreshed.access);
      } catch (refreshError) {
        if (typeof onSessionExpired === 'function') {
          onSessionExpired();
        }
        if (refreshError?.status && refreshError?.message) {
          throw refreshError;
        }
        throw buildError(
          refreshError?.status || 401,
          refreshError?.data || { message: 'Session expired. Please log in again.' }
        );
      }
    }

    const data = await parseResponse(response);

    if (!response.ok) {
      throw buildError(response.status, data);
    }

    return data;
  },

  // Create institution course
  async createInstitutionCourse(accessToken, payload, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    const formData = new FormData();
    
    // Required fields
    formData.append('title', payload.title);
    formData.append('about', payload.about);
    formData.append('starting_date', payload.starting_date);
    formData.append('ending_date', payload.ending_date);
    formData.append('level', payload.level);
    formData.append('price', payload.price);
    
    // Days array - append each day
    if (payload.days && Array.isArray(payload.days)) {
      payload.days.forEach((day) => {
        formData.append('days', day);
      });
    }
    
    formData.append('start_time', payload.start_time);
    formData.append('end_time', payload.end_time);
    formData.append('lecturer', payload.lecturer);
    
    // Optional fields
    if (payload.course_image) {
      formData.append('course_image', payload.course_image);
    }

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/institution/create-course/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

    let response = await makeRequest(accessToken);

    // Handle token refresh if needed
    if (response.status === 401 && refreshToken && onTokenRefreshed) {
      try {
        const refreshed = await this.refreshAccessToken(refreshToken);
        onTokenRefreshed(refreshed);
        response = await makeRequest(refreshed.access);
      } catch (refreshError) {
        if (typeof onSessionExpired === 'function') {
          onSessionExpired();
        }
        if (refreshError?.status && refreshError?.message) {
          throw refreshError;
        }
        throw buildError(
          refreshError?.status || 401,
          refreshError?.data || { message: 'Session expired. Please log in again.' }
        );
      }
    }

    const data = await parseResponse(response);

    if (!response.ok) {
      throw buildError(response.status, data);
    }

    return data;
  },

  // Edit institution course
  async editInstitutionCourse(accessToken, courseId, payload, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    const formData = new FormData();
    
    // Append only provided fields (partial update)
    if (payload.title) formData.append('title', payload.title);
    if (payload.about) formData.append('about', payload.about);
    if (payload.starting_date) formData.append('starting_date', payload.starting_date);
    if (payload.ending_date) formData.append('ending_date', payload.ending_date);
    if (payload.level) formData.append('level', payload.level);
    if (payload.price !== undefined) formData.append('price', payload.price);
    
    // Days array - append each day if provided
    if (payload.days && Array.isArray(payload.days)) {
      payload.days.forEach((day) => {
        formData.append('days', day);
      });
    }
    
    if (payload.start_time) formData.append('start_time', payload.start_time);
    if (payload.end_time) formData.append('end_time', payload.end_time);
    if (payload.lecturer) formData.append('lecturer', payload.lecturer);
    if (payload.course_image) formData.append('course_image', payload.course_image);

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/institution/edit-course/${courseId}/`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

    let response = await makeRequest(accessToken);

    // Handle token refresh if needed
    if (response.status === 401 && refreshToken && onTokenRefreshed) {
      try {
        const refreshed = await this.refreshAccessToken(refreshToken);
        onTokenRefreshed(refreshed);
        response = await makeRequest(refreshed.access);
      } catch (refreshError) {
        if (typeof onSessionExpired === 'function') {
          onSessionExpired();
        }
        if (refreshError?.status && refreshError?.message) {
          throw refreshError;
        }
        throw buildError(
          refreshError?.status || 401,
          refreshError?.data || { message: 'Session expired. Please log in again.' }
        );
      }
    }

    const data = await parseResponse(response);

    if (!response.ok) {
      throw buildError(response.status, data);
    }

    return data;
  },

  // Create staff member
  async createStaff(accessToken, payload, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    const formData = new FormData();
    
    // Required fields
    formData.append('first_name', payload.first_name);
    formData.append('last_name', payload.last_name);
    formData.append('phone_number', payload.phone_number);
    formData.append('duty', payload.duty);
    formData.append('salary', payload.salary);
    
    // Required file
    if (payload.personal_image) {
      formData.append('personal_image', payload.personal_image);
    }
    
    // Optional files
    if (payload.idcard_front) {
      formData.append('idcard_front', payload.idcard_front);
    }
    if (payload.idcard_back) {
      formData.append('idcard_back', payload.idcard_back);
    }
    if (payload.residence_front) {
      formData.append('residence_front', payload.residence_front);
    }
    if (payload.residence_back) {
      formData.append('residence_back', payload.residence_back);
    }

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/institution/staff/create/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

    let response = await makeRequest(accessToken);

    // Handle token refresh if needed
    if (response.status === 401 && refreshToken && onTokenRefreshed) {
      try {
        const refreshed = await this.refreshAccessToken(refreshToken);
        onTokenRefreshed(refreshed);
        response = await makeRequest(refreshed.access);
      } catch (refreshError) {
        if (typeof onSessionExpired === 'function') {
          onSessionExpired();
        }
        if (refreshError?.status && refreshError?.message) {
          throw refreshError;
        }
        throw buildError(
          refreshError?.status || 401,
          refreshError?.data || { message: 'Session expired. Please log in again.' }
        );
      }
    }

    const data = await parseResponse(response);

    if (!response.ok) {
      throw buildError(response.status, data);
    }

    return data;
  },

  // Get staff member details
  async getStaffDetails(accessToken, staffId, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/institution/staff/${staffId}/`, {
        headers: {
          ...defaultHeaders,
          Authorization: `Bearer ${token}`,
        },
      });

    let response = await makeRequest(accessToken);

    // Handle token refresh if needed
    if (response.status === 401 && refreshToken && onTokenRefreshed) {
      try {
        const refreshed = await this.refreshAccessToken(refreshToken);
        onTokenRefreshed(refreshed);
        response = await makeRequest(refreshed.access);
      } catch (refreshError) {
        if (typeof onSessionExpired === 'function') {
          onSessionExpired();
        }
        if (refreshError?.status && refreshError?.message) {
          throw refreshError;
        }
        throw buildError(
          refreshError?.status || 401,
          refreshError?.data || { message: 'Session expired. Please log in again.' }
        );
      }
    }

    const data = await parseResponse(response);

    if (!response.ok) {
      throw buildError(response.status, data);
    }

    return data;
  },

  // Edit staff member
  async editStaff(accessToken, staffId, payload, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    const formData = new FormData();
    
    // Append only provided fields (partial update)
    if (payload.first_name) formData.append('first_name', payload.first_name);
    if (payload.last_name) formData.append('last_name', payload.last_name);
    if (payload.phone_number) formData.append('phone_number', payload.phone_number);
    if (payload.duty) formData.append('duty', payload.duty);
    if (payload.salary !== undefined) formData.append('salary', payload.salary);
    
    // Files
    if (payload.personal_image) formData.append('personal_image', payload.personal_image);
    if (payload.idcard_front) formData.append('idcard_front', payload.idcard_front);
    if (payload.idcard_back) formData.append('idcard_back', payload.idcard_back);
    if (payload.residence_front) formData.append('residence_front', payload.residence_front);
    if (payload.residence_back) formData.append('residence_back', payload.residence_back);

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/institution/staff/${staffId}/edit/`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

    let response = await makeRequest(accessToken);

    // Handle token refresh if needed
    if (response.status === 401 && refreshToken && onTokenRefreshed) {
      try {
        const refreshed = await this.refreshAccessToken(refreshToken);
        onTokenRefreshed(refreshed);
        response = await makeRequest(refreshed.access);
      } catch (refreshError) {
        if (typeof onSessionExpired === 'function') {
          onSessionExpired();
        }
        if (refreshError?.status && refreshError?.message) {
          throw refreshError;
        }
        throw buildError(
          refreshError?.status || 401,
          refreshError?.data || { message: 'Session expired. Please log in again.' }
        );
      }
    }

    const data = await parseResponse(response);

    if (!response.ok) {
      throw buildError(response.status, data);
    }

    return data;
  },

  // Delete staff member
  async deleteStaff(accessToken, staffId, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/institution/staff/${staffId}/delete/`, {
        method: 'DELETE',
        headers: {
          ...defaultHeaders,
          Authorization: `Bearer ${token}`,
        },
      });

    let response = await makeRequest(accessToken);

    // Handle token refresh if needed
    if (response.status === 401 && refreshToken && onTokenRefreshed) {
      try {
        const refreshed = await this.refreshAccessToken(refreshToken);
        onTokenRefreshed(refreshed);
        response = await makeRequest(refreshed.access);
      } catch (refreshError) {
        if (typeof onSessionExpired === 'function') {
          onSessionExpired();
        }
        if (refreshError?.status && refreshError?.message) {
          throw refreshError;
        }
        throw buildError(
          refreshError?.status || 401,
          refreshError?.data || { message: 'Session expired. Please log in again.' }
        );
      }
    }

    const data = await parseResponse(response);

    if (!response.ok) {
      throw buildError(response.status, data);
    }

    return data;
  },

  // AI Document Check
  async checkDocument(accessToken, file, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    const formData = new FormData();
    formData.append('file', file);

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/ai/doc/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

    let response = await makeRequest(accessToken);

    // Handle token refresh if needed
    if (response.status === 401 && refreshToken && onTokenRefreshed) {
      try {
        const refreshed = await this.refreshAccessToken(refreshToken);
        onTokenRefreshed(refreshed);
        response = await makeRequest(refreshed.access);
      } catch (refreshError) {
        if (typeof onSessionExpired === 'function') {
          onSessionExpired();
        }
        if (refreshError?.status && refreshError?.message) {
          throw refreshError;
        }
        throw buildError(
          refreshError?.status || 401,
          refreshError?.data || { message: 'Session expired. Please log in again.' }
        );
      }
    }

    const data = await parseResponse(response);

    if (!response.ok) {
      throw buildError(response.status, data);
    }

    return data;
  },

  // Verify lecturer account
  async verifyLecturer(accessToken, payload, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    // Validate access token
    if (!accessToken) {
      throw buildError(401, { message: 'Authentication credentials were not provided.' });
    }

    const formData = new FormData();
    
    // Required fields
    formData.append('phone_number', payload.phone_number);
    formData.append('about', payload.about);
    formData.append('academic_achievement', payload.academic_achievement);
    formData.append('specialty', payload.specialty);
    formData.append('skills', payload.skills);
    formData.append('experience', payload.experience);
    formData.append('free_time', payload.free_time);
    
    // Required files
    if (payload.profile_image) formData.append('profile_image', payload.profile_image);
    if (payload.idcard_front) formData.append('idcard_front', payload.idcard_front);
    if (payload.idcard_back) formData.append('idcard_back', payload.idcard_back);
    if (payload.residence_front) formData.append('residence_front', payload.residence_front);
    if (payload.residence_back) formData.append('residence_back', payload.residence_back);

    const makeRequest = async (token) => {
      if (!token) {
        throw buildError(401, { message: 'Authentication credentials were not provided.' });
      }
      return fetch(`${BASE_URL}/lecturer/verify/`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
    };

    let response = await makeRequest(accessToken);

    // Handle token refresh if needed
    if (response.status === 401 && refreshToken && onTokenRefreshed) {
      try {
        const refreshed = await this.refreshAccessToken(refreshToken);
        onTokenRefreshed(refreshed);
        response = await makeRequest(refreshed.access);
      } catch (refreshError) {
        if (typeof onSessionExpired === 'function') {
          onSessionExpired();
        }
        if (refreshError?.status && refreshError?.message) {
          throw refreshError;
        }
        throw buildError(
          refreshError?.status || 401,
          refreshError?.data || { message: 'Session expired. Please log in again.' }
        );
      }
    }

    const data = await parseResponse(response);

    if (!response.ok) {
      throw buildError(response.status, data);
    }

    return data;
  },

  async verifyStudent(accessToken, payload, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    // Validate access token
    if (!accessToken) {
      throw buildError(401, { message: 'Authentication credentials were not provided.' });
    }

    // Create FormData for multipart/form-data request
    const formData = new FormData();
    
    // Required text fields - always append (backend will validate)
    formData.append('phone_number', payload.phone_number || '');
    formData.append('about', payload.about || '');
    formData.append('studying_level', payload.studying_level || '');
    
    // Optional text fields - only append if they exist and have non-empty values
    if (payload.responsible_phone && payload.responsible_phone.trim()) {
      formData.append('responsible_phone', payload.responsible_phone.trim());
    }
    if (payload.responsible_email && payload.responsible_email.trim()) {
      formData.append('responsible_email', payload.responsible_email.trim());
    }
    
    // Required file fields - append if they exist (backend will validate if missing)
    if (payload.profile_image) {
      formData.append('profile_image', payload.profile_image);
    }
    if (payload.idcard_front) {
      formData.append('idcard_front', payload.idcard_front);
    }
    if (payload.idcard_back) {
      formData.append('idcard_back', payload.idcard_back);
    }
    if (payload.residence_front) {
      formData.append('residence_front', payload.residence_front);
    }
    if (payload.residence_back) {
      formData.append('residence_back', payload.residence_back);
    }

    // Debug: Log FormData contents (for development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('Student verification FormData:', {
        phone_number: payload.phone_number,
        about: payload.about,
        studying_level: payload.studying_level,
        responsible_phone: payload.responsible_phone || '(not provided)',
        responsible_email: payload.responsible_email || '(not provided)',
        profile_image: payload.profile_image ? payload.profile_image.name || 'File' : '(not provided)',
        idcard_front: payload.idcard_front ? payload.idcard_front.name || 'File' : '(not provided)',
        idcard_back: payload.idcard_back ? payload.idcard_back.name || 'File' : '(not provided)',
        residence_front: payload.residence_front ? payload.residence_front.name || 'File' : '(not provided)',
        residence_back: payload.residence_back ? payload.residence_back.name || 'File' : '(not provided)',
      });
    }

    const makeRequest = async (token) => {
      if (!token) {
        throw buildError(401, { message: 'Authentication credentials were not provided.' });
      }
      // PUT /student/verify/ - no ID in URL, backend uses JWT token from Authorization header
      // multipart/form-data - browser sets Content-Type header automatically with boundary
      // Do NOT manually set Content-Type header - browser will set it correctly
      return fetch(`${BASE_URL}/student/verify/`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          // Note: Do NOT set Content-Type header - browser will automatically set:
          // Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
        },
        body: formData,
      });
    };

    let response = await makeRequest(accessToken);

    // Handle token refresh if needed
    if (response.status === 401 && refreshToken && onTokenRefreshed) {
      try {
        const refreshed = await this.refreshAccessToken(refreshToken);
        onTokenRefreshed(refreshed);
        response = await makeRequest(refreshed.access);
      } catch (refreshError) {
        if (typeof onSessionExpired === 'function') {
          onSessionExpired();
        }
        if (refreshError?.status && refreshError?.message) {
          throw refreshError;
        }
        throw buildError(
          refreshError?.status || 401,
          refreshError?.data || { message: 'Session expired. Please log in again.' }
        );
      }
    }

    const data = await parseResponse(response);

    if (!response.ok) {
      throw buildError(response.status, data);
    }

    return data;
  },

  // Get full course details by course ID (public, no auth required)
  async getCourseDetails(courseId) {
    const response = await fetch(`${BASE_URL}/course/${courseId}/`, {
      headers: defaultHeaders,
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      throw buildError(response.status, data);
    }

    return data;
  },

  // Get courses enrolled by a student (public, no auth required)
  async getStudentCourses(username) {
    const response = await fetch(`${BASE_URL}/student/${username}/courses/`, {
      headers: defaultHeaders,
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      throw buildError(response.status, data);
    }

    return data;
  },
};


