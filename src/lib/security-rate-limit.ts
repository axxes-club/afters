import { createHash } from "node:crypto";
import { prisma } from "./prisma";
export async function securityRateLimit(key: string, limit: number, windowMs = 60000, executor: Pick<typeof prisma,"$queryRawUnsafe"> = prisma) {
 const resetAt = Date.now() + windowMs;
 if (!Number.isSafeInteger(limit) || limit < 1 || !Number.isSafeInteger(windowMs) || windowMs < 1) return {allowed:false,remaining:0,resetAt};
 const identity = createHash("sha256").update(key).digest("hex");
 try {
  const rows = await executor.$queryRawUnsafe<Array<{ count: number; reset_at: Date }>>(`
   WITH cleanup AS (DELETE FROM afters_security_rate_limits WHERE reset_at < CURRENT_TIMESTAMP - INTERVAL '1 hour' AND key <> $1 AND key IN (SELECT key FROM afters_security_rate_limits WHERE reset_at < CURRENT_TIMESTAMP - INTERVAL '1 hour' AND key <> $1 LIMIT 20) RETURNING key)
   INSERT INTO afters_security_rate_limits (key, count, reset_at) VALUES ($1, 1, CURRENT_TIMESTAMP + ($2::bigint * INTERVAL '1 millisecond'))
   ON CONFLICT (key) DO UPDATE SET
    count = CASE WHEN afters_security_rate_limits.reset_at <= CURRENT_TIMESTAMP THEN 1 ELSE LEAST(afters_security_rate_limits.count, $3::integer) + 1 END,
    reset_at = CASE WHEN afters_security_rate_limits.reset_at <= CURRENT_TIMESTAMP THEN EXCLUDED.reset_at ELSE afters_security_rate_limits.reset_at END
   RETURNING count, reset_at`, identity, windowMs, limit);
  const row=rows[0];
  if (!row) return {allowed:false,remaining:0,resetAt};
  return {allowed:row.count <= limit,remaining:Math.max(0,limit-row.count),resetAt:new Date(row.reset_at).getTime()};
 } catch { return {allowed:false,remaining:0,resetAt}; }
}

export type SecurityBudget={key:string;limit:number;windowMs?:number};
/** Global first lock ordering bounds cardinality; rollback prevents rejected callers spending shared quota. */
export async function securityAdmission(budgets:SecurityBudget[]):Promise<boolean>{
 try{return await prisma.$transaction(async tx=>{
  for(const budget of budgets)if(!(await securityRateLimit(budget.key,budget.limit,budget.windowMs??60000,tx)).allowed)throw new Error('Admission denied');
  return true;
 });}catch{return false;}
}
