import Navigation from '@/components/navigation';
import Footer from '@/components/footer';
import FeedbackButton from '@/components/feedback-button';
import PageViewTracker from '@/components/page-view-tracker';
import { LayoutConfigProvider } from '@/components/v2/layout-config-context';
// import ChatWidget from '@/components/chat-widget'; // AI客服功能暂时隐藏

export default function FrontendWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LayoutConfigProvider>
      <PageViewTracker />
      <Navigation />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <FeedbackButton />
      {/* <ChatWidget /> */}
    </LayoutConfigProvider>
  );
}
