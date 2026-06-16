import * as fileSchema from "./file-schema.ts";
import * as schema from "./schema.ts";

export const dbSchema = { ...schema, ...fileSchema };
