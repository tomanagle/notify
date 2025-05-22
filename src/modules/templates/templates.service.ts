import { eq, InferInsertModel } from "drizzle-orm";
import { DB } from "../../db";
import { templates } from "../../db/schema";

export async function getTemplate(id: string, db: DB) {
  const template = await db.query.templates.findFirst({
    where: eq(templates.id, id),
  });

  return template;
}

export async function listTemplates(db: DB) {
  const allTemplates = await db.query.templates.findMany();
  return allTemplates;
}

export async function createTemplate(
  props: InferInsertModel<typeof templates>,
  db: DB
) {
  const template = await db.insert(templates).values(props).returning({
    id: templates.id,
    name: templates.name,
    content: templates.content,
    engine: templates.engine,
    createdAt: templates.createdAt,
    updatedAt: templates.updatedAt,
  });

  return template[0];
}

export async function updateTemplate(
  id: string,
  props: Partial<InferInsertModel<typeof templates>>,
  db: DB
) {
  const template = await db
    .update(templates)
    .set(props)
    .where(eq(templates.id, id))
    .returning({
      id: templates.id,
      name: templates.name,
      content: templates.content,
      engine: templates.engine,
      createdAt: templates.createdAt,
      updatedAt: templates.updatedAt,
    });

  return template[0];
}

export async function deleteTemplate(id: string, db: DB) {
  await db.delete(templates).where(eq(templates.id, id));
}