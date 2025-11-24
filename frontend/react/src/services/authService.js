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
    const endpoints = ['/refresh/', '/token/refresh/', '/registration/refresh/'];
    let lastError;

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
          method: 'POST',
          headers: defaultHeaders,
          body: JSON.stringify({ refresh: refreshToken }),
        });

        const data = await parseResponse(response);

        if (response.ok && data?.access) {
          return { access: data.access, refresh: data.refresh || refreshToken };
        }

        lastError = buildError(response.status, data);
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError) {
      throw lastError;
    }

    throw buildError(400, { message: 'Unable to refresh session.' });
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

    const response = await fetch(`${BASE_URL}/institution/institution-verify/`, {
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
        const retryResponse = await fetch(`${BASE_URL}/institution/institution-verify/`, {
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

    // Append text fields
    if (payload.username) formData.append('username', payload.username);
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

    const response = await fetch(`${BASE_URL}/institution/edit-profile/`, {
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
        const retryResponse = await fetch(`${BASE_URL}/institution/edit-profile/`, {
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
};


