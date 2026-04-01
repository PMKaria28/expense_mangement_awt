import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getTokenFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const all = await prisma.peoples.findMany();
    const people = all.find((p) => p.PeopleID === parseInt(params.id));
    if (!people) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (user.role !== "admin" && people.UserID !== user.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(people);
  } catch (err: any) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getTokenFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const all = await prisma.peoples.findMany();
    const people = all.find((p) => p.PeopleID === parseInt(params.id));
    if (!people) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (user.role !== "admin" && people.UserID !== user.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    await prisma.peoples.update({
      where: { PeopleID: parseInt(params.id) },
      data: {
        PeopleCode: body.PeopleCode || null,
        PeopleName: body.PeopleName,
        Email: body.Email,
        MobileNo: body.MobileNo,
        Description: body.Description || null,
        IsActive: body.IsActive,
        Modified: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getTokenFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only admin can delete people
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Only admin can delete people" }, { status: 403 });
  }

  try {
    await prisma.peoples.delete({ where: { PeopleID: parseInt(params.id) } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { getTokenFromRequest } from "@/lib/auth";

// export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
//   const user = getTokenFromRequest(req);
//   if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//   const people = await prisma.peoples.findFirst({
//     where: {
//       PeopleID: parseInt(params.id),
//       ...(user.role !== "admin" ? { UserID: user.userId } : {}),
//     },
//   });

//   if (!people) return NextResponse.json({ error: "Not found" }, { status: 404 });
//   return NextResponse.json(people);
// }

// export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
//   const user = getTokenFromRequest(req);
//   if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//   const body = await req.json();

//   await prisma.peoples.updateMany({
//     where: {
//       PeopleID: parseInt(params.id),
//       ...(user.role !== "admin" ? { UserID: user.userId } : {}),
//     },
//     data: {
//       PeopleCode: body.PeopleCode || null,
//       PeopleName: body.PeopleName,
//       Email: body.Email,
//       MobileNo: body.MobileNo,
//       Description: body.Description || null,
//       IsActive: body.IsActive,
//       Modified: new Date(),
//     },
//   });

//   return NextResponse.json({ success: true });
// }

// export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
//   const user = getTokenFromRequest(req);
//   if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//   await prisma.peoples.deleteMany({
//     where: {
//       PeopleID: parseInt(params.id),
//       ...(user.role !== "admin" ? { UserID: user.userId } : {}),
//     },
//   });

//   return NextResponse.json({ success: true });
// }