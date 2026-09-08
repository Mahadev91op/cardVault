export default async function sitemap() {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://cardvault.com').replace(/\/+$/, '');

  return [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/marketplace`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
  ];
}
