import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getTokenFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const all = await prisma.projects.findMany();
    const project = all.find((p) => p.ProjectID === parseInt(id));
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (user.role !== "admin" && project.UserID !== user.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(project);
  } catch (err: any) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getTokenFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const all = await prisma.projects.findMany();
    const project = all.find((p) => p.ProjectID === parseInt(id));
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (user.role !== "admin" && project.UserID !== user.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    await prisma.projects.update({
      where: { ProjectID: parseInt(id) },
      data: {
        ProjectName: body.ProjectName,
        ProjectLogo: body.ProjectLogo || null,
        ProjectStartDate: body.ProjectStartDate ? new Date(body.ProjectStartDate) : null,
        ProjectEndDate: body.ProjectEndDate ? new Date(body.ProjectEndDate) : null,
        ProjectDetail: body.ProjectDetail || null,
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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getTokenFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const all = await prisma.projects.findMany();
    const project = all.find((p) => p.ProjectID === parseInt(id));
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (user.role !== "admin" && project.UserID !== user.userId) {
      return NextResponse.json({ error: "Forbidden — you can only delete your own projects" }, { status: 403 });
    }

    await prisma.projects.delete({ where: { ProjectID: parseInt(id) } });
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

//   const project = await prisma.projects.findFirst({
//     where: {
//       ProjectID: parseInt(params.id),
//       ...(user.role !== "admin" ? { UserID: user.userId } : {}),
//     },
//     include: {
//       expenses: { select: { Amount: true } },
//       incomes: { select: { Amount: true } },
//     },
//   });

//   if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
//   return NextResponse.json(project);
// }

// export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
//   const user = getTokenFromRequest(req);
//   if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//   const body = await req.json();

//   await prisma.projects.updateMany({
//     where: {
//       ProjectID: parseInt(params.id),
//       ...(user.role !== "admin" ? { UserID: user.userId } : {}),
//     },
//     data: {
//       ProjectName: body.ProjectName,
//       ProjectLogo: body.ProjectLogo || null,
//       ProjectStartDate: body.ProjectStartDate ? new Date(body.ProjectStartDate) : null,
//       ProjectEndDate: body.ProjectEndDate ? new Date(body.ProjectEndDate) : null,
//       ProjectDetail: body.ProjectDetail || null,
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

//   await prisma.projects.deleteMany({
//     where: {
//       ProjectID: parseInt(params.id),
//       ...(user.role !== "admin" ? { UserID: user.userId } : {}),
//     },
//   });

//   return NextResponse.json({ success: true });
// }