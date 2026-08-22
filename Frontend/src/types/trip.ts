export interface Trip {
  id: number;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: string | null;
  budget_limit: number | null;
  cover_image: string | null;
}
