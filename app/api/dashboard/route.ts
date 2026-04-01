import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = getTokenFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Fetch everything separately (MariaDB adapter limitation - no Promise.all with include)

    const allExpenses = await prisma.expenses.findMany({
      include: { categories: true, peoples: true, projects: true },
    });

    const allIncomes = await prisma.incomes.findMany({
      include: { categories: true, peoples: true, projects: true },
    });

    const allProjects = await prisma.projects.findMany();
    const allCategories = await prisma.categories.findMany();

    // Filter by user role
    const expenses = allExpenses.filter((e) =>
      user.role === "admin" ? true : e.UserID === user.userId
    );
    const incomes = allIncomes.filter((i) =>
      user.role === "admin" ? true : i.UserID === user.userId
    );
    const projects = allProjects.filter((p) =>
      user.role === "admin" ? true : p.UserID === user.userId
    );

    // Totals
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.Amount), 0);
    const totalIncomes = incomes.reduce((sum, i) => sum + Number(i.Amount), 0);

    // Recent 5
    const recentExpenses = [...expenses]
      .sort((a, b) => new Date(b.ExpenseDate).getTime() - new Date(a.ExpenseDate).getTime())
      .slice(0, 5);

    const recentIncomes = [...incomes]
      .sort((a, b) => new Date(b.IncomeDate).getTime() - new Date(a.IncomeDate).getTime())
      .slice(0, 5);

    // Category-wise expense chart
    const categoryMap: Record<number, { name: string; value: number }> = {};
    for (const e of expenses) {
      if (!e.CategoryID) continue;
      const cat = allCategories.find((c) => c.CategoryID === e.CategoryID);
      const name = cat?.CategoryName || "Unknown";
      if (!categoryMap[e.CategoryID]) categoryMap[e.CategoryID] = { name, value: 0 };
      categoryMap[e.CategoryID].value += Number(e.Amount);
    }
    const categoryChart = Object.values(categoryMap);

    // Project-wise chart
    const projectChart = projects.map((p) => {
      const projExpenses = expenses.filter((e) => e.ProjectID === p.ProjectID);
      const projIncomes = incomes.filter((i) => i.ProjectID === p.ProjectID);
      return {
        name: p.ProjectName,
        expenses: projExpenses.reduce((s, e) => s + Number(e.Amount), 0),
        incomes: projIncomes.reduce((s, i) => s + Number(i.Amount), 0),
      };
    });

    // Monthly chart (current year)
    const currentYear = new Date().getFullYear();
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const monthlyData = months.map((month, idx) => {
      const monthExpenses = expenses.filter((e) => {
        const d = new Date(e.ExpenseDate);
        return d.getFullYear() === currentYear && d.getMonth() === idx;
      });
      const monthIncomes = incomes.filter((i) => {
        const d = new Date(i.IncomeDate);
        return d.getFullYear() === currentYear && d.getMonth() === idx;
      });
      return {
        month,
        expense: monthExpenses.reduce((s, e) => s + Number(e.Amount), 0),
        income: monthIncomes.reduce((s, i) => s + Number(i.Amount), 0),
      };
    });

    return NextResponse.json({
      totalExpenses,
      totalIncomes,
      netBalance: totalIncomes - totalExpenses,
      recentExpenses,
      recentIncomes,
      categoryChart,
      projectChart,
      monthlyData,
    });
  } catch (err) {
    console.error("dashboard GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { getTokenFromRequest } from "@/lib/auth";

// export async function GET(req: NextRequest) {
//   const user = getTokenFromRequest(req);
//   if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//   const whereClause = user.role === "admin" ? {} : { UserID: user.userId };

//   const [totalExpenses, totalIncomes, recentExpenses, recentIncomes,
//          categoryExpenses, monthlyData, projectSummary] = await Promise.all([
//     // Total expense sum
//     prisma.expenses.aggregate({ where: whereClause, _sum: { Amount: true } }),
//     // Total income sum
//     prisma.incomes.aggregate({ where: whereClause, _sum: { Amount: true } }),
//     // Recent 5 expenses
//     prisma.expenses.findMany({
//       where: whereClause, take: 5, orderBy: { ExpenseDate: "desc" },
//       include: { categories: true, peoples: true, projects: true },
//     }),
//     // Recent 5 incomes
//     prisma.incomes.findMany({
//       where: whereClause, take: 5, orderBy: { IncomeDate: "desc" },
//       include: { categories: true, peoples: true, projects: true },
//     }),
//     // Category-wise expenses
//     prisma.expenses.groupBy({
//       by: ["CategoryID"], where: whereClause,
//       _sum: { Amount: true },
//     }),
//     // Monthly totals for current year
//     prisma.$queryRaw`
//       SELECT 
//         DATE_FORMAT(ExpenseDate, '%Y-%m') as month,
//         SUM(Amount) as total
//       FROM expenses
//       WHERE UserID = ${user.role === "admin" ? null : user.userId}
//         OR ${user.role === "admin"} = true
//       GROUP BY month ORDER BY month DESC LIMIT 12
//     `,
//     // Project-wise summary
//     prisma.projects.findMany({
//       where: whereClause,
//       include: {
//         expenses: { select: { Amount: true } },
//         incomes: { select: { Amount: true } },
//       },
//     }),
//   ]);

//   // Enrich category data with names
//   const categoryIDs = categoryExpenses.map((c) => c.CategoryID).filter(Boolean);
//   const categories = await prisma.categories.findMany({
//     where: { CategoryID: { in: categoryIDs as number[] } },
//   });

//   const categoryChart = categoryExpenses.map((ce) => ({
//     name: categories.find((c) => c.CategoryID === ce.CategoryID)?.CategoryName || "Unknown",
//     value: Number(ce._sum.Amount || 0),
//   }));

//   const projectChart = projectSummary.map((p) => ({
//     name: p.ProjectName,
//     expenses: p.expenses.reduce((s, e) => s + Number(e.Amount), 0),
//     incomes: p.incomes.reduce((s, e) => s + Number(e.Amount), 0),
//   }));

//   return NextResponse.json({
//     totalExpenses: Number(totalExpenses._sum.Amount || 0),
//     totalIncomes: Number(totalIncomes._sum.Amount || 0),
//     netBalance: Number(totalIncomes._sum.Amount || 0) - Number(totalExpenses._sum.Amount || 0),
//     recentExpenses,
//     recentIncomes,
//     categoryChart,
//     monthlyData,
//     projectChart,
//   });
// }