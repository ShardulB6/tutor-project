import { ensureSession } from "../auth/auth.functions";
import { db } from "#/db";
import { NotebooksTable } from "#/db/schema";
import { createUpdateSchema, createInsertSchema } from "drizzle-zod";

import { eq, and } from "drizzle-orm";
import z from "zod";


