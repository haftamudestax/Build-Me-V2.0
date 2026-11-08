import { HeroSection } from "../components/Hero/HeroSection";
import { featureFlags } from "../config/featureFlags";
import { Footer } from "../components/Footer";
const Home = () => {
  return (
    <main>
      {featureFlags.heroSection && <HeroSection />}
      <Footer />
    </main>
  );
};

export default Home;
