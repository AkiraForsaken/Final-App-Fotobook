import { Component, type ReactNode } from 'react';

interface State {
	hasError: boolean;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
	state: State = { hasError: false };

	static getDerivedStateFromError(): State {
		return { hasError: true };
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="flex h-screen items-center justify-center text-gray-500">
					<p>Something went wrong. Please refresh the page.</p>
				</div>
			);
		}
		return this.props.children;
	}
}
