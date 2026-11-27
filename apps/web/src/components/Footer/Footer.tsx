import { SocialConnections } from "./SocialConnections";
import { ShareButton } from "./Share";
import { ReferralButton } from "./Referrals";
import { AboutLink } from "./About";
import { Copyright } from "./Copyright";
import { LegalLinks } from "./Legal";
import { featureFlags } from "../../config/featureFlags";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-linear-to-b from-white via-light-yellow/20 to-light-yellow/45">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
        <div className="flex flex-col items-stretch gap-5 lg:flex-row lg:gap-0">
          <div className="min-w-0">
            {!featureFlags.footer && <SocialConnections />}
          </div>

          <div className="flex items-center lg:border-r lg:pr-8">
            {!featureFlags.footer && <ShareButton />}
          </div>

          <div className="flex min-w-0 items-center lg:border-r lg:pr-8">
            {!featureFlags.footer && <ReferralButton />}
          </div>

          <div className="flex min-w-0 items-center lg:border-r lg:pr-8">
            {!featureFlags.footer && <AboutLink />}
          </div>

          <div className="flex min-w-0 flex-1 items-center">
            {!featureFlags.footer && <Copyright />}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
        {!featureFlags.footer && <LegalLinks />}
      </div>
    </footer>
  );
}
