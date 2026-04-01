import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = getTokenFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId");
    const projectId = searchParams.get("projectId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // Fetch all with relations, filter in JS (MariaDB adapter limitation)
    const allExpenses = await prisma.expenses.findMany({
      include: {
        categories: true,
        sub_categories: true,
        peoples: true,
        projects: true,
      },
    });

    let filtered = allExpenses.filter((e) => {
      if (user.role !== "admin" && e.UserID !== user.userId) return false;
      if (categoryId && e.CategoryID !== parseInt(categoryId)) return false;
      if (projectId && e.ProjectID !== parseInt(projectId)) return false;
      if (from && new Date(e.ExpenseDate) < new Date(from)) return false;
      if (to && new Date(e.ExpenseDate) > new Date(to)) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          e.ExpenseDetail?.toLowerCase().includes(s) ||
          e.Description?.toLowerCase().includes(s)
        );
      }
      return true;
    });

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.ExpenseDate).getTime() - new Date(a.ExpenseDate).getTime());

    const total = filtered.length;
    const expenses = filtered.slice((page - 1) * limit, page * limit);

    return NextResponse.json({ expenses, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("expenses GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = getTokenFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const now = new Date();

    const expense = await prisma.expenses.create({
      data: {
        ExpenseDate: new Date(body.ExpenseDate),
        CategoryID: body.CategoryID ? parseInt(body.CategoryID) : null,
        SubCategoryID: body.SubCategoryID ? parseInt(body.SubCategoryID) : null,
        PeopleID: parseInt(body.PeopleID),
        ProjectID: body.ProjectID ? parseInt(body.ProjectID) : null,
        Amount: parseFloat(body.Amount),
        ExpenseDetail: body.ExpenseDetail || null,
        AttachmentPath: body.AttachmentPath || null,
        Description: body.Description || null,
        UserID: user.userId,
        Created: now,
        Modified: now,
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (err) {
    console.error("expenses POST error:", err);
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
//   const page = parseInt(searchParams.get("page") || "1");
//   const limit = parseInt(searchParams.get("limit") || "10");
//   const search = searchParams.get("search") || "";
//   const categoryId = searchParams.get("categoryId");
//   const projectId = searchParams.get("projectId");
//   const from = searchParams.get("from");
//   const to = searchParams.get("to");

//   const where: any = {
//     ...(user.role !== "admin" ? { UserID: user.userId } : {}),
//     ...(categoryId ? { CategoryID: parseInt(categoryId) } : {}),
//     ...(projectId ? { ProjectID: parseInt(projectId) } : {}),
//     ...(from || to
//       ? {
//           ExpenseDate: {
//             ...(from ? { gte: new Date(from) } : {}),
//             ...(to ? { lte: new Date(to) } : {}),
//           },
//         }
//       : {}),
//     ...(search
//       ? {
//           OR: [
//             { ExpenseDetail: { contains: search } },
//             { Description: { contains: search } },
//           ],
//         }
//       : {}),
//   };

//   const expenses = await prisma.expenses.findMany({
//     where,
//     skip: (page - 1) * limit,
//     take: limit,
//     orderBy: { ExpenseDate: "desc" },
//     include: {
//       categories: true,
//       sub_categories: true,
//       peoples: true,
//       projects: true,
//     },
//   });

//   const total = await prisma.expenses.count({ where });

//   return NextResponse.json({
//     expenses,
//     total,
//     page,
//     totalPages: Math.ceil(total / limit),
//   });
// }

// export async function POST(req: NextRequest) {
//   const user = getTokenFromRequest(req);
//   if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//   const body = await req.json();
//   const now = new Date();

//   const expense = await prisma.expenses.create({
//     data: {
//       ExpenseDate: new Date(body.ExpenseDate),
//       CategoryID: body.CategoryID ? parseInt(body.CategoryID) : null,
//       SubCategoryID: body.SubCategoryID ? parseInt(body.SubCategoryID) : null,
//       PeopleID: parseInt(body.PeopleID),
//       ProjectID: body.ProjectID ? parseInt(body.ProjectID) : null,
//       Amount: parseFloat(body.Amount),
//       ExpenseDetail: body.ExpenseDetail || null,
//       AttachmentPath: body.AttachmentPath || null,
//       Description: body.Description || null,
//       UserID: user.userId,
//       Created: now,
//       Modified: now,
//     },
//     include: {
//       categories: true,
//       peoples: true,
//       projects: true,
//     },
//   });

//   return NextResponse.json(expense, { status: 201 });
// }

