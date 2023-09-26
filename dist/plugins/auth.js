"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_AUTH_STATEGY = void 0;
const boom_1 = __importDefault(require("@hapi/boom"));
const joi_1 = __importDefault(require("@hapi/joi"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
const authPlugin = {
    name: "app/auth",
    dependencies: ["prisma", "hapi-auth-jwt2", "app/email"],
    register: async function (server) {
        // Define the authentication strategy which uses the `jwt` authentication scheme
        server.auth.strategy(exports.API_AUTH_STATEGY, "jwt", {
            key: JWT_SECRET,
            verifyOptions: { algorithms: [JWT_ALGORITHM] },
            validate: validateAPIToken,
        });
        // Set the default authentication strategy for API routes, unless explicitly disabled
        server.auth.default(exports.API_AUTH_STATEGY);
        server.route([
            // Endpoint to login or register and to send the short-lived token
            {
                method: "POST",
                path: "/login",
                handler: loginHandler,
                options: {
                    auth: false,
                    validate: {
                        payload: joi_1.default.object({
                            email: joi_1.default.string().email().required(),
                        }),
                    },
                },
            },
            {
                method: "POST",
                path: "/authenticate",
                handler: authenticateHandler,
                options: {
                    auth: false,
                    validate: {
                        payload: joi_1.default.object({
                            email: joi_1.default.string().email().required(),
                            emailToken: joi_1.default.string().required(),
                        }),
                    },
                },
            },
        ]);
    },
};
exports.default = authPlugin;
// This strategy will be used across the application to secure routes
exports.API_AUTH_STATEGY = "API";
const EMAIL_TOKEN_EXPIRATION_MINUTES = 10;
const apiTokenSchema = joi_1.default.object({
    tokenId: joi_1.default.number().integer().required(),
});
// Function will be called on every request using the auth strategy
const validateAPIToken = async (decoded, request, h) => {
    const { prisma } = request.server.app;
    const { tokenId } = decoded;
    // Validate the token payload adheres to the schema
    const { error } = apiTokenSchema.validate(decoded);
    if (error) {
        request.log(["error", "auth"], `API token error: ${error.message}`);
        return { isValid: false };
    }
    try {
        // Fetch the token from DB to verify it's valid
        const fetchedToken = await prisma.token.findUnique({
            where: {
                id: tokenId,
            },
            include: {
                user: true,
            },
        });
        // Check if token could be found in database and is valid
        if (!fetchedToken || !(fetchedToken === null || fetchedToken === void 0 ? void 0 : fetchedToken.valid)) {
            return { isValid: false, errorMessage: "Invalid Token" };
        }
        // Check token expiration
        if (fetchedToken.expiration < new Date()) {
            return { isValid: false, errorMessage: "Token expired" };
        }
        // Get all the courses that the user is the teacher of
        const teacherOf = await prisma.courseEnrollment.findMany({
            where: {
                userId: fetchedToken.userId,
                role: client_1.UserRole.TEACHER,
            },
            select: {
                courseId: true,
            },
        });
        // The token is valid. Make the `userId`, `isAdmin`, and `teacherOf` to `credentials` which is available in route handlers via `request.auth.credentials`
        return {
            isValid: true,
            credentials: {
                tokenId: decoded.tokenId,
                userId: fetchedToken.userId,
                isAdmin: fetchedToken.user.isAdmin,
                // convert teacherOf from an array of objects to an array of numbers
                teacherOf: teacherOf.map(({ courseId }) => courseId),
            },
        };
    }
    catch (error) {
        request.log(["error", "auth", "db"], error);
        return { isValid: false };
    }
};
async function loginHandler(request, h) {
    // 👇 get prisma and the sendEmailToken from shared application state
    const { prisma, sendEmailToken } = request.server.app;
    // 👇 get the email from the request payload
    const { email } = request.payload;
    // 👇 generate an alphanumeric token
    const emailToken = generateEmailToken();
    // 👇 create a date object for the email token expiration
    const tokenExpiration = (0, date_fns_1.add)(new Date(), {
        minutes: EMAIL_TOKEN_EXPIRATION_MINUTES,
    });
    try {
        // 👇 create a short lived token and update user or create if they don't exist
        const createdToken = await prisma.token.create({
            data: {
                emailToken,
                type: client_1.TokenType.EMAIL,
                expiration: tokenExpiration,
                user: {
                    connectOrCreate: {
                        create: {
                            email,
                        },
                        where: {
                            email,
                        },
                    },
                },
            },
        });
        // 👇 send the email token
        await sendEmailToken(email, emailToken);
        return h.response().code(200);
    }
    catch (error) {
        return boom_1.default.badImplementation(error.message);
    }
}
// Generate a random 8 digit number as the email token
function generateEmailToken() {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
}
// Load the JWT secret from environment variables or default
const JWT_SECRET = process.env.JWT_SECRET || "SUPER_SECRET_JWT_SECRET";
const JWT_ALGORITHM = "HS256";
const AUTHENTICATION_TOKEN_EXPIRATION_HOURS = 12;
async function authenticateHandler(request, h) {
    var _a;
    // 👇 get prisma from shared application state
    const { prisma } = request.server.app;
    // 👇 get the email and emailToken from the request payload
    const { email, emailToken } = request.payload;
    try {
        // Get short lived email token
        const fetchedEmailToken = await prisma.token.findUnique({
            where: {
                emailToken: emailToken,
            },
            include: {
                user: true,
            },
        });
        if (!(fetchedEmailToken === null || fetchedEmailToken === void 0 ? void 0 : fetchedEmailToken.valid)) {
            // If the token doesn't exist or is not valid, return 401 unauthorized
            return boom_1.default.unauthorized();
        }
        if (fetchedEmailToken.expiration < new Date()) {
            // If the token has expired, return 401 unauthorized
            return boom_1.default.unauthorized("Token expired");
        }
        // If token matches the user email passed in the payload, generate long lived API token
        if (((_a = fetchedEmailToken === null || fetchedEmailToken === void 0 ? void 0 : fetchedEmailToken.user) === null || _a === void 0 ? void 0 : _a.email) === email) {
            const tokenExpiration = (0, date_fns_1.add)(new Date(), {
                hours: AUTHENTICATION_TOKEN_EXPIRATION_HOURS,
            });
            // Persist token in DB so it's stateful
            const createdToken = await prisma.token.create({
                data: {
                    type: client_1.TokenType.API,
                    expiration: tokenExpiration,
                    user: {
                        connect: {
                            email,
                        },
                    },
                },
            });
            // Invalidate the email token after it's been used
            await prisma.token.update({
                where: {
                    id: fetchedEmailToken.id,
                },
                data: {
                    valid: false,
                },
            });
            const authToken = generateAuthToken(createdToken.id);
            return h.response().code(200).header("Authorization", authToken);
        }
        else {
            return boom_1.default.unauthorized();
        }
    }
    catch (error) {
        return boom_1.default.badImplementation(error.message);
    }
}
// Generate a signed JWT token with the tokenId in the payload
function generateAuthToken(tokenId) {
    const jwtPayload = { tokenId };
    return jsonwebtoken_1.default.sign(jwtPayload, JWT_SECRET, {
        algorithm: JWT_ALGORITHM,
        noTimestamp: true,
    });
}
//# sourceMappingURL=auth.js.map