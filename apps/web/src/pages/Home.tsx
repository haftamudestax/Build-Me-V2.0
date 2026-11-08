import { HeroSection } from "../components/Hero/HeroSection";
import { featureFlags } from "../config/featureFlags";
const Home = () => {
  return <main>{featureFlags.heroSection && <HeroSection />}</main>;
};

export default Home;
