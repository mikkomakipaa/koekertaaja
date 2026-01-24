import type { MetadataRoute } from 'next';

const baseUrl = 'https://www.koekertaaja.fi';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: baseUrl,
    },
    {
      url: `${baseUrl}/play`,
    },
    {
      url: `${baseUrl}/create`,
    },
  ];
}
