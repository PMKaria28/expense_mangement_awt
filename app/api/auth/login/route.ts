import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, comparePassword, isAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    // 1. Check users table first
    const allUsers = await prisma.users.findMany();
    const user = allUsers.find(
      (u) => u.EmailAddress.toLowerCase() === email.toLowerCase()
    );

    if (user) {
      if (!comparePassword(password, user.Password)) {
        return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
      }
      const role = isAdmin(user.EmailAddress) ? "admin" : "user";
      const token = signToken({ userId: user.UserID, email: user.EmailAddress, userName: user.UserName, role });
      const response = NextResponse.json({
        success: true, token,
        user: { id: user.UserID, name: user.UserName, email: user.EmailAddress, role },
      });
      response.cookies.set("auth-token", token, {
        httpOnly: true, secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, path: "/",
      });
      return response;
    }

    // 2. Fallback: check peoples table
    const allPeoples = await prisma.peoples.findMany();
    const person = allPeoples.find(
      (p) => p.Email.toLowerCase() === email.toLowerCase()
    );

    if (person) {
      if (!comparePassword(password, person.Password)) {
        return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
      }
      const token = signToken({
        userId: person.UserID,
        email: person.Email,
        userName: person.PeopleName,
        role: "user",
      });
      const response = NextResponse.json({
        success: true, token,
        user: { id: person.UserID, name: person.PeopleName, email: person.Email, role: "user" },
      });
      response.cookies.set("auth-token", token, {
        httpOnly: true, secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, path: "/",
      });
      return response;
    }

    // 3. Email not found in either table
    return NextResponse.json({ error: "No account found with this email" }, { status: 401 });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { signToken, comparePassword } from "@/lib/auth";

// export async function POST(req: NextRequest) {
//   try {
//     const { email, password } = await req.json();

//     if (!email || !password) {
//       return NextResponse.json({ error: "Email and password required" }, { status: 400 });
//     }

//     const user = await prisma.users.findFirst({
//       where: { EmailAddress: email },
//     });

//     if (!user || !comparePassword(password, user.Password)) {
//       return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
//     }

//     // UserID 1 = Admin (adjust logic as needed)
//     const role = user.UserID === 1 ? "admin" : "user";

//     const token = signToken({
//       userId: user.UserID,
//       email: user.EmailAddress,
//       userName: user.UserName,
//       role,
//     });

//     const response = NextResponse.json({
//       success: true,
//       token,
//       user: { id: user.UserID, name: user.UserName, email: user.EmailAddress, role },
//     });

//     response.cookies.set("auth-token", token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       maxAge: 60 * 60 * 24 * 7,
//       path: "/",
//     });

//     return response;
//   } catch (error) {
//     return NextResponse.json({ error: "Server error" }, { status: 500 });
//   }
// }