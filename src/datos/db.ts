import { neon } from "@neondatabase/serverless";

// Cliente nativo ultra-rápido para Neon PostgreSQL Serverless
const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_FdAhisCp2M8V@ep-fragrant-surf-b4tzw0h1.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require";

export const sql = neon(connectionString);

export default sql;
