import { SocialConnections } from "./SocialConnections";
import { ShareButton } from "./Share";

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
          {/* Future footer components go here */}
        </div>
      </div>
    </footer>
  );
}
