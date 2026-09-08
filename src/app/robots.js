export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://cardvault.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/profile/'],
      },
    ],
    sitemap: `${baseUrl.replace(/\/+$/, '')}/sitemap.xml`,
  };
}
