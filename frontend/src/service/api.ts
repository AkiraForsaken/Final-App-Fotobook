import axios, { type AxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	const headers = new Headers(init?.headers);
	if (!headers.has('Content-Type') && init?.body) {
		headers.set('Content-Type', 'application/json');
	}

	const config: AxiosRequestConfig = {
		url: `${BASE_URL}${path}`,
		method: init?.method as AxiosRequestConfig['method'] | undefined,
		headers: Object.fromEntries(headers.entries()),
		data:
			init?.body === undefined
				? undefined
				: typeof init.body === 'string'
					? JSON.parse(init.body)
					: init.body,
		validateStatus: () => true,
	};

	const response = await axios.request(config);
	const data = response.data;

	if (response.status < 200 || response.status >= 300) {
		const message =
			data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
				? data.error
				: 'Request failed';
		throw new Error(message);
	}

	return data as T;
}

export { BASE_URL, request };
