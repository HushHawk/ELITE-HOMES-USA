import { Header, Reveal } from '@/components/chrome';
import { Footer } from '@/components/editorial';
import { LiveAssistantChat } from '@/components/live-assistant-chat';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>
    <a className="skip" href="#main">Skip to content</a>
    <Header/>
    <main id="main">{children}</main>
    <Footer preview={process.env.ELITE_MODE !== 'live'}/>
    <LiveAssistantChat />
    <Reveal/>
  </>;
}
