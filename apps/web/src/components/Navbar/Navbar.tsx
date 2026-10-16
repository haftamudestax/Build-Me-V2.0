import { NavLink, useLocation } from "react-router-dom";

import {
  Navbar as SharedNavbar,
  NavLinkItem,
  MobileMenu,
} from "@build-me/ui/navbar";

import type { NavItem } from "@build-me/ui/navbar";
import { trackNavigationEvent } from "@build-me/ui/navbar";
import { HDYLogo } from "./HDYLog";

const NAV_LINKS: NavItem[] = [];

export function Navbar() {
  const location = useLocation();

  function handleNavigationClick(destinationRoute: string) {
    trackNavigationEvent({
      eventName: "navbar.nav_link_click",
      eventType: "click",
      sourceRoute: location.pathname,
      destinationRoute,
    });
  }

  // NAV_LINKS will be implemented soon
  return (
    <SharedNavbar logo={<HDYLogo />}>
      {NAV_LINKS.length > 0 && (
        <>
          <div className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <NavLinkItem
                key={link.to}
                as={NavLink}
                to={link.to}
                end={link.end}
                onClick={() => handleNavigationClick(link.to)}
              >
                {link.label}
              </NavLinkItem>
            ))}
          </div>

          <MobileMenu>
            {NAV_LINKS.map((link) => (
              <NavLinkItem
                key={link.to}
                as={NavLink}
                to={link.to}
                end={link.end}
                onClick={() => handleNavigationClick(link.to)}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-base font-medium ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-blue-200 hover:text-white"
                  }`
                }
              >
                {link.label}
              </NavLinkItem>
            ))}
          </MobileMenu>
        </>
      )}
    </SharedNavbar>
  );
}
