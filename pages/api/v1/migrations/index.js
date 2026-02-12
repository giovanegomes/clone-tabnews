import migrationRunner from "node-pg-migrate";
import { join } from "node:path";
import database from "infra/database";

export default async function migrations(request, response) {
  const dbClient = await database.getNewClient();
  const defaultMigrationOptions = {
    dbClient,
    databaseUrl: process.env.DATABASE_URL,
    dryRun: request.method === "GET",
    dir: join("infra", "migrations"),
    direction: "up",
    verbose: true,
    migrationsTable: "pgmigrations",
  };

  console.log("request.method", request.method);
  if (request.method === "GET") {
    const pendingMigrations = await migrationRunner(defaultMigrationOptions);

    await dbClient.end();

    return response.status(200).json(pendingMigrations);
  }

  if (request.method === "POST") {
    const migratedMigrations = await migrationRunner(defaultMigrationOptions);
    const status = migratedMigrations.length > 0 ? 201 : 200;

    await dbClient.end();

    return response.status(status).json(migratedMigrations);
  }

  return response.status(405).end;
}
