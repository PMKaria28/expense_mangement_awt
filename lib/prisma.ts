import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// import { PrismaMariaDb } from "@prisma/adapter-mariadb";
// import { PrismaClient } from "@/app/generated/prisma/client";
// const adapter = new PrismaMariaDb({
// host:"localhost",
// port:3307,
// user:"root",
// password:"Parva@123",
// database:"expense_management",
// connectionLimit:5
// })
// export const prisma = new PrismaClient({adapter});
