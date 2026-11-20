import { HeroSection } from "./components/Hero/HeroSection";
import { Navbar } from "./components/Navbar/Navbar";
import { featureFlags } from "./config/featureFlags";
import { Testimonials } from "./components/Testimonials";

function App() {
  return (
    <main className="p-8">
      <Navbar />
      {featureFlags.heroSection && <HeroSection />}
      {featureFlags.heroSection && <Testimonials />}
    </main>
  );
}

export default App;
