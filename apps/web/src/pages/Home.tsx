import { HeroSection } from "../components/Hero/HeroSection";
import { featureFlags } from "../config/featureFlags";
import { Footer } from "../components/Footer";
import { Testimonials } from "../components/Testimonials";
const Home = () => {
  return (
    <main>
      {featureFlags.heroSection && <HeroSection />}
      <Testimonials />
      <Footer />
    </main>
  );
};

export default Home;
