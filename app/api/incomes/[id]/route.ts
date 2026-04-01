import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getTokenFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const all = await prisma.incomes.findMany({
      include: { categories: true, sub_categories: true, peoples: true, projects: true },
    });
    const income = all.find((i) => i.IncomeID === parseInt(params.id));
    if (!income) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (user.role !== "admin" && income.UserID !== user.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(income);
  } catch (err: any) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getTokenFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const all = await prisma.incomes.findMany();
    const income = all.find((i) => i.IncomeID === parseInt(params.id));
    if (!income) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (user.role !== "admin" && income.UserID !== user.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    await prisma.incomes.update({
      where: { IncomeID: parseInt(params.id) },
      data: {
        IncomeDate: new Date(body.IncomeDate),
        CategoryID: body.CategoryID ? parseInt(body.CategoryID) : null,
        SubCategoryID: body.SubCategoryID ? parseInt(body.SubCategoryID) : null,
        PeopleID: parseInt(body.PeopleID),
        ProjectID: body.ProjectID ? parseInt(body.ProjectID) : null,
        Amount: parseFloat(body.Amount),
        IncomeDetail: body.IncomeDetail || null,
        AttachmentPath: body.AttachmentPath || null,
        Description: body.Description || null,
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

  try {
    const all = await prisma.incomes.findMany();
    const income = all.find((i) => i.IncomeID === parseInt(params.id));
    if (!income) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (user.role !== "admin" && income.UserID !== user.userId) {
      return NextResponse.json({ error: "Forbidden — you can only delete your own records" }, { status: 403 });
    }

    await prisma.incomes.delete({ where: { IncomeID: parseInt(params.id) } });
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

//   const income = await prisma.incomes.findFirst({
//     where: {
//       IncomeID: parseInt(params.id),
//       ...(user.role !== "admin" ? { UserID: user.userId } : {}),
//     },
//     include: { categories: true, sub_categories: true, peoples: true, projects: true },
//   });

//   if (!income) return NextResponse.json({ error: "Not found" }, { status: 404 });
//   return NextResponse.json(income);
// }

// export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
//   const user = getTokenFromRequest(req);
//   if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//   const body = await req.json();

//   await prisma.incomes.updateMany({
//     where: {
//       IncomeID: parseInt(params.id),
//       ...(user.role !== "admin" ? { UserID: user.userId } : {}),
//     },
//     data: {
//       IncomeDate: new Date(body.IncomeDate),
//       CategoryID: body.CategoryID ? parseInt(body.CategoryID) : null,
//       SubCategoryID: body.SubCategoryID ? parseInt(body.SubCategoryID) : null,
//       PeopleID: parseInt(body.PeopleID),
//       ProjectID: body.ProjectID ? parseInt(body.ProjectID) : null,
//       Amount: parseFloat(body.Amount),
//       IncomeDetail: body.IncomeDetail || null,
//       AttachmentPath: body.AttachmentPath || null,
//       Description: body.Description || null,
//       Modified: new Date(),
//     },
//   });

//   return NextResponse.json({ success: true });
// }

// export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
//   const user = getTokenFromRequest(req);
//   if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//   await prisma.incomes.deleteMany({
//     where: {
//       IncomeID: parseInt(params.id),
//       ...(user.role !== "admin" ? { UserID: user.userId } : {}),
//     },
//   });

//   return NextResponse.json({ success: true });
// }