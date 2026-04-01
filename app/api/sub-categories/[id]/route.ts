import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getTokenFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subCategory = await prisma.sub_categories.findFirst({
    where: {
      SubCategoryID: parseInt(params.id),
      ...(user.role !== "admin" ? { UserID: user.userId } : {}),
    },
    include: { categories: true },
  });

  if (!subCategory) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(subCategory);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getTokenFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  await prisma.sub_categories.updateMany({
    where: {
      SubCategoryID: parseInt(params.id),
      ...(user.role !== "admin" ? { UserID: user.userId } : {}),
    },
    data: {
      CategoryID: parseInt(body.CategoryID),
      SubCategoryName: body.SubCategoryName,
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
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getTokenFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.sub_categories.deleteMany({
    where: {
      SubCategoryID: parseInt(params.id),
      ...(user.role !== "admin" ? { UserID: user.userId } : {}),
    },
  });

  return NextResponse.json({ success: true });
}