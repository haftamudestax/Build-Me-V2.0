import { SocialConnections } from "./SocialConnections";
import { ShareButton } from "./Share";
import { ReferralButton } from "./Referrals";

export function Footer() {
  return (
    <footer className="w-full min-w-0 border-t border-gray-200 bg-white">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-5 py-10 sm:px-8 lg:px-10">
        <div
          className="
            flex w-full min-w-0 flex-col items-stretch gap-6
            md:flex-row md:items-center md:justify-between md:gap-8
          "
        >
          {/* Social connections */}
          <div className="flex w-full min-w-0 flex-wrap items-center gap-4 md:w-auto">
            <SocialConnections />
          </div>

          <div
            className="
                flex min-w-0 items-center
                border-b border-gray-200 pb-4
                sm:border-b-0 sm:border-r sm:pb-0 sm:pr-6
              "
          >
            <ShareButton />
          </div>
          <div className="flex min-w-0 items-center">
            <ReferralButton />
          </div>
        </div>
      </div>
    </footer>
  );
}
