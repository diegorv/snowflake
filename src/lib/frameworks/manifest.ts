import { z } from 'zod';

export interface FrameworkManifestEntry {
  id: string;
  label: string;
  path: string;
}

const ManifestSchema = z.array(
  z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    path: z.string().min(1)
  })
);

export async function loadManifest(
  fetchImpl: typeof fetch = fetch,
  url = '/frameworks/index.json'
): Promise<FrameworkManifestEntry[]> {
  const res = await fetchImpl(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch framework manifest: ${res.status}`);
  }
  const json = await res.json();
  return ManifestSchema.parse(json);
}
