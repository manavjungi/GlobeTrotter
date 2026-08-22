import {
  createExpenseRequestSchema,
  expenseListResponseSchema,
  expenseResponseSchema,
  tripBudgetResponseSchema,
  type CreateExpenseRequest,
  type TripBudget,
  type TripExpense,
  type UpdateExpenseRequest,
} from "@/contracts/api";
import api from "@/services/api";

export async function getTripBudget(tripId: number): Promise<TripBudget> {
  const { data } = await api.get(`/trips/${tripId}/budget`);
  return tripBudgetResponseSchema.parse(data).data.budget;
}

export async function getTripExpenses(tripId: number): Promise<TripExpense[]> {
  const { data } = await api.get(`/trips/${tripId}/expenses`);
  return expenseListResponseSchema.parse(data).data.expenses;
}

export async function createTripExpense(
  tripId: number,
  payload: CreateExpenseRequest,
): Promise<TripExpense> {
  const body = createExpenseRequestSchema.parse(payload);
  const { data } = await api.post(`/trips/${tripId}/expenses`, body);
  return expenseResponseSchema.parse(data).data.expense;
}

export async function updateTripExpense(
  tripId: number,
  expenseId: number,
  payload: UpdateExpenseRequest,
): Promise<TripExpense> {
  const { data } = await api.put(`/trips/${tripId}/expenses/${expenseId}`, payload);
  return expenseResponseSchema.parse(data).data.expense;
}

export async function deleteTripExpense(tripId: number, expenseId: number): Promise<void> {
  await api.delete(`/trips/${tripId}/expenses/${expenseId}`);
}
