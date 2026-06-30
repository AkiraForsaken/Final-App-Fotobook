export const isValidEmail = (email: string): boolean => {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export interface LoginData {
	email?: string;
	password?: string;
}

export interface SignupData {
	firstName?: string;
	lastName?: string;
	email?: string;
	password?: string;
}

// Validates Login Form inputs
export const validateLogin = (data: LoginData): Record<string, string> => {
	const errors: Record<string, string> = {};

	if (!data.email?.trim()) {
		errors.email = 'Email is required.';
	} else if (!isValidEmail(data.email)) {
		errors.email = 'Enter a valid email address.';
	}

	if (!data.password) {
		errors.password = 'Password is required.';
	} else if (data.password.length > 64) {
		errors.password = 'Max 64 characters.';
	}

	return errors;
};

// Validates Signup Form inputs
export const validateSignup = (data: SignupData): Record<string, string> => {
	const errors: Record<string, string> = {};

	if (!data.firstName?.trim()) {
		errors.firstName = 'First name is required.';
	} else if (data.firstName.length > 25) {
		errors.firstName = 'Max 25 characters.';
	}

	if (!data.lastName?.trim()) {
		errors.lastName = 'Last name is required.';
	} else if (data.lastName.length > 25) {
		errors.lastName = 'Max 25 characters.';
	}

	if (!data.email?.trim()) {
		errors.email = 'Email is required.';
	} else if (!isValidEmail(data.email)) {
		errors.email = 'Enter a valid email address.';
	} else if (data.email.length > 255) {
		errors.email = 'Max 255 characters.';
	}

	if (!data.password) {
		errors.password = 'Password is required.';
	} else if (data.password.length > 64) {
		errors.password = 'Max 64 characters.';
	}

	return errors;
};
