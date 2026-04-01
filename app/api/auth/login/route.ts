import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, comparePassword, isAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const allUsers = await prisma.users.findMany();
    const user = allUsers.find(
      (u) => u.EmailAddress.toLowerCase() === email.toLowerCase()
    );

    if (!user || !comparePassword(password, user.Password)) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Role is determined by email match with ADMIN_EMAIL in .env
    const role = isAdmin(user.EmailAddress) ? "admin" : "user";

    const token = signToken({
      userId: user.UserID,
      email: user.EmailAddress,
      userName: user.UserName,
      role,
    });

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.UserID,
        name: user.UserName,
        email: user.EmailAddress,
        role,
      },
    });

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
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