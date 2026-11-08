import { SocialConnections } from "./SocialConnections";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
        {/* Footer Components */}
        <div className="flex items-stretch">
          <SocialConnections />
        </div>
      </div>
    </footer>
  );
}
