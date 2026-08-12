import { createServerFn } from "@tanstack/react-start";
import { ensureAuthSession } from "../auth/auth.functions";
import { db } from "#/db";
import { NotebooksTable } from "#/db/schema";
import { createInsertSchema } from "drizzle-zod";
