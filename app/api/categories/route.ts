import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = getTokenFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const isExpense = searchParams.get("isExpense");
    const isIncome = searchParams.get("isIncome");

    // Fetch all categories for this user, then filter in JS
    const allCategories = await prisma.categories.findMany();

    const categories = allCategories.filter((c) => {
      if (user.role !== "admin" && c.UserID !== user.userId) return false;
      if (isExpense === "true" && !c.IsExpense) return false;
      if (isIncome === "true" && !c.IsIncome) return false;
      return true;
    });

    return NextResponse.json({ categories });
  } catch (err) {
    console.error("categories GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = getTokenFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const now = new Date();

    const category = await prisma.categories.create({
      data: {
        CategoryName: body.CategoryName,
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

    return NextResponse.json(category, { status: 201 });
  } catch (err) {
    console.error("categories POST error:", err);
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
//   const isExpense = searchParams.get("isExpense");
//   const isIncome = searchParams.get("isIncome");

//   const where: any = {
//     ...(user.role !== "admin" ? { UserID: user.userId } : {}),
//     ...(isExpense === "true" ? { IsExpense: true } : {}),
//     ...(isIncome === "true" ? { IsIncome: true } : {}),
//   };

//   const categories = await prisma.categories.findMany({
//     where,
//     orderBy: { Sequence: "asc" },
//   });

//   return NextResponse.json({ categories });
// }

// export async function POST(req: NextRequest) {
//   const user = getTokenFromRequest(req);
//   if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//   const body = await req.json();
//   const now = new Date();

//   const category = await prisma.categories.create({
//     data: {
//       CategoryName: body.CategoryName,
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

//   return NextResponse.json(category, { status: 201 });
// }

