import { HeroSection } from "../components/Hero/HeroSection";
import { featureFlags } from "../config/featureFlags";
import { Testimonials } from "../components/Testimonials";
import { TalkToUsSection } from "../components/TalkToUs";
const Home = () => {
  return (
    <main>
      {featureFlags.heroSection && <HeroSection />}
      <TalkToUsSection />
      {featureFlags.footer && <Testimonials />}
    </main>
  );
};

export default Home;
