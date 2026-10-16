import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";

import { BrandLogo, HexBadge, trackNavigationEvent } from "@build-me/ui/navbar";

function HdyMarkContent() {
  return (
    <>
      <rect x="18" y="23" width="7" height="22" fill="white" />
      <rect x="33" y="23" width="7" height="22" fill="white" />
      <rect x="18" y="31" width="22" height="6" fill="white" />
      <path d="M31 22L24 35H28L25 48L36 32H31L31 22Z" fill="#F7B733" />
    </>
  );
}

function HdyMarkDecorations() {
  return (
    <>
      <path
        d="M27 14L24 17L27 20"
        stroke="#F7B733"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M31 14L34 17L31 20"
        stroke="#F7B733"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );
}

export function HDYLogo() {
  const location = useLocation();
  const lastTrackedRouteRef = useRef<string | null>(null);

  // Track when the logo is viewed on a new route.
  useEffect(() => {
    if (lastTrackedRouteRef.current === location.pathname) {
      return;
    }

    lastTrackedRouteRef.current = location.pathname;

    trackNavigationEvent({
      eventName: "navbar.logo_view",
      eventType: "view",
      sourceRoute: location.pathname,
      destinationRoute: "/",
    });
  }, [location.pathname]);

  // Track logo clicks while letting React Router handle navigation.
  function handleLogoClick() {
    trackNavigationEvent({
      eventName: "navbar.logo_click",
      eventType: "click",
      sourceRoute: location.pathname,
      destinationRoute: "/",
    });
  }

  return (
    <BrandLogo
      className="flex items-center gap-2 rounded-md px-2 py-1 text-blue-50 transition-colors duration-200 hover:bg-blue-500! hover:text-white focus:bg-blue-500!/10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-blue-900 active:bg-blue-500!/20 active:text-blue-100"
      as={Link}
      href="/"
      ariaLabel="Home"
      onLogoClick={handleLogoClick}
      mark={
        <HexBadge
          size={58}
          outerColor="white"
          midColor="#F7B733"
          innerColor="#0B1740"
          decorations={<HdyMarkDecorations />}
        >
          <HdyMarkContent />
        </HexBadge>
      }
      wordmark={
        <span className="text-base font-semibold tracking-tight text-blue-50 sm:text-lg">
          Haftamu Desta
        </span>
      }
    />
  );
}
