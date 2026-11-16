import { HeroSection } from "../components/Hero/HeroSection";
import { featureFlags } from "../config/featureFlags";
import { Testimonials } from "../components/Testimonials";
const Home = () => {
  return (
    <main>
      {featureFlags.heroSection && <HeroSection />}
      <Testimonials />
    </main>
  );
};

export default Home;
