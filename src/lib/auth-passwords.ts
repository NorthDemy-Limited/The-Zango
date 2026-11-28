import crypto from "crypto";

/**
 * Standard scrypt configuration for cryptographic password hashing
 * N = 16384 (CPU/memory cost parameter)
 * r = 8 (block size parameter)
 * p = 1 (parallelization parameter)
 * keylen = 64 (derived key length in bytes)
 */
const SCRYPT_OPTIONS: crypto.ScryptOptions = {
  N: 16384,
  r: 8,
  p: 1,
  maxmem: 32 * 1024 * 1024, // 32 MB
};

/**
 * Known default salt & hash for initial development seed accounts
 * Password: "password123"
 */
export const DEFAULT_SEED_SALT = "8c0733169da8b2d8c61a0b2be74ace7c";
export const DEFAULT_SEED_HASH = "60f8a119bde99c5c1f7c542156befc1402e0a97379803a896046b0dddbbd5698bbcdb263a8240c5ae3414d1dc1642d312690e03bad2eabcf3fe6f72fe1b64d05";

/**
 * Generates a cryptographic scrypt hash and 16-byte random hex salt
 */
export function hashPassword(password: string, customSalt?: string): { hash: string; salt: string } {
  const normalized = password.normalize("NFKC");
  const salt = customSalt || crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(normalized, salt, 64, SCRYPT_OPTIONS);
  return {
    hash: derivedKey.toString("hex"),
    salt,
  };
}

/**
 * Constant-time password verification using timingSafeEqual to prevent timing attacks
 */
export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  if (!password || !storedHash || !salt) {
    return false;
  }
  try {
    const normalized = password.normalize("NFKC");
    const derivedKey = crypto.scryptSync(normalized, salt, 64, SCRYPT_OPTIONS);
    const candidateBuffer = Buffer.from(derivedKey.toString("hex"), "hex");
    const storedBuffer = Buffer.from(storedHash, "hex");

    if (candidateBuffer.length !== storedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(candidateBuffer, storedBuffer);
  } catch (error) {
    console.error("Password verification error:", error);
    return false;
  }
}

/**
 * Generates a cryptographically strong, readable temporary password
 * Format: Zango#<10-char-alphanumeric>!
 */
export function generateDefaultPassword(): string {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(10);
  let token = "";
  for (let i = 0; i < bytes.length; i++) {
    token += charset[bytes[i] % charset.length];
  }
  return `Zango#${token}!`;
}

/**
 * Generates the next sequential newsroom username based on role:
 * - editor -> editor1, editor2, editor3...
 * - writer/author -> author1, author2, author3...
 * - admin -> admin1, admin2...
 */
export function generateNextUsername(role: string, existingUsernames: (string | undefined | null)[]): string {
  const cleanRole = role.toLowerCase().trim();
  let prefix = "author";
  if (cleanRole === "editor") {
    prefix = "editor";
  } else if (cleanRole === "admin") {
    prefix = "admin";
  }

  const pattern = new RegExp(`^${prefix}(\\d+)$`, "i");
  let maxNumber = 0;

  for (const rawUsername of existingUsernames) {
    if (!rawUsername) continue;
    const match = rawUsername.trim().toLowerCase().match(pattern);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNumber) {
        maxNumber = num;
      }
    }
  }

  return `${prefix}${maxNumber + 1}`;
}

