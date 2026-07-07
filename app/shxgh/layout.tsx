export const metadata = {
  title: '陕西省总工会',
  description: '陕西省总工会官方网站 - 忠诚党的事业，竭诚服务职工',
};

export default function ShxghLayout({
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
