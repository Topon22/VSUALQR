import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Resolve the correct DATABASE_URL.
 *
 * The sandbox environment may inject a system-level DATABASE_URL pointing to
 * a local SQLite file (file:/home/z/my-project/db/custom.db).  In Next.js,
 * system env vars take precedence over .env files, so we must explicitly
 * check whether the value looks like a PostgreSQL URL; if not, we fall back
 * to the hardcoded pooled connection string.
 */
function resolveDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL ?? '';

  // Pool params to avoid connection pool timeouts
  const poolParams = '&connection_limit=5&pool_timeout=20';

  // Accept both postgres:// and postgresql:// protocols
  if (envUrl.startsWith('postgres://') || envUrl.startsWith('postgresql://')) {
    // Append pool params if not already present
    if (!envUrl.includes('connection_limit=')) {
      return envUrl + poolParams;
    }
    return envUrl;
  }

  // Fallback: the Prisma.io PostgreSQL pooled connection string
  // (This would normally come from .env but is overridden by the system env)
  return 'postgres://b7153fd99fc148a2ec1ca4c02f11ac5dc39a0bd3575e03eaabda7ae1f44f4245:sk_ZjQAHYwmu4NJw0zghdWin@pooled.db.prisma.io:5432/postgres?sslmode=require' + poolParams;
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: resolveDatabaseUrl(),
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
