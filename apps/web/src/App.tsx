import { HeroSection } from "./components/Hero/HeroSection";
import { featureFlags } from "./config/featureFlags";

function App() {
  return (
    <main className="p-8">{featureFlags.heroSection && <HeroSection />}</main>
  );
}

export default App;
