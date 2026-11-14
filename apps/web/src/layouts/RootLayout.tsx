import { Outlet } from "react-router-dom";
import { Navbar } from "../components/Navbar/Navbar";
import { WorkWithMeModal } from "../components/WorkWithMe/WorkWithMeModal";
import { GetQuickWinsModal } from "../components/GetQuickWins/GetQuickWinsModal";

export default function RootLayout() {
  return (
    <>
      <Navbar />

      <main>
        <Outlet />
      </main>

      <WorkWithMeModal />
      <GetQuickWinsModal />
    </>
  );
}
