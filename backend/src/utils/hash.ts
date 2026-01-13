import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Hash a plain-text password using bcrypt
 * @param password - Plain-text password to hash
 * @returns Promise resolving to bcrypt hash
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain-text password with a bcrypt hash
 * @param password - Plain-text password to verify
 * @param hash - Bcrypt hash to compare against
 * @returns Promise resolving to true if password matches, false otherwise
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
