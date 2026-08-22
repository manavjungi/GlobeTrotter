import ahmedabad from "@/assets/regions/ahmedabad.png";
import bhuj from "@/assets/regions/bhuj.png";
import gandhinagar from "@/assets/regions/gandhinagar.png";
import surat from "@/assets/regions/surat.png";
import vadodara from "@/assets/regions/vadodara.png";

const namedPhotos: Record<string, string> = {
  ahmedabad,
  surat,
  vadodara,
  gandhinagar,
  bhuj,
};

const photoPool = [ahmedabad, surat, vadodara, gandhinagar, bhuj];

function normalizeKey(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, "-");
}

function hashPick(seed: string): string {
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return photoPool[hash % photoPool.length];
}

export function resolveCityPhoto(
  name: string,
  slug?: string | null,
  remoteUrl?: string | null,
): string {
  if (remoteUrl && /^https?:\/\//i.test(remoteUrl)) {
    return remoteUrl;
  }
  const keys = [slug, name].filter(Boolean).map((value) => normalizeKey(String(value)));
  for (const key of keys) {
    if (namedPhotos[key]) {
      return namedPhotos[key];
    }
  }
  const haystack = keys.join(" ");
  for (const [key, photo] of Object.entries(namedPhotos)) {
    if (haystack.includes(key)) {
      return photo;
    }
  }
  return hashPick(keys[0] || name);
}

export function cityCoverStyle(
  name: string,
  slug?: string | null,
  remoteUrl?: string | null,
): { backgroundImage: string; backgroundSize: string; backgroundPosition: string } {
  return {
    backgroundImage: `url(${resolveCityPhoto(name, slug, remoteUrl)})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}
