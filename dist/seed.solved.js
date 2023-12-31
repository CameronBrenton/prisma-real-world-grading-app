"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
// Instantiate Prisma Client
const prisma = new client_1.PrismaClient();
// A `main` function so that we can use async/await
async function main() {
    await prisma.testResult.deleteMany({});
    await prisma.courseEnrollment.deleteMany({});
    await prisma.test.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.course.deleteMany({});
    const grace = await prisma.user.create({
        data: {
            email: "grace@hey.com",
            firstName: "Grace",
            lastName: "Bell",
            social: {
                facebook: "gracebell",
                twitter: "therealgracebell",
            },
        },
    });
    const weekFromNow = (0, date_fns_1.add)(new Date(), { days: 7 });
    const twoWeekFromNow = (0, date_fns_1.add)(new Date(), { days: 14 });
    const monthFromNow = (0, date_fns_1.add)(new Date(), { days: 28 });
    const course = await prisma.course.create({
        data: {
            name: "CRUD with Prisma",
            tests: {
                create: [
                    {
                        date: weekFromNow,
                        name: "First test",
                    },
                    {
                        date: twoWeekFromNow,
                        name: "Second test",
                    },
                    {
                        date: monthFromNow,
                        name: "Final exam",
                    },
                ],
            },
            members: {
                create: {
                    role: "TEACHER",
                    user: {
                        connect: {
                            email: grace.email,
                        },
                    },
                },
            },
        },
        include: {
            tests: true,
        },
    });
    const shakuntala = await prisma.user.create({
        data: {
            email: "devi@prisma.io",
            firstName: "Shakuntala",
            lastName: "Devi",
            courses: {
                create: {
                    role: "STUDENT",
                    course: {
                        connect: { id: course.id },
                    },
                },
            },
        },
    });
    const david = await prisma.user.create({
        data: {
            email: "david@prisma.io",
            firstName: "David",
            lastName: "Deutsch",
            courses: {
                create: {
                    role: "STUDENT",
                    course: {
                        connect: { id: course.id },
                    },
                },
            },
        },
    });
    const testResultsDavid = [650, 900, 950];
    const testResultsShakuntala = [800, 950, 910];
    let counter = 0;
    for (const test of course.tests) {
        await prisma.testResult.create({
            data: {
                gradedBy: {
                    connect: { email: grace.email },
                },
                student: {
                    connect: { email: shakuntala.email },
                },
                test: {
                    connect: { id: test.id },
                },
                result: testResultsShakuntala[counter],
            },
        });
        await prisma.testResult.create({
            data: {
                gradedBy: {
                    connect: { email: grace.email },
                },
                student: {
                    connect: { email: david.email },
                },
                test: {
                    connect: { id: test.id },
                },
                result: testResultsDavid[counter],
            },
        });
        // Get aggregates for each test
        const results = await prisma.testResult.aggregate({
            where: {
                testId: test.id,
            },
            _avg: { result: true },
            _max: { result: true },
            _min: { result: true },
            _count: true,
        });
        console.log(`test: ${test.name} (id: ${test.id})`, results);
        counter++;
    }
    // Get aggregates for David
    const davidAggregates = await prisma.testResult.aggregate({
        where: {
            student: { email: david.email },
        },
        _avg: { result: true },
        _max: { result: true },
        _min: { result: true },
        _count: true,
    });
    console.log(`David's results (email: ${david.email})`, davidAggregates);
    // Get aggregates for Shakuntala
    const shakuntalaAggregates = await prisma.testResult.aggregate({
        where: {
            student: { email: shakuntala.email },
        },
        _avg: { result: true },
        _max: { result: true },
        _min: { result: true },
        _count: true,
    });
    console.log(`Shakuntala's results (email: ${shakuntala.email})`, shakuntalaAggregates);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    // Disconnect Prisma Client
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.solved.js.map