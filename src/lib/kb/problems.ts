// What #4471 holds, problem by problem. causes.ts sorts reports by tenant and channel; that sorting
// cannot see a report whose body describes a different bug. The desk marks those in desk-notes.json
// (oneDayMove): the date lands one day early, not with day and month swapped. They are their own problem.
import { groupByCause, uniqueById, type Cause, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'one-day' | 'unplaced';

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  tenants: number;
  firstSeen: string;
  lastSeen: string;
};

function summarize(problem: Problem, rs: Report[]): ProblemGroup {
  const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
  return { problem, reports: rs, tenants: new Set(rs.map((r) => r.tenant)).size, firstSeen: days[0], lastSeen: days[days.length - 1] };
}

export function problemsIn(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): { merged: Report[]; groups: ProblemGroup[] } {
  const merged = uniqueById(all).filter((r) => r.mergedInto === ticket);
  const oneDay = merged.filter((r) => oneDayMove.includes(r.id));
  const rest = merged.filter((r) => !oneDayMove.includes(r.id));
  const groups = groupByCause(rest, tenantOf).map((g) => summarize(g.cause as Cause | 'unplaced', g.reports));
  if (oneDay.length) groups.push(summarize('one-day', oneDay));
  return { merged, groups: groups.sort((a, b) => b.reports.length - a.reports.length) };
}
