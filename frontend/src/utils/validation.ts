/**
 * Synchronized Validation Rules
 * Extracted from ChangePasswordRequest.java and other backend DTOs
 */
export const VALIDATION_RULES = {
  PASSWORD: {
    MIN_LENGTH: 8,
    // Note: JS regex uses single backslash for escapes compared to Java's double backslash
    // Pattern: One upper, one lower, one digit, one special character, min 8 chars
    REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/,
    MESSAGES: {
      REQUIRED: "Password is required",
      TOO_SHORT: "Password must be at least 8 characters long",
      COMPLEXITY: "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character",
    }
  },
  PHONE: {
    REGEX: /^(\+212|0)([5-7])\d{8}$/,
    MESSAGES: {
      REQUIRED: "Phone number is required",
      INVALID: "Invalid Moroccan phone number (e.g., 0612345678 or +212612345678)",
    }
  }
};

/**
 * Validates a Moroccan phone number
 * @returns { string | null } Error message or null if valid
 */
export const validatePhone = (phone: string): string | null => {
  if (!phone || phone.trim() === '') {
    return VALIDATION_RULES.PHONE.MESSAGES.REQUIRED;
  }
  if (!VALIDATION_RULES.PHONE.REGEX.test(phone)) {
    return VALIDATION_RULES.PHONE.MESSAGES.INVALID;
  }
  return null;
};


/**
 * Validates a password against backend constraints
 * @returns { string | null } Error message or null if valid
 */
export const validatePassword = (password: string): string | null => {
  if (!password || password.trim() === '') {
    return VALIDATION_RULES.PASSWORD.MESSAGES.REQUIRED;
  }
  
  if (password.length < VALIDATION_RULES.PASSWORD.MIN_LENGTH) {
    return VALIDATION_RULES.PASSWORD.MESSAGES.TOO_SHORT;
  }
  
  if (!VALIDATION_RULES.PASSWORD.REGEX.test(password)) {
    return VALIDATION_RULES.PASSWORD.MESSAGES.COMPLEXITY;
  }
  
  return null;
};
