import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest } from "@/lib/auth";
import { Prisma } from "@/app/generated/prisma/client";

export async function GET(req: NextRequest) {
  const user = getTokenFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

  const whereUser = user.role === "admin" ? {} : { UserID: user.userId };
  const dateFilter = {
    gte: new Date(`${year}-01-01`),
    lte: new Date(`${year}-12-31`),
  };

  const [expenseMonthly, incomeMonthly, categoryData, projectData, totalE, totalI, count] = await Promise.all([
    prisma.$queryRaw<any[]>`
      SELECT DATE_FORMAT(ExpenseDate, '%b') as month, MONTH(ExpenseDate) as monthNum, SUM(Amount) as total
      FROM expenses
      WHERE YEAR(ExpenseDate) = ${year}
        ${user.role !== "admin" ? Prisma.sql`AND UserID = ${user.userId}` : Prisma.empty}
      GROUP BY month, monthNum ORDER BY monthNum
    `,
    prisma.$queryRaw<any[]>`
      SELECT DATE_FORMAT(IncomeDate, '%b') as month, MONTH(IncomeDate) as monthNum, SUM(Amount) as total
      FROM incomes
      WHERE YEAR(IncomeDate) = ${year}
        ${user.role !== "admin" ? Prisma.sql`AND UserID = ${user.userId}` : Prisma.empty}
      GROUP BY month, monthNum ORDER BY monthNum
    `,
    prisma.$queryRaw<any[]>`
      SELECT c.CategoryName as name, SUM(e.Amount) as amount
      FROM expenses e
      JOIN categories c ON e.CategoryID = c.CategoryID
      WHERE YEAR(e.ExpenseDate) = ${year}
        ${user.role !== "admin" ? Prisma.sql`AND e.UserID = ${user.userId}` : Prisma.empty}
      GROUP BY c.CategoryID, c.CategoryName
    `,
    prisma.$queryRaw<any[]>`
      SELECT p.ProjectName as name,
        COALESCE(SUM(e.Amount), 0) as expense,
        COALESCE(SUM(i.Amount), 0) as income
      FROM projects p
      LEFT JOIN expenses e ON p.ProjectID = e.ProjectID AND YEAR(e.ExpenseDate) = ${year}
      LEFT JOIN incomes i ON p.ProjectID = i.ProjectID AND YEAR(i.IncomeDate) = ${year}
      ${user.role !== "admin" ? Prisma.sql`WHERE p.UserID = ${user.userId}` : Prisma.empty}
      GROUP BY p.ProjectID, p.ProjectName
    `,
    prisma.expenses.aggregate({ where: { ...whereUser, ExpenseDate: dateFilter }, _sum: { Amount: true } }),
    prisma.incomes.aggregate({ where: { ...whereUser, IncomeDate: dateFilter }, _sum: { Amount: true } }),
    prisma.expenses.count({ where: { ...whereUser, ExpenseDate: dateFilter } }),
  ]);

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthly = months.map(m => ({
    month: m,
    income: Number(incomeMonthly.find(r => r.month === m)?.total || 0),
    expense: Number(expenseMonthly.find(r => r.month === m)?.total || 0),
  }));

  return NextResponse.json({
    monthly,
    categories: categoryData.map(c => ({ ...c, amount: Number(c.amount) })),
    projects: projectData.map(p => ({ ...p, income: Number(p.income), expense: Number(p.expense) })),
    summary: {
      totalIncome: Number(totalI._sum.Amount || 0),
      totalExpense: Number(totalE._sum.Amount || 0),
      count,
    },
  });
}