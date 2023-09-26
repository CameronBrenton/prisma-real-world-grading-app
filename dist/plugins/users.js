"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = __importDefault(require("@hapi/joi"));
const boom_1 = __importDefault(require("@hapi/boom"));
// plugin to instantiate Prisma Client
const usersPlugin = {
    name: "app/users",
    dependencies: ["prisma"],
    register: async function (server) {
        server.route([
            {
                method: "POST",
                path: "/users",
                handler: createUserHandler,
                options: {
                    validate: {
                        payload: createUserValidator,
                    },
                },
            },
            {
                method: "GET",
                path: "/users/{userId}",
                handler: getUserHandler,
                options: {
                    validate: {
                        params: joi_1.default.object({
                            userId: joi_1.default.number().integer(),
                        }),
                    },
                },
            },
            {
                method: "DELETE",
                path: "/users/{userId}",
                handler: deleteUserHandler,
                options: {
                    validate: {
                        params: joi_1.default.object({
                            userId: joi_1.default.number().integer(),
                        }),
                    },
                },
            },
            {
                method: "PUT",
                path: "/users/{userId}",
                handler: updateUserHandler,
                options: {
                    validate: {
                        params: joi_1.default.object({
                            userId: joi_1.default.number().integer(),
                            artifact: null,
                        }),
                        payload: updateUserValidator,
                    },
                },
            },
        ]);
    },
};
exports.default = usersPlugin;
const userInputValidator = joi_1.default.object({
    firstName: joi_1.default.string().alter({
        create: (schema) => schema.required(),
        update: (schema) => schema.optional(),
    }),
    lastName: joi_1.default.string().alter({
        create: (schema) => schema.required(),
        update: (schema) => schema.optional(),
    }),
    email: joi_1.default.string()
        .email()
        .alter({
        create: (schema) => schema.required(),
        update: (schema) => schema.optional(),
    }),
    social: joi_1.default.object({
        facebook: joi_1.default.string().optional(),
        twitter: joi_1.default.string().optional(),
        github: joi_1.default.string().optional(),
        website: joi_1.default.string().optional(),
    }).optional(),
});
const createUserValidator = userInputValidator.tailor("create");
const updateUserValidator = userInputValidator.tailor("update");
async function registerHandler(request, h) {
    const { prisma } = request.server.app;
    const payload = request.payload;
    try {
        const createdUser = await prisma.user.create({
            data: {
                firstName: payload.firstName,
                lastName: payload.lastName,
                email: payload.email,
                social: JSON.stringify(payload.social),
            },
            select: {
                id: true,
            },
        });
        return h.response(createdUser).code(201);
    }
    catch (err) {
        console.log(err);
    }
}
async function createUserHandler(request, h) {
    const { prisma } = request.server.app;
    const payload = request.payload;
    try {
        const createdUser = await prisma.user.create({
            data: {
                firstName: payload.firstName,
                lastName: payload.lastName,
                email: payload.email,
                social: JSON.stringify(payload.social),
            },
            select: {
                id: true,
            },
        });
        return h.response(createdUser).code(201);
    }
    catch (err) {
        console.log(err);
    }
}
async function getUserHandler(request, h) {
    const { prisma } = request.server.app;
    const userId = parseInt(request.params.userId, 10);
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            },
        });
        if (!user) {
            return h.response().code(404);
        }
        else {
            return h.response(user).code(200);
        }
    }
    catch (err) {
        console.log(err);
        return boom_1.default.badImplementation();
    }
}
async function deleteUserHandler(request, h) {
    const { prisma } = request.server.app;
    const userId = parseInt(request.params.userId, 10);
    try {
        await prisma.user.delete({
            where: {
                id: userId,
            },
        });
        return h.response().code(204);
    }
    catch (err) {
        console.log(err);
        return h.response().code(500);
    }
}
async function updateUserHandler(request, h) {
    const { prisma } = request.server.app;
    const userId = parseInt(request.params.userId, 10);
    const payload = request.payload;
    try {
        const updatedUser = await prisma.user.update({
            where: {
                id: userId,
            },
            data: payload,
        });
        return h.response(updatedUser).code(200);
    }
    catch (err) {
        console.log(err);
        return h.response().code(500);
    }
}
//# sourceMappingURL=users.js.map