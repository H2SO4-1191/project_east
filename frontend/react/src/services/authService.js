const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') || 'https://projecteastapi.ddns.net';

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

  // Get lecturer's own profile (self) - for verified lecturers
  async getLecturerProfileSelf(accessToken, options = {}) {
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

  // Get lecturer's own profile (my-profile) - for non-verified lecturers
  async getLecturerMyProfile(accessToken, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/lecturer/my-profile/`, {
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

  // Get lecturer profile (for their own profile - uses my-profile endpoint for all lecturers)
  async getLecturerProfile(accessToken, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    // Use my-profile endpoint for both verified and non-verified lecturers
    return this.getLecturerMyProfile(accessToken, { refreshToken, onTokenRefreshed, onSessionExpired });
  },

  // Get student's own full profile (requires JWT, for verified students)
  async getStudentProfileSelf(accessToken, options = {}) {
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

  // Get student's own profile using my-profile endpoint (for both verified and non-verified)
  async getStudentMyProfile(accessToken, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/student/my-profile/`, {
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

  // Smart routing for student profile (uses my-profile endpoint for both verified and non-verified)
  async getStudentProfile(accessToken, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;
    // Both verified and non-verified students now use the 'my-profile' endpoint
    return this.getStudentMyProfile(accessToken, { refreshToken, onTokenRefreshed, onSessionExpired });
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
    if (payload.residence_back) formData.append('residence_back', payload.residence_back);

    // Append social media links
    if (payload.facebook_link !== undefined) formData.append('facebook_link', payload.facebook_link);
    if (payload.instagram_link !== undefined) formData.append('instagram_link', payload.instagram_link);
    if (payload.x_link !== undefined) formData.append('x_link', payload.x_link);
    if (payload.tiktok_link !== undefined) formData.append('tiktok_link', payload.tiktok_link);

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/lecturer/edit-profile/`, {
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
      fetch(`${BASE_URL}/student/edit-profile/`, {
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
      fetch(`${BASE_URL}/institution/my-profile/`, {
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

  // Get institution courses (public endpoint)
  async getInstitutionCourses(username) {
    const response = await fetch(`${BASE_URL}/institution/${username}/courses/`, {
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

  // Mark a lecturer for institution
  async markLecturer(accessToken, lecturerId, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/institution/mark-lecturer/`, {
        method: 'POST',
        headers: {
          ...defaultHeaders,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ lecturer_id: lecturerId }),
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

  // Check if lecturer is free before assigning to course
  async isLecturerFree(accessToken, lecturerId, days, startTime, endTime, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/institution/is-lecturer-free/${lecturerId}/`, {
        method: 'POST',
        headers: {
          ...defaultHeaders,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          days: days,
          start_time: startTime,
          end_time: endTime,
        }),
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

  // Get marked lecturers for institution
  async getMarkedLecturers(accessToken, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/institution/marked-lecturers/`, {
        method: 'GET',
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

  // Check if lecturer is marked (institution only, verified)
  async isLecturerMarked(accessToken, lecturerId, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/institution/is-marked/${lecturerId}/`, {
        method: 'GET',
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

  // Remove marked lecturer (institution only, verified)
  async removeMarkedLecturer(accessToken, lecturerId, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/institution/remove-marked/${lecturerId}/`, {
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

  // Get student profile (institution only - for enrolled students)
  // Get student profile for institution (requires JWT, institution only)
  async getInstitutionStudentProfile(accessToken, studentId, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/institution/student/${studentId}/`, {
        method: 'GET',
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

  // Get lecturer profile (institution only - for lecturers teaching in institution)
  async getInstitutionLecturerProfile(accessToken, lecturerId, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/institution/lecturer/${lecturerId}/`, {
        method: 'GET',
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

  async getInstitutionLecturersList(accessToken, page = 1, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    const params = new URLSearchParams({ page: page.toString() });
    const endpoint = `/institution/lecturers-list/?${params}`;

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
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

  // Get job applications (institution only, verified, owner of job)
  async getJobApplications(accessToken, jobId, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/institution/job/${jobId}/applications/`, {
        method: 'GET',
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

    // Append text fields (only if provided) - all optional per endpoint
    if (payload.username) formData.append('username', payload.username);
    if (payload.first_name) formData.append('first_name', payload.first_name);
    if (payload.last_name) formData.append('last_name', payload.last_name);
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
      fetch(`${BASE_URL}/institution/edit-profile/`, {
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

  // Get lecturer courses (public endpoint)
  async getLecturerCourses(username) {
    const response = await fetch(`${BASE_URL}/lecturer/${username}/courses/`, {
      headers: defaultHeaders,
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      throw buildError(response.status, data);
    }

    return data;
  },

  // Create exam for a course (lecturer only, verified)
  async createExam(accessToken, courseId, examData, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/lecturer/course/${courseId}/exam/create/`, {
        method: 'POST',
        headers: {
          ...defaultHeaders,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(examData),
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

  // Submit grades for an exam (bulk create/update + send emails)
  // List exams for a lecturer
  async listExams(accessToken, courseId, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    if (!courseId) {
      throw buildError(400, { message: 'Course ID is required to list exams' });
    }

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/institution-lecturer/courses/${courseId}/exams/`, {
        method: 'GET',
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

  async submitExamGrades(accessToken, examId, grades, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    // Update grades to use username instead of student_id
    const gradesWithUsername = grades.map(grade => ({
      username: grade.username, // Use username instead of student_id
      score: parseFloat(grade.score)
    }));

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/lecturer/exam/${examId}/grades/`, {
        method: 'POST',
        headers: {
          ...defaultHeaders,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ grades: gradesWithUsername }),
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

  // View grades for an exam
  async viewExamGrades(accessToken, examId, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/institution-lecturer/exam/${examId}/grades/view/`, {
        method: 'GET',
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

  // Edit grades for an exam (bulk update without emails)
  async editExamGrades(accessToken, examId, grades, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    // Update grades to use username instead of student_id
    const gradesWithUsername = grades.map(grade => ({
      username: grade.username, // Use username instead of student_id
      score: parseFloat(grade.score)
    }));

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/lecturer/exam/${examId}/grades/edit/`, {
        method: 'PUT',
        headers: {
          ...defaultHeaders,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ grades: gradesWithUsername }),
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

  // Mark attendance for a lecture (lecturer only, verified)
  async markAttendance(accessToken, courseId, lectureNumber, records, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    // Validate and format the request body
    // Include both username and student_id for compatibility
    const requestBody = {
      lecture_number: parseInt(lectureNumber, 10),
      records: records.map(record => ({
        username: record.username, // Use username
        student_id: record.student_id || record.id, // Include student_id for compatibility
        status: record.status || 'present' // Ensure status is present
      }))
    };

    // Validate request body
    if (isNaN(requestBody.lecture_number)) {
      throw buildError(400, { message: 'Invalid lecture number' });
    }

    if (!Array.isArray(requestBody.records) || requestBody.records.length === 0) {
      throw buildError(400, { message: 'Records array is required and must not be empty' });
    }

    // Validate each record
    for (const record of requestBody.records) {
      if (!record.username || typeof record.username !== 'string') {
        throw buildError(400, { message: `Invalid username: ${record.username}. Username is required and must be a string` });
      }
      if (!['present', 'absent', 'late'].includes(record.status)) {
        throw buildError(400, { message: `Invalid status: ${record.status}. Must be 'present', 'absent', or 'late'` });
      }
    }

    console.log('authService: Marking attendance with body:', JSON.stringify(requestBody, null, 2));

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/lecturer/course/${courseId}/attendance/`, {
        method: 'POST',
        headers: {
          ...defaultHeaders,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
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
        throw buildError(
          refreshError?.status || 401,
          refreshError?.data || { message: 'Session expired. Please log in again.' }
        );
      }
    }

    const data = await parseResponse(response);

    if (!response.ok) {
      console.error('authService: markAttendance - Server error response:', {
        status: response.status,
        statusText: response.statusText,
        data: data,
        url: `${BASE_URL}/lecturer/course/${courseId}/attendance/`
      });
      throw buildError(response.status, data);
    }

    return data;
  },

  // View attendance for a specific lecture
  async viewLectureAttendance(accessToken, courseId, lectureNumber, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/institution-lecturer/course/${courseId}/attendance/${lectureNumber}/`, {
        method: 'GET',
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
    // Ensure lecturer is sent as integer (FormData converts to string, but backend expects numeric string)
    formData.append('lecturer', String(Number(payload.lecturer)));

    // Optional fields
    if (payload.course_image) {
      formData.append('course_image', payload.course_image);
    }

    if (payload.capacity) {
      formData.append('capacity', payload.capacity);
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

  // Check if student is free before enrolling to a course
  async checkStudentFree(accessToken, courseId, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/student/is-student-free/${courseId}/`, {
        method: 'POST',
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

  // Check if student is enrolled in a course
  async isEnrolled(accessToken, courseId, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/student/is-enrolled/${courseId}/`, {
        method: 'GET',
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

  // Enroll student in a course (now returns checkout URL for payment)
  async enrollInCourse(accessToken, courseId, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/student/enroll/${courseId}/`, {
        method: 'POST',
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

    // Enrollment response (no payment required)
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

  // Get student's attendance records for a course
  async getStudentCourseAttendance(accessToken, courseId, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/student/course/${courseId}/attendance/`, {
        method: 'GET',
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

  // Get student's grades for a course
  async getStudentCourseGrades(accessToken, courseId, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/student/course/${courseId}/grades/`, {
        method: 'GET',
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

  // Get course progress (personal if enrolled, overall average otherwise)
  async getCourseProgress(courseId, accessToken = null, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    const makeRequest = async (token = null) => {
      const headers = { ...defaultHeaders };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      return fetch(`${BASE_URL}/course/${courseId}/progress/`, {
        method: 'GET',
        headers,
      });
    };

    let response = await makeRequest(accessToken);

    // Handle token refresh if needed
    if (response.status === 401 && refreshToken && onTokenRefreshed && accessToken) {
      try {
        const refreshed = await this.refreshAccessToken(refreshToken);
        onTokenRefreshed(refreshed);
        response = await makeRequest(refreshed.access);
      } catch (refreshError) {
        if (typeof onSessionExpired === 'function') {
          onSessionExpired();
        }
        // If refresh fails, try without auth (public endpoint)
        response = await makeRequest(null);
      }
    }

    const data = await parseResponse(response);

    if (!response.ok) {
      throw buildError(response.status, data);
    }

    return data;
  },

  // Get list of students for a specific lecture number in a course
  async getCourseStudents(accessToken, courseId, lectureNumber, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    // Try using query parameter format: course/<course_id>/students/?lecture_number=<lecture_number>
    // If that doesn't work, we can fall back to attendance view endpoint
    const url = `${BASE_URL}/course/${courseId}/students/?lecture_number=${lectureNumber}`;

    const makeRequest = async (token) =>
      fetch(url, {
        method: 'GET',
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

  // Get job details by job ID (public endpoint)
  async getJobDetails(jobId) {
    const response = await fetch(`${BASE_URL}/institution/job/${jobId}/`, {
      headers: defaultHeaders,
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      throw buildError(response.status, data);
    }

    return data;
  },

  // Institution: Add payment method (Stripe Connect Onboarding)
  async addInstitutionPaymentMethod(accessToken, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/institution/add-payment-method/`, {
        method: 'POST',
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

  // Institution: Subscribe to a plan
  async subscribeInstitution(accessToken, plan, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    if (!['3m', '6m', '12m'].includes(plan)) {
      throw buildError(400, { message: 'Invalid plan. Must be 3m, 6m, or 12m.' });
    }

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/institution/subscribe/`, {
        method: 'POST',
        headers: {
          ...defaultHeaders,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan }),
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

  // Student: Add payment method (Stripe Customer Attach)
  async addStudentPaymentMethod(accessToken, options = {}) {
    const { refreshToken, onTokenRefreshed, onSessionExpired } = options;

    const makeRequest = async (token) =>
      fetch(`${BASE_URL}/student/add-payment-method/`, {
        method: 'POST',
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
};


