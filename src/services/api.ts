import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { STORAGE_KEYS } from '../constants/appConfig';
import { getStorageItem } from '../utils/storage';

/**
 * The HTTP client for the real backend.
 *
 * `baseURL` falls back to the relative `/api/v1`, which `vite.config.ts`
 * proxies to the backend in development - so the browser sees one origin and
 * CORS never applies. Set `VITE_API_URL` to call a backend directly.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    /**
     * Read with `getStorageItem`, NOT `localStorage.getItem`.
     *
     * =======================================================================
     * THE BUG THIS LINE EXISTED TO CAUSE.
     *
     * Tokens are written with `setStorageItem`, which JSON-encodes:
     *
     *     localStorage.setItem(key, JSON.stringify(token))
     *
     * so the stored value is `"eyJhbGci..."` WITH literal double quotes. This
     * interceptor used to read it with raw `localStorage.getItem`, keeping
     * those quotes, and sent:
     *
     *     Authorization: Bearer "eyJhbGci..."
     *
     * The backend's bearer pattern is `/^Bearer[ ]+(\S+)$/` - a quote is not
     * whitespace, so the header MATCHED and the token was extracted with the
     * quotes still attached. `jwt.verify` then rejected it and every
     * authenticated request came back 401 "Authentication required", while
     * login itself looked perfectly successful.
     *
     * It stayed hidden for as long as the only token was the mock's
     * `jwt_mock_<id>`, because nothing ever verified that.
     *
     * The fix is symmetry: read with the same codec that wrote. Using
     * `setStorageItem` to write is deliberate and worth keeping - it also
     * dispatches the `app-storage-update` event that `useStorageSync`
     * listens to.
     * =======================================================================
     */
    const token = getStorageItem<string>(STORAGE_KEYS.AUTH_TOKEN, '').trim();

    // An empty or whitespace-only token must not become `Bearer `, which is
    // a malformed header rather than an absent one.
    if (token !== '' && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Logged, not acted on: a 401 here can mean an expired access token, a
      // revoked session, or simply a public endpoint called while signed
      // out. Deciding what to do belongs to the caller - silently clearing
      // the session from an interceptor would log a user out mid-form.
      console.warn('Unauthorized API call detected');
    }

    return Promise.reject(error);
  }
);
