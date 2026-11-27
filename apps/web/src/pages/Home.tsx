import { HeroSection } from "../components/Hero/HeroSection";
import { featureFlags } from "../config/featureFlags";
import { Testimonials } from "../components/Testimonials";
import { TalkToUsSection } from "../components/TalkToUs";
const Home = () => {
  return (
    <main>
      {featureFlags.heroSection && <HeroSection />}
      {!featureFlags.footer && <Testimonials />}
      {featureFlags.footer && <TalkToUsSection />}
    </main>
  );
};

export default Home;
