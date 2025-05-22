import { faker } from "@faker-js/faker";
import { setupDB } from "../db/index";
import { config } from "../config";
import { createUser } from "../modules/user/user.service";

async function main() {
  const { db, client } = await setupDB(config.DATABASE_URL);

  await Promise.all(
    Array.from({ length: 100 }, () =>
      createUser(
        {
          email: faker.internet.email(),
          password: faker.internet.password(),
        },
        db
      )
    )
  );

  await client.end();

  process.exit(0);
}

main();
