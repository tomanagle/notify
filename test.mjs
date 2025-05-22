import { faker } from "@faker-js/faker";
import axios from "axios";

const providers = ["test"];

async function sendMessage() {
  const provider = providers[Math.floor(Math.random() * providers.length)];

  const payload = {
    credentialsKey: "test",
    sendOptions: {
      fromNumber: faker.phone.number(),
      toNumber: faker.phone.number(),
    },
    templateVariables: {
      firstname: faker.person.firstName(),
      lastname: faker.person.lastName(),
    },
    templateId: "cb35f8df-e802-4a5b-8633-934cc50eb175",
  };

  await axios.post("http://localhost:1337/v1/messages", payload);
}

const batchSize = 1000;

await Promise.all(Array.from({ length: 1 }, sendMessage));
await Promise.all(Array.from({ length: batchSize }, sendMessage));
await Promise.all(Array.from({ length: batchSize }, sendMessage));
await Promise.all(Array.from({ length: batchSize }, sendMessage));
await Promise.all(Array.from({ length: batchSize }, sendMessage));
await Promise.all(Array.from({ length: batchSize }, sendMessage));
await Promise.all(Array.from({ length: batchSize }, sendMessage));
await Promise.all(Array.from({ length: batchSize }, sendMessage));
await Promise.all(Array.from({ length: batchSize }, sendMessage));
await Promise.all(Array.from({ length: batchSize }, sendMessage));


process.exit(0);