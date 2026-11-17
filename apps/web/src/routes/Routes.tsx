import { createBrowserRouter } from "react-router-dom";
import Home from "../pages/Home";
import RootLayout from "../layouts/RootLayout";
import TermsPage from "../pages/Legal/TermsPage";
import PrivacyPage from "../pages/Legal/PrivacyPage";
import CookiePolicyPage from "../pages/Legal/CookiePolicyPage";
import About from "../pages/About";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "terms",
        element: <TermsPage />,
      },
      {
        path: "privacy",
        element: <PrivacyPage />,
      },
      {
        path: "cookie-policy",
        element: <CookiePolicyPage />,
      },
      {
        path: "about",
        element: <About />,
      },
    ],
  },
]);
