// What #4471 holds, problem by problem. causes.ts sorts reports by tenant and channel: that is the
// desk's view, and each report is counted where it is filed. Some reports describe a different bug:
// the desk marks them in desk-notes.json (oneDayMove), the date lands one day early, not with day and
// month swapped. They get their own row and ticket, and stay counted where the desk files them.
import { groupByCause, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'one-day' | 'unplaced';

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  tenants: number;
  firstSeen: string;
  lastSeen: string;
  // For one-day: the problem the desk files these reports under.
  filedUnder: Problem[];
};

function summarize(problem: Problem, rs: Report[], filedUnder: Problem[] = []): ProblemGroup {
  const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
  return { problem, reports: rs, tenants: new Set(rs.map((r) => r.tenant)).size, firstSeen: days[0], lastSeen: days[days.length - 1], filedUnder };
}

export function problemsIn(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): { merged: Report[]; groups: ProblemGroup[] } {
  const merged = uniqueById(all).filter((r) => r.mergedInto === ticket);
  const filed = groupByCause(merged, tenantOf);
  const groups = filed.map((g) => summarize(g.cause, g.reports));
  const oneDay = merged.filter((r) => oneDayMove.includes(r.id));
  if (oneDay.length) {
    const under = filed.filter((g) => g.reports.some((r) => oneDayMove.includes(r.id))).map((g) => g.cause as Problem);
    groups.push(summarize('one-day', oneDay, under));
  }
  return { merged, groups };
}
