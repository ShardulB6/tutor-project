import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { ensureSession } from "../auth/auth.functions";
import { db } from "#/db";
import { NotebooksTable, ThreadsTable, type NotebookId, type ThreadId } from "#/db/schema";

import { and, eq } from "drizzle-orm";
import z from "zod";
import { ensureNotebook, ensureThread, ensureMessage } from "./auth.functions";

