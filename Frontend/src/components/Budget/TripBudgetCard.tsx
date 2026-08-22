import type { TripBudget } from "@/contracts/api";
import { formatMoney } from "@/utils/money";

export function TripBudgetCard({ budget, compact = false }: { budget: TripBudget; compact?: boolean }) {
  const currency = budget.currency || "INR";
  const allocated = budget.allocatedBudget ?? 0;
  const actual = budget.actual.total ?? 0;
  const remaining = budget.remaining.actual ?? allocated - actual;
  const usedRatio = allocated > 0 ? Math.min(actual / allocated, 1) : 0;

  if (compact) {
    return (
      <div className="rounded-2xl bg-white p-5 ring-1 ring-line">
        <p className="text-[11px] font-medium tracking-[0.14em] text-muted uppercase">Budget</p>
        <p className="mt-2 font-display text-2xl font-semibold text-ink">
          {formatMoney(actual, currency)}
          <span className="text-base font-normal text-muted"> / {formatMoney(allocated, currency)}</span>
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-brand" style={{ width: `${usedRatio * 100}%` }} />
        </div>
        <p className="mt-2 text-sm text-muted">{formatMoney(remaining, currency)} remaining</p>
      </div>
    );
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)] ring-1 ring-line">
      <h2 className="font-display text-2xl font-semibold text-ink">Trip Budget</h2>
      <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <BudgetStat label="Estimated" value={formatMoney(budget.estimated.total, currency)} />
        <BudgetStat label="Actual" value={formatMoney(budget.actual.total, currency)} />
        <BudgetStat label="Remaining" value={formatMoney(remaining, currency)} />
      </dl>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-brand" style={{ width: `${usedRatio * 100}%` }} />
      </div>
      <dl className="mt-5 space-y-2 text-sm">
        <BudgetRow label="Transport" value={formatMoney(budget.actual.transport, currency)} />
        <BudgetRow label="Accommodation" value={formatMoney(budget.actual.accommodation, currency)} />
        <BudgetRow label="Activities" value={formatMoney(budget.actual.activities, currency)} />
        <BudgetRow label="Other expenses" value={formatMoney(budget.actual.otherExpenses, currency)} />
      </dl>
    </section>
  );
}

function BudgetStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <dt className="text-[11px] font-medium tracking-[0.14em] text-muted uppercase">{label}</dt>
      <dd className="mt-1 font-display text-xl font-semibold text-ink">{value}</dd>
    </div>
  );
}

function BudgetRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}
