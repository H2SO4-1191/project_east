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
};


