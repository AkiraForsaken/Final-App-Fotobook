const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	const headers = new Headers(init?.headers);
	if (!headers.has('Content-Type') && init?.body) {
		headers.set('Content-Type', 'application/json');
	}

	const response = await fetch(`${BASE_URL}${path}`, {
		...init,
		headers,
	});

	const text = await response.text();
	const data = text ? JSON.parse(text) : null;

	if (!response.ok) {
		const message =
			data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
				? data.error
				: 'Request failed';
		throw new Error(message);
	}

	return data as T;
}

export { BASE_URL, request };
