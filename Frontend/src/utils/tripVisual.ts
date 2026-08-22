import { cityCoverStyle, resolveCityPhoto } from "@/utils/cityPhoto";

export function tripCoverPhoto(seed: string, slug?: string | null, remoteUrl?: string | null): string {
  return resolveCityPhoto(seed, slug, remoteUrl);
}

export function tripCoverStyle(
  seed: string,
  slug?: string | null,
  remoteUrl?: string | null,
): { backgroundImage: string; backgroundSize: string; backgroundPosition: string } {
  return cityCoverStyle(seed, slug, remoteUrl);
}
