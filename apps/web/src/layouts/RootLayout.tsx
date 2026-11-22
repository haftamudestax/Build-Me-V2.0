import { Outlet } from "react-router-dom";
import { Navbar } from "../components/Navbar/Navbar";
import { WorkWithMeModal } from "../components/WorkWithMe/WorkWithMeModal";
import { GetQuickWinsModal } from "../components/GetQuickWins/GetQuickWinsModal";
import { Footer } from "../components/Footer";
import { featureFlags } from "../config/featureFlags";
import { GiveFeedbackButton } from "../components/Feedback/GiveFeedbackButton";

export default function RootLayout() {
  return (
    <>
      <Navbar />

      <main>
        <Outlet />
      </main>
      <WorkWithMeModal />
      <GetQuickWinsModal />

      {featureFlags.footer && <GiveFeedbackButton />}
      {!featureFlags.footer && <Footer />}
    </>
  );
}
