<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import type { Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { problemsIn, type Problem } from '#lib/kb/problems';

  // issues: problem → { n: issue number, href: link, state: what happened to it }
  let { ticket, issues = {} }: { ticket: number; issues?: Partial<Record<Problem, { n: number; href: string; state?: string }>> } = $props();

  const WHAT: Record<Problem, string> = {
    parser: 'Day-first tenant, any way in except a booking-v3 form: the shared parser reads the date month first. Day and month swap.',
    hint: 'booking-v3 form at a day-first tenant: the hint under the date field says MM/DD/YYYY, people type month first, the form reads day first. Day and month swap.',
    'one-day': 'The date lands one day early (Tuesday shows as Monday), or differs between readers in different time zones. Not a swap.',
    unplaced: 'No tenant on file, or the tenant writes the month first: no known cause.',
  };

  const result = $derived(problemsIn(reports as Report[], ticket, tenantOf, notes.oneDayMove));
</script>

<p class="sum">
  <strong>{result.merged.length}</strong> reports in #{ticket}, each counted where the desk files it ·
  <strong>{result.groups.length}</strong> {result.groups.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead><tr><th>problem</th><th>reports</th><th>tenants</th><th>seen</th><th>ticket</th></tr></thead>
  <tbody>
    {#each result.groups as g (g.problem)}
      <tr>
        <td><code>{g.problem}</code><br /><span class="what">{WHAT[g.problem]}</span></td>
        <td>{g.reports.length}{#if g.filedUnder.length}<br /><span class="what">also counted under {g.filedUnder.join(', ')}</span>{/if}</td>
        <td>{g.tenants}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td>
          {#if issues[g.problem]}<a href={issues[g.problem]?.href}>#{issues[g.problem]?.n}</a>{#if issues[g.problem]?.state}<br /><span class="what">{issues[g.problem]?.state}</span>{/if}{:else}<span class="none">none yet</span>{/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .sum { font-size: 1.1rem; }
  .what { color: var(--muted); font-size: 0.85em; }
  .none { color: var(--warn); font-weight: 600; }
  td { vertical-align: top; }
</style>
