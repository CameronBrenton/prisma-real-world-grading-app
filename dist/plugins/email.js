"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mail_1 = __importDefault(require("@sendgrid/mail"));
const emailPlugin = {
    name: "app/email",
    register: async function (server) {
        if (!process.env.SENDGRID_API_KEY) {
            console.log(`The SENDGRID_API_KEY env var must be set, otherwise the API won't be able to send emails.`, `Using debug mode which logs the email tokens instead.`);
            server.app.sendEmailToken = debugSendEmailToken;
        }
        else {
            mail_1.default.setApiKey(process.env.SENDGRID_API_KEY);
            server.app.sendEmailToken = sendEmailToken;
        }
    },
};
exports.default = emailPlugin;
async function sendEmailToken(email, token) {
    const msg = {
        to: email,
        from: "EMAIL_ADDRESS_CONFIGURED_IN_SEND_GRID@email.com",
        subject: "Login token for the modern backend API",
        text: `The login token for the API is: ${token}`,
    };
    await mail_1.default.send(msg);
}
async function debugSendEmailToken(email, token) {
    console.log(`email token for ${email}: ${token} `);
}
//# sourceMappingURL=email.js.map