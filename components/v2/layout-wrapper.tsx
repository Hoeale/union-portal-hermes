import Header from '@/components/v2/header';
import NavBar from '@/components/v2/nav-bar';
import Footer from '@/components/footer';
import FeedbackButton from '@/components/feedback-button';
import { LayoutConfigProvider } from '@/components/v2/layout-config-context';

export default function V2LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LayoutConfigProvider>
      <div className="wrapper min-h-screen">
        <Header />
        <NavBar />
        <main className="px-10 py-8 text-base">{children}</main>
        <Footer compact />
        <FeedbackButton />
      </div>
    </LayoutConfigProvider>
  );
}
