import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/Button/Button";
import { ErrorMessage } from "@/components/ErrorMessage/ErrorMessage";
import { AuthField } from "@/components/Input/AuthField";
import type { TripExpense } from "@/contracts/api";
import { createTripExpense, deleteTripExpense, updateTripExpense } from "@/services/expenseApi";
import { ExpenseCategory } from "@/types/enums";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatMoney } from "@/utils/money";

const categories = Object.values(ExpenseCategory);

const expenseFormSchema = z.object({
  category: z.enum(ExpenseCategory),
  description: z.string().trim().min(1, "Description is required.").max(500),
  amount: z.string().min(1, "Amount is required."),
  expenseDate: z.string().min(1, "Date is required."),
  isEstimated: z.boolean(),
  isActual: z.boolean(),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export function ExpensesPanel({
  tripId,
  expenses,
  onChanged,
}: {
  tripId: number;
  expenses: TripExpense[];
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TripExpense | null>(null);
  const [formError, setFormError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<TripExpense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      category: ExpenseCategory.FOOD,
      description: "",
      amount: "",
      expenseDate: new Date().toISOString().slice(0, 10),
      isEstimated: false,
      isActual: true,
    },
  });

  const total = expenses.reduce((sum, expense) => sum + (expense.is_actual === false ? 0 : expense.amount), 0);

  function openCreate() {
    setEditing(null);
    setFormError("");
    form.reset({
      category: ExpenseCategory.FOOD,
      description: "",
      amount: "",
      expenseDate: new Date().toISOString().slice(0, 10),
      isEstimated: false,
      isActual: true,
    });
    setOpen(true);
  }

  function openEdit(expense: TripExpense) {
    setEditing(expense);
    setFormError("");
    form.reset({
      category: expense.category,
      description: expense.description,
      amount: String(expense.amount),
      expenseDate: String(expense.expense_date).slice(0, 10),
      isEstimated: Boolean(expense.is_estimated),
      isActual: expense.is_actual !== false,
    });
    setOpen(true);
  }

  async function onSave(values: ExpenseFormValues) {
    const amount = Number(values.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      form.setError("amount", { message: "Enter a valid amount." });
      return;
    }

    setFormError("");
    const payload = {
      category: values.category,
      description: values.description,
      amount,
      currency: "INR",
      expenseDate: values.expenseDate,
      isEstimated: values.isEstimated,
      isActual: values.isActual,
    };

    try {
      if (editing) {
        await updateTripExpense(tripId, editing.id, payload);
      } else {
        await createTripExpense(tripId, payload);
      }
      setOpen(false);
      setEditing(null);
      onChanged();
    } catch (error) {
      setFormError(getApiErrorMessage(error) || "Unable to save this expense.");
    }
  }

  async function confirmDelete() {
    if (!pendingDelete || isDeleting) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteTripExpense(tripId, pendingDelete.id);
      setPendingDelete(null);
      onChanged();
    } catch (error) {
      setFormError(getApiErrorMessage(error) || "Unable to delete this expense.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)] ring-1 ring-line">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold text-ink">Expenses</h2>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand-dark"
        >
          + Add Expense
        </button>
      </div>

      {formError && !open ? (
        <div className="mt-4">
          <ErrorMessage message={formError} />
        </div>
      ) : null}

      {expenses.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No expenses recorded yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {expenses.map((expense) => (
            <li key={expense.id} className="flex items-start justify-between gap-3 py-3">
              <div>
                <p className="font-medium text-ink">{expense.description}</p>
                <p className="mt-0.5 text-xs capitalize text-muted">
                  {expense.category}
                  {expense.is_estimated ? " · estimated" : ""}
                  {expense.is_actual === false ? " · not actual" : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-ink">{formatMoney(expense.amount, expense.currency || "INR")}</p>
                <div className="mt-1 flex justify-end gap-2">
                  <button type="button" className="text-xs font-medium text-brand" onClick={() => openEdit(expense)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-xs font-medium text-red-600"
                    onClick={() => setPendingDelete(expense)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-sm">
        <span className="text-muted">Total</span>
        <span className="font-semibold text-ink">{formatMoney(total)}</span>
      </div>

      {open ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[var(--shadow-hover)]" role="dialog" aria-modal="true">
            <h3 className="font-display text-xl font-semibold text-ink">
              {editing ? "Edit expense" : "Add expense"}
            </h3>
            <form className="mt-4 space-y-3" onSubmit={form.handleSubmit(onSave)} noValidate>
              <div>
                <label className="mb-1 block text-xs text-muted" htmlFor="expense-category">
                  Category
                </label>
                <select
                  id="expense-category"
                  className="h-11 w-full rounded-xl border border-line px-3 text-sm"
                  {...form.register("category")}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <AuthField label="Description" error={form.formState.errors.description?.message} {...form.register("description")} />
              <AuthField
                label="Amount"
                type="number"
                min="0"
                step="0.01"
                error={form.formState.errors.amount?.message}
                {...form.register("amount")}
              />
              <AuthField
                label="Date"
                type="date"
                error={form.formState.errors.expenseDate?.message}
                {...form.register("expenseDate")}
              />
              <label className="flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" {...form.register("isEstimated")} />
                Estimated
              </label>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" {...form.register("isActual")} />
                Actual
              </label>
              {formError ? <ErrorMessage message={formError} /> : null}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="rounded-lg border border-line px-4 py-2 text-sm"
                  onClick={() => {
                    setOpen(false);
                    setEditing(null);
                  }}
                >
                  Cancel
                </button>
                <Button type="submit" isLoading={form.formState.isSubmitting} className="w-36">
                  Save Expense
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {pendingDelete ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[var(--shadow-hover)]" role="dialog" aria-modal="true">
            <h3 className="font-display text-xl font-semibold text-ink">Delete this expense?</h3>
            <p className="mt-2 text-sm text-muted">“{pendingDelete.description}” will be removed.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-lg border border-line px-4 py-2 text-sm"
                onClick={() => setPendingDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                onClick={() => {
                  void confirmDelete();
                }}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
