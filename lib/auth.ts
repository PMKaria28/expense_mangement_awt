import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key-change-this";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";

export interface JWTPayload {
  userId: number;
  email: string;
  userName: string;
  role: "admin" | "user";
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  if (password === hash) return true;
  try {
    return bcrypt.compareSync(password, hash);
  } catch {
    return false;
  }
}

export function getTokenFromRequest(req: NextRequest): JWTPayload | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return verifyToken(authHeader.slice(7));
  }
  const cookieToken = req.cookies.get("auth-token")?.value;
  if (cookieToken) {
    return verifyToken(cookieToken);
  }
  return null;
}

export function isAdmin(email: string): boolean {
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

// import jwt from "jsonwebtoken";
// import bcrypt from "bcryptjs";
// import { NextRequest } from "next/server";

// const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key-change-this";
// const JWT_EXPIRES_IN = "7d";

// export interface JWTPayload {
//   userId: number;
//   email: string;
//   userName: string;
//   role: "admin" | "user";
// }

// export function signToken(payload: JWTPayload): string {
//   return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
// }

// export function verifyToken(token: string): JWTPayload | null {
//   try {
//     return jwt.verify(token, JWT_SECRET) as JWTPayload;
//   } catch {
//     return null;
//   }
// }

// export function hashPassword(password: string): string {
//   return bcrypt.hashSync(password, 10);
// }

// export function comparePassword(password: string, hash: string): boolean {
//   // For plain text passwords in DB (legacy), do direct compare first
//   if (password === hash) return true;
//   try {
//     return bcrypt.compareSync(password, hash);
//   } catch {
//     return false;
//   }
// }

// export function getTokenFromRequest(req: NextRequest): JWTPayload | null {
//   const authHeader = req.headers.get("authorization");
//   if (authHeader?.startsWith("Bearer ")) {
//     return verifyToken(authHeader.slice(7));
//   }
//   const cookieToken = req.cookies.get("auth-token")?.value;
//   if (cookieToken) {
//     return verifyToken(cookieToken);
//   }
//   return null;
// }