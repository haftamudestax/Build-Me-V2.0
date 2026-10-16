import { HeroSection } from "./components/Hero/HeroSection";
import { Navbar } from "./components/Navbar/Navbar";
import { featureFlags } from "./config/featureFlags";

function App() {
  return (
    <main className="p-8">
      <Navbar />
      {featureFlags.heroSection && <HeroSection />}
    </main>
  );
}

export default App;
