import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getTokenFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const all = await prisma.expenses.findMany({
      include: { categories: true, sub_categories: true, peoples: true, projects: true },
    });
    const expense = all.find((e) => e.ExpenseID === parseInt(id));
    if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Normal user can only view their own
    if (user.role !== "admin" && expense.UserID !== user.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(expense);
  } catch (err: any) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getTokenFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const all = await prisma.expenses.findMany();
    const expense = all.find((e) => e.ExpenseID === parseInt(id));
    if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Normal user can only edit their own
    if (user.role !== "admin" && expense.UserID !== user.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    await prisma.expenses.update({
      where: { ExpenseID: parseInt(id) },
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
        Modified: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getTokenFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const all = await prisma.expenses.findMany();
    const expense = all.find((e) => e.ExpenseID === parseInt(id));
    if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Normal user can only delete their own
    if (user.role !== "admin" && expense.UserID !== user.userId) {
      return NextResponse.json({ error: "Forbidden — you can only delete your own records" }, { status: 403 });
    }

    await prisma.expenses.delete({ where: { ExpenseID: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}