export interface City {
  id: number;
  name: string;
  country: string;
  region: string | null;
  description: string | null;
  cost_index: number | null;
  popularity_score: number | null;
  image_url: string | null;
}
