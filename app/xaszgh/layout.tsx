export const metadata = {
  title: '西安市总工会',
  description: '西安市总工会官方网站',
};

export default function XaszghLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}
