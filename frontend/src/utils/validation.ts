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

export interface EditProfileData {
	firstName?: string;
	lastName?: string;
	email?: string;
}

// Validates the Basic Info half of Edit Profile
export const validateEditProfile = (data: EditProfileData): Record<string, string> => {
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

	return errors;
};

export interface PasswordChangeData {
	currentPassword?: string;
	newPassword?: string;
	confirmNewPassword?: string;
}

// Validates the Change Password half of Edit Profile
export const validatePasswordChange = (data: PasswordChangeData): Record<string, string> => {
	const errors: Record<string, string> = {};

	if (!data.currentPassword) {
		errors.currentPassword = 'Current password is required.';
	}

	if (!data.newPassword) {
		errors.newPassword = 'New password is required.';
	} else if (data.newPassword.length > 64) {
		errors.newPassword = 'Max 64 characters.';
	}

	if (!data.confirmNewPassword) {
		errors.confirmNewPassword = 'Please confirm your new password.';
	} else if (data.newPassword && data.confirmNewPassword !== data.newPassword) {
		errors.confirmNewPassword = 'Passwords do not match.';
	}

	return errors;
};
