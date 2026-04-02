// Run with: npx tsx scripts/seed-admin.ts
// Make sure DATABASE_URL in .env points to TiDB Cloud before running

import { PrismaClient } from "../app/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const now = new Date();

  // ─── USERS ────────────────────────────────────────────────────────────────
  const existingUsers = await prisma.users.findMany();
  const existingEmails = new Set(existingUsers.map((u) => u.EmailAddress.toLowerCase()));

  const usersToSeed = [
    { UserName: "AdminUser", EmailAddress: "admin@example.com", Password: "admin123", MobileNo: "9876543210", ProfileImage: "admin_pic.jpg" },
    { UserName: "StaffUser", EmailAddress: "staff@example.com", Password: "staff123", MobileNo: "9123456789", ProfileImage: "staff_pic.jpg" },
  ];

  for (const u of usersToSeed) {
    if (existingEmails.has(u.EmailAddress.toLowerCase())) {
      console.log(`✓ User already exists: ${u.EmailAddress}`);
    } else {
      const created = await prisma.users.create({ data: { ...u, Created: now, Modified: now } });
      console.log(`✓ Created user: ${u.EmailAddress} (UserID: ${created.UserID})`);
    }
  }

  // Re-fetch to get actual UserIDs
  const adminUser = (await prisma.users.findMany()).find(
    (u) => u.EmailAddress.toLowerCase() === "admin@example.com"
  )!;
  const adminId = adminUser.UserID;

  // ─── PEOPLES ──────────────────────────────────────────────────────────────
  let people = await prisma.peoples.findFirst({ where: { Email: "john@example.com" } });
  if (!people) {
    people = await prisma.peoples.create({
      data: {
        PeopleCode: "P001", Password: "pass123", PeopleName: "John Doe",
        Email: "john@example.com", MobileNo: "9988776655",
        Description: "Lead Developer", UserID: adminId,
        Created: now, Modified: now, IsActive: true,
      },
    });
    console.log(`✓ Created person: John Doe (PeopleID: ${people.PeopleID})`);
  } else {
    console.log(`✓ Person already exists: John Doe`);
  }

  // ─── PROJECTS ─────────────────────────────────────────────────────────────
  let project = await prisma.projects.findFirst({ where: { ProjectName: "Website Redesign" } });
  if (!project) {
    project = await prisma.projects.create({
      data: {
        ProjectName: "Website Redesign", ProjectLogo: "web_logo.png",
        ProjectStartDate: new Date("2026-01-01"), ProjectEndDate: new Date("2026-06-30"),
        ProjectDetail: "Internal redesign project", UserID: adminId,
        Created: now, Modified: now, IsActive: true,
      },
    });
    console.log(`✓ Created project: Website Redesign (ProjectID: ${project.ProjectID})`);
  } else {
    console.log(`✓ Project already exists: Website Redesign`);
  }

  // ─── CATEGORIES ───────────────────────────────────────────────────────────
  let catTravel = await prisma.categories.findFirst({ where: { CategoryName: "Travel", UserID: adminId } });
  if (!catTravel) {
    catTravel = await prisma.categories.create({
      data: {
        CategoryName: "Travel", LogoPath: "travel_icon.png",
        IsExpense: true, IsIncome: false, IsActive: true,
        UserID: adminId, Created: now, Modified: now, Sequence: 1.0,
      },
    });
    console.log(`✓ Created category: Travel (CategoryID: ${catTravel.CategoryID})`);
  } else {
    console.log(`✓ Category already exists: Travel`);
  }

  let catIncome = await prisma.categories.findFirst({ where: { CategoryName: "Income Sources", UserID: adminId } });
  if (!catIncome) {
    catIncome = await prisma.categories.create({
      data: {
        CategoryName: "Income Sources", LogoPath: "money_icon.png",
        IsExpense: false, IsIncome: true, IsActive: true,
        UserID: adminId, Created: now, Modified: now, Sequence: 2.0,
      },
    });
    console.log(`✓ Created category: Income Sources (CategoryID: ${catIncome.CategoryID})`);
  } else {
    console.log(`✓ Category already exists: Income Sources`);
  }

  // ─── SUB-CATEGORIES ───────────────────────────────────────────────────────
  let subTaxi = await prisma.sub_categories.findFirst({
    where: { SubCategoryName: "Taxi", CategoryID: catTravel.CategoryID },
  });
  if (!subTaxi) {
    subTaxi = await prisma.sub_categories.create({
      data: {
        CategoryID: catTravel.CategoryID, SubCategoryName: "Taxi",
        LogoPath: "taxi_icon.png", IsExpense: true, IsIncome: false,
        IsActive: true, UserID: adminId, Created: now, Modified: now, Sequence: 1.1,
      },
    });
    console.log(`✓ Created sub-category: Taxi (SubCategoryID: ${subTaxi.SubCategoryID})`);
  } else {
    console.log(`✓ Sub-category already exists: Taxi`);
  }

  // ─── EXPENSES ─────────────────────────────────────────────────────────────
  const existingExpense = await prisma.expenses.findFirst({
    where: { ExpenseDetail: "Taxi to client office", UserID: adminId },
  });
  if (!existingExpense) {
    await prisma.expenses.create({
      data: {
        ExpenseDate: now, CategoryID: catTravel.CategoryID,
        SubCategoryID: subTaxi.SubCategoryID, PeopleID: people.PeopleID,
        ProjectID: project.ProjectID, Amount: 550.00,
        ExpenseDetail: "Taxi to client office", UserID: adminId,
        Created: now, Modified: now,
      },
    });
    console.log(`✓ Created expense: Taxi to client office (₹550)`);
  } else {
    console.log(`✓ Expense already exists`);
  }

  // ─── INCOMES ──────────────────────────────────────────────────────────────
  const existingIncome = await prisma.incomes.findFirst({
    where: { IncomeDetail: "Initial Project Budget", UserID: adminId },
  });
  if (!existingIncome) {
    await prisma.incomes.create({
      data: {
        IncomeDate: now, CategoryID: catIncome.CategoryID,
        SubCategoryID: null, PeopleID: people.PeopleID,
        ProjectID: project.ProjectID, Amount: 5000.00,
        IncomeDetail: "Initial Project Budget", UserID: adminId,
        Created: now, Modified: now,
      },
    });
    console.log(`✓ Created income: Initial Project Budget (₹5000)`);
  } else {
    console.log(`✓ Income already exists`);
  }

  console.log("\n🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
