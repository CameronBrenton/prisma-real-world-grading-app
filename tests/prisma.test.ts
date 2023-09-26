import { PrismaClient } from "@prisma/client";

describe("example test with Prisma Client", () => {
  let prisma = new PrismaClient();

  beforeAll(async () => {
    await prisma.$connect();
    //seed script test db. Reroute axios calls to the test db. Course enrollment and a Test for Teacher and Student
  });
  afterAll(async () => {
    await prisma.$disconnect();
    //Tear down db
  });
  test("test query", async () => {
    const data = await prisma.user.findMany({ take: 1, select: { id: true } });
    expect(data).toBeTruthy();
  });
});
