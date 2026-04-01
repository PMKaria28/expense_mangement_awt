import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = getTokenFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId");
  const projectId = searchParams.get("projectId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: any = {
    ...(user.role !== "admin" ? { UserID: user.userId } : {}),
    ...(categoryId ? { CategoryID: parseInt(categoryId) } : {}),
    ...(projectId ? { ProjectID: parseInt(projectId) } : {}),
    ...(from || to ? {
      IncomeDate: {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      },
    } : {}),
    ...(search ? {
      OR: [
        { IncomeDetail: { contains: search } },
        { Description: { contains: search } },
      ],
    } : {}),
  };

  const [incomes, total] = await Promise.all([
    prisma.incomes.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { IncomeDate: "desc" },
      include: {
        categories: true,
        sub_categories: true,
        peoples: true,
        projects: true,
        users: true,
      },
    }),
    prisma.incomes.count({ where }),
  ]);

  return NextResponse.json({ incomes, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const user = getTokenFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const now = new Date();

  const income = await prisma.incomes.create({
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
      UserID: user.userId,
      Created: now,
      Modified: now,
    },
    include: { categories: true, peoples: true, projects: true },
  });

  return NextResponse.json(income, { status: 201 });
}