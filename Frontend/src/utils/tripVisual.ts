const covers = [
  "linear-gradient(145deg, #0f3b5f 0%, #0284c7 58%, #7dd3fc 100%)",
  "linear-gradient(145deg, #134e4a 0%, #0d9488 55%, #99f6e4 100%)",
  "linear-gradient(145deg, #1e3a5f 0%, #2563eb 60%, #93c5fd 100%)",
  "linear-gradient(160deg, #3f2e1f 0%, #b45309 50%, #fcd34d 100%)",
  "linear-gradient(145deg, #312e81 0%, #6366f1 55%, #c4b5fd 100%)",
];

export function tripCoverStyle(seed: string): { backgroundImage: string } {
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return { backgroundImage: covers[hash % covers.length] };
}
