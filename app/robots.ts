import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: 'Baiduspider',
        allow: ['/news/', '/policies/'],
        disallow: ['/admin/', '/api/', '/_next/', '/view/'],
      },
      {
        userAgent: 'Googlebot',
        allow: ['/news/', '/policies/'],
        disallow: ['/admin/', '/api/', '/_next/', '/view/'],
      },
      {
        userAgent: '*',
        allow: ['/news/', '/policies/'],
        disallow: ['/admin/', '/api/', '/_next/', '/view/'],
      },
    ],
    sitemap: 'https://www.xaszgh.cn/sitemap.xml',
  }
}
