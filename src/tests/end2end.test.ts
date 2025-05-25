import { describe, expect, it } from "vitest";
import { buildServer } from "../utils/server";

describe("end2end", () => {
  it("should send an SMS", async () => {
    expect(true).toBe(true);

    const ctx = new AbortController();

    const { server } = await buildServer({
      signal: ctx.signal,
    });

    await server.ready();

    const createTemplateResult = await server.inject({
      method: "POST",
      url: "/v1/templates",
      body: {
        name: "test",
        content: "Hello, world!",
      },
    });

    expect(createTemplateResult.statusCode).toBe(201);
    const templateId = createTemplateResult.json().id;

    expect(templateId).toBeDefined();

    const createCredentialsResult = await server.inject({
      method: "POST",
      url: "/v1/credentials",
      body: {
        provider: "twilio",
        key: "test",
        options: {
          accountSid: "test",
          authToken: "test",
        },
      },
    });

    expect(createCredentialsResult.statusCode).toBe(201);
    const credentialsId = createCredentialsResult.json().id;

    expect(credentialsId).toBeDefined();
  });
});
