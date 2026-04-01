import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = getTokenFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const allPeoples = await prisma.peoples.findMany();

    const peoples = allPeoples.filter((p) => {
      if (user.role !== "admin" && p.UserID !== user.userId) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          p.PeopleName.toLowerCase().includes(s) ||
          p.Email.toLowerCase().includes(s) ||
          p.MobileNo.toLowerCase().includes(s)
        );
      }
      return true;
    });

    return NextResponse.json({ peoples, total: peoples.length });
  } catch (err) {
    console.error("peoples GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = getTokenFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const now = new Date();

    const people = await prisma.peoples.create({
      data: {
        PeopleCode: body.PeopleCode || null,
        Password: body.Password || "pass123",
        PeopleName: body.PeopleName,
        Email: body.Email,
        MobileNo: body.MobileNo,
        Description: body.Description || null,
        IsActive: body.IsActive ?? true,
        UserID: user.userId,
        Created: now,
        Modified: now,
      },
    });

    return NextResponse.json(people, { status: 201 });
  } catch (err) {
    console.error("peoples POST error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { getTokenFromRequest } from "@/lib/auth";

// export async function GET(req: NextRequest) {
//   const user = getTokenFromRequest(req);
//   if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//   const { searchParams } = new URL(req.url);
//   const search = searchParams.get("search") || "";
//   const page = parseInt(searchParams.get("page") || "1");
//   const limit = parseInt(searchParams.get("limit") || "100");

//   const where: any = {
//     ...(user.role !== "admin" ? { UserID: user.userId } : {}),
//     ...(search
//       ? {
//           OR: [
//             { PeopleName: { contains: search } },
//             { Email: { contains: search } },
//             { MobileNo: { contains: search } },
//           ],
//         }
//       : {}),
//   };

//   const peoples = await prisma.peoples.findMany({
//     where,
//     skip: (page - 1) * limit,
//     take: limit,
//     orderBy: { PeopleName: "asc" },
//   });

//   const total = await prisma.peoples.count({ where });

//   return NextResponse.json({ peoples, total });
// }

// export async function POST(req: NextRequest) {
//   const user = getTokenFromRequest(req);
//   if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//   const body = await req.json();
//   const now = new Date();

//   const people = await prisma.peoples.create({
//     data: {
//       PeopleCode: body.PeopleCode || null,
//       Password: body.Password || "pass123",
//       PeopleName: body.PeopleName,
//       Email: body.Email,
//       MobileNo: body.MobileNo,
//       Description: body.Description || null,
//       IsActive: body.IsActive ?? true,
//       UserID: user.userId,
//       Created: now,
//       Modified: now,
//     },
//   });

//   return NextResponse.json(people, { status: 201 });
// }

