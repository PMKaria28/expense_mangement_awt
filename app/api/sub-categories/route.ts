import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = getTokenFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const isExpense = searchParams.get("isExpense");
    const isIncome = searchParams.get("isIncome");

    const allSubCats = await prisma.sub_categories.findMany({
      include: { categories: true },
    });

    const subCategories = allSubCats.filter((s) => {
      if (user.role !== "admin" && s.UserID !== user.userId) return false;
      if (categoryId && s.CategoryID !== parseInt(categoryId)) return false;
      if (isExpense === "true" && !s.IsExpense) return false;
      if (isIncome === "true" && !s.IsIncome) return false;
      return true;
    });

    return NextResponse.json({ subCategories });
  } catch (err) {
    console.error("sub-categories GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = getTokenFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const now = new Date();

    const subCategory = await prisma.sub_categories.create({
      data: {
        CategoryID: parseInt(body.CategoryID),
        SubCategoryName: body.SubCategoryName,
        LogoPath: body.LogoPath || null,
        IsExpense: body.IsExpense ?? true,
        IsIncome: body.IsIncome ?? false,
        IsActive: body.IsActive ?? true,
        Description: body.Description || null,
        Sequence: body.Sequence ? parseFloat(body.Sequence) : null,
        UserID: user.userId,
        Created: now,
        Modified: now,
      },
    });

    return NextResponse.json(subCategory, { status: 201 });
  } catch (err) {
    console.error("sub-categories POST error:", err);
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
//   const categoryId = searchParams.get("categoryId");
//   const isExpense = searchParams.get("isExpense");
//   const isIncome = searchParams.get("isIncome");

//   const where: any = {
//     ...(user.role !== "admin" ? { UserID: user.userId } : {}),
//     ...(categoryId ? { CategoryID: parseInt(categoryId) } : {}),
//     ...(isExpense === "true" ? { IsExpense: true } : {}),
//     ...(isIncome === "true" ? { IsIncome: true } : {}),
//   };

//   const subCategories = await prisma.sub_categories.findMany({
//     where,
//     orderBy: { Sequence: "asc" },
//     include: { categories: { select: { CategoryName: true } } },
//   });

//   return NextResponse.json({ subCategories });
// }

// export async function POST(req: NextRequest) {
//   const user = getTokenFromRequest(req);
//   if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//   const body = await req.json();
//   const now = new Date();

//   const subCategory = await prisma.sub_categories.create({
//     data: {
//       CategoryID: parseInt(body.CategoryID),
//       SubCategoryName: body.SubCategoryName,
//       LogoPath: body.LogoPath || null,
//       IsExpense: body.IsExpense ?? true,
//       IsIncome: body.IsIncome ?? false,
//       IsActive: body.IsActive ?? true,
//       Description: body.Description || null,
//       Sequence: body.Sequence ? parseFloat(body.Sequence) : null,
//       UserID: user.userId,
//       Created: now,
//       Modified: now,
//     },
//   });

//   return NextResponse.json(subCategory, { status: 201 });
// }