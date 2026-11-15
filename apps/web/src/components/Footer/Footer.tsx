import { SocialConnections } from "./SocialConnections";
import { ShareButton } from "./Share";
import { ReferralButton } from "./Referrals";
import { AboutLink } from "./About";
import { Copyright } from "./Copyright";
import { LegalLinks } from "./Legal";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
        {/* Footer Components */}
        <div className="flex items-stretch">
          <SocialConnections />
          <div className="flex items-stretch border-r border-gray-200 pr-8">
            <div className="flex items-center">
              <ShareButton />
            </div>
          </div>
          <div className="flex items-stretch"></div>
          <div className="flex items-center">
            <ReferralButton />
          </div>
          <div className="flex items-center">
            <AboutLink />
          </div>
          <div className="flex items-center">
            <Copyright />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
        <LegalLinks />
      </div>
    </footer>
  );
}
