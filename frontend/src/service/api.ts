import axios, { type AxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const client = axios.create({ baseURL: BASE_URL, withCredentials: true });

// Add a request interceptor to dynamically get the token before EVERY request
client.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem('accessToken');
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

let accessToken: string | null = null;

// AuthContext registers a handler here so that an auth failure can clear local sessions
type AuthFailureHandler = () => void;
let onAuthFailure: AuthFailureHandler | null = null;
export function setAuthFailureHandler(handler: AuthFailureHandler | null) {
	onAuthFailure = handler;
}

interface RefreshResponse {
	accessToken: string;
}

// Only 1 /auth/refresh call is made
let refreshPromise: Promise<boolean> | null = null;
async function refreshSession(): Promise<boolean> {
	if (!refreshPromise) {
		refreshPromise = client
			.post<RefreshResponse>('/api/auth/refresh', undefined, { validateStatus: () => true })
			.then((res) => {
				if (res.status >= 200 && res.status < 300 && res.data?.accessToken) {
					accessToken = res.data.accessToken;
					return true;
				}
				return false;
			})
			.catch(() => false)
			.finally(() => {
				refreshPromise = null;
			});
	}
	return refreshPromise;
}
function isAuthRoute(path: string): boolean {
	return path.startsWith('/api/auth/');
}

interface RequestOptions {
	method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	/** Plain object: sent as JSON. A FormData instance: sent as multipart (for file uploads). */
	body?: unknown;
	params?: Record<string, string | number | undefined>;
}

async function rawRequest<T>(
	path: string,
	options: RequestOptions
): Promise<{ status: number; data: T }> {
	const isFormData = options.body instanceof FormData;

	const headers: Record<string, string> = {};

	if (!isFormData && options.body) {
		headers['Content-Type'] = 'application/json';
	}

	// Read token from memory or fallback to localStorage if memory was wiped on refresh
	const token = accessToken || localStorage.getItem('accessToken');

	if (token && !isAuthRoute(path)) {
		headers['Authorization'] = `Bearer ${token}`;
	}

	const config: AxiosRequestConfig = {
		url: path,
		method: options.method ?? 'GET',
		params: options.params,
		data: options.body,
		headers: Object.keys(headers).length > 0 ? headers : undefined,
		validateStatus: () => true,
	};

	const response = await client.request(config);

	if (isAuthRoute(path) && response.status >= 200 && response.status < 300) {
		const resData = response.data as { accessToken?: string };
		if (resData?.accessToken) {
			accessToken = resData.accessToken;
			localStorage.setItem('accessToken', resData.accessToken);
		}
	}
	return { status: response.status, data: response.data as T };
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
	let { status, data } = await rawRequest<T>(path, options);

	// One silent refresh-and-retry on 401 except for auth endpoints (bad credentials).
	if (status === 401 && !isAuthRoute(path)) {
		const refreshed = await refreshSession();
		if (refreshed) {
			({ status, data } = await rawRequest<T>(path, options));
		}
	}

	if (status === 401) {
		accessToken = null;
		onAuthFailure?.();
	}

	if (status < 200 || status >= 300) {
		const record = data as Record<string, unknown> | null;
		const message =
			record && typeof record === 'object' && typeof record.error === 'string'
				? record.error
				: 'Request failed';
		throw new Error(message);
	}

	return data;
}

export { request };
