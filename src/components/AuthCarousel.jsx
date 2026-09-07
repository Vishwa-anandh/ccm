import React, { useState, useEffect } from 'react';

const CAROUSEL_DATA = [
  {
    image: '/auth_dashboard.png',
    title: 'Complete Visibility',
    description: 'Gain unparalleled insights into your AWS and Azure spending with real-time cost.'
  },
  {
    image: '/auth_ai.png',
    title: 'Smart Optimization',
    description: 'Our intelligent algorithms identify unused resources and right-sizing opportunities instantly.'
  },
  {
    image: '/auth_security.png',
    title: 'Enterprise Security',
    description: 'Your financial data never leaves your environment. Secured with modern encryption.'
  }
];

export default function AuthCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_DATA.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-900 flex items-center justify-center">
      {CAROUSEL_DATA.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
        >
          {/* Image */}
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover opacity-90"
          />
          {/* Subtle gradient overlay to ensure text readability */}
          <div className="absolute inset-0 bg-transparent" />

          {/* Glassmorphism text card (inspired by reference) */}
          <div className="absolute bottom-16 left-12 right-12">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-700">
              <div className="w-8 h-8 rounded-full border-2 border-white/40 border-t-white animate-spin mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2 leading-tight">
                {slide.title}
              </h3>
              <p className="text-sm text-slate-300">
                {slide.description}
              </p>
            </div>
          </div>
        </div>
      ))}

      {/* Progress Dots */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-20">
        {CAROUSEL_DATA.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentSlide ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/60'
              }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
