import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getTokenFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const all = await prisma.categories.findMany();
    const category = all.find((c) => c.CategoryID === parseInt(id));
    if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(category);
  } catch (err: any) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getTokenFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const all = await prisma.categories.findMany();
    const category = all.find((c) => c.CategoryID === parseInt(id));
    if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (user.role !== "admin" && category.UserID !== user.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    await prisma.categories.update({
      where: { CategoryID: parseInt(params.id) },
      data: {
        CategoryName: body.CategoryName,
        LogoPath: body.LogoPath || null,
        IsExpense: body.IsExpense,
        IsIncome: body.IsIncome,
        IsActive: body.IsActive,
        Description: body.Description || null,
        Sequence: body.Sequence ? parseFloat(body.Sequence) : null,
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

  // Only admin can delete categories
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Only admin can delete categories" }, { status: 403 });
  }

  try {
    await prisma.categories.delete({ where: { CategoryID: parseInt(params.id) } });
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

//   const category = await prisma.categories.findFirst({
//     where: {
//       CategoryID: parseInt(params.id),
//       ...(user.role !== "admin" ? { UserID: user.userId } : {}),
//     }
//     // include: { sub_categories: true },
//   });

//   if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });
//   return NextResponse.json(category);
// }

// export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
//   const user = getTokenFromRequest(req);
//   if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//   const body = await req.json();

//   const category = await prisma.categories.updateMany({
//     where: {
//       CategoryID: parseInt(params.id),
//       ...(user.role !== "admin" ? { UserID: user.userId } : {}),
//     },
//     data: {
//       CategoryName: body.CategoryName,
//       LogoPath: body.LogoPath || null,
//       IsExpense: body.IsExpense,
//       IsIncome: body.IsIncome,
//       IsActive: body.IsActive,
//       Description: body.Description || null,
//       Sequence: body.Sequence ? parseFloat(body.Sequence) : null,
//       Modified: new Date(),
//     },
//   });

//   return NextResponse.json({ success: true });
// }

// export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
//   const user = getTokenFromRequest(req);
//   if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//   await prisma.categories.deleteMany({
//     where: {
//       CategoryID: parseInt(params.id),
//       ...(user.role !== "admin" ? { UserID: user.userId } : {}),
//     },
//   });

//   return NextResponse.json({ success: true });
// }