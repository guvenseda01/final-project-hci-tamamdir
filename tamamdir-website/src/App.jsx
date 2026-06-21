import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Features from './components/Features'
import HowItWorks from './components/HowItWorks'
import Categories from './components/Categories'
import AppPlatforms from './components/AppPlatforms'
import FAQ from './components/FAQ'
import About from './components/About'
import CTABanner, { Footer } from './components/CTABanner'

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Categories />
        <AppPlatforms />
        <FAQ />
        <About />
        <CTABanner />
      </main>
      <Footer />
    </>
  )
}
