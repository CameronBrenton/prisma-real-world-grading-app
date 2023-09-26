import Hapi from "@hapi/hapi";
import statusPlugin from "./plugins/status";
import prismaPlugin from "./plugins/prisma";
import usersPlugin from "./plugins/users";
import emailPlugin from "./plugins/email";
import hapiAuthJWT from "hapi-auth-jwt2";
import authPlugin from "./plugins/auth";
import coursesPlugin from "./plugins/courses";
import usersEnrollmentPlugin from "./plugins/users-enrollment";
import testResultsPlugin from "./plugins/test-results";
import testsPlugin from "./plugins/tests";

const server: Hapi.Server = Hapi.server({
  port: process.env.PORT || 3000,
  host: process.env.HOST || "localhost",
});

export async function createServer(): Promise<Hapi.Server> {
  await server.register([
    statusPlugin,
    prismaPlugin,
    usersPlugin,
    emailPlugin,
    hapiAuthJWT,
    authPlugin,
    coursesPlugin,
    usersEnrollmentPlugin,
    testResultsPlugin,
    testsPlugin,
  ]);
  await server.initialize();

  return server;
}

export async function startServer(server: Hapi.Server): Promise<Hapi.Server> {
  await server.start();
  console.log(`Server running on ${server.info.uri}`);
  return server;
}

process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});
