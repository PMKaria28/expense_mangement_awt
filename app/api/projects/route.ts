import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = getTokenFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const all = await prisma.projects.findMany();
    const projects = user.role === "admin"
      ? all
      : all.filter((p) => p.UserID === user.userId);
    return NextResponse.json({ projects, total: projects.length });
  } catch (err: any) {
    console.error("projects error:", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = getTokenFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const now = new Date();
    const project = await prisma.projects.create({
      data: {
        ProjectName: body.ProjectName,
        ProjectLogo: body.ProjectLogo || null,
        ProjectStartDate: body.ProjectStartDate ? new Date(body.ProjectStartDate) : null,
        ProjectEndDate: body.ProjectEndDate ? new Date(body.ProjectEndDate) : null,
        ProjectDetail: body.ProjectDetail || null,
        Description: body.Description || null,
        IsActive: body.IsActive ?? true,
        UserID: user.userId,
        Created: now,
        Modified: now,
      },
    });
    return NextResponse.json(project, { status: 201 });
  } catch (err: any) {
    console.error("projects POST error:", err.message);
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
//     ...(search ? { ProjectName: { contains: search } } : {}),
//   };

//   const projects = await prisma.projects.findMany({
//     where,
//     skip: (page - 1) * limit,
//     take: limit,
//     orderBy: { Created: "desc" },
//   });

//   const total = await prisma.projects.count({ where });

//   return NextResponse.json({ projects, total });
// }

// export async function POST(req: NextRequest) {
//   const user = getTokenFromRequest(req);
//   if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//   const body = await req.json();
//   const now = new Date();

//   const project = await prisma.projects.create({
//     data: {
//       ProjectName: body.ProjectName,
//       ProjectLogo: body.ProjectLogo || null,
//       ProjectStartDate: body.ProjectStartDate ? new Date(body.ProjectStartDate) : null,
//       ProjectEndDate: body.ProjectEndDate ? new Date(body.ProjectEndDate) : null,
//       ProjectDetail: body.ProjectDetail || null,
//       Description: body.Description || null,
//       IsActive: body.IsActive ?? true,
//       UserID: user.userId,
//       Created: now,
//       Modified: now,
//     },
//   });

//   return NextResponse.json(project, { status: 201 });
// }

