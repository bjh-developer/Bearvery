import React, { createContext, useContext, useState, useEffect } from 'react';

// Define available backgrounds
const backgrounds = [
  {
    url: 'https://images.pexels.com/photos/2775196/pexels-photo-2775196.jpeg',
    attribution: 'Pexels - Johannes Plenio',
    location: 'Mountains at Sunrise'
  },
  {
    url: 'https://images.pexels.com/photos/1671324/pexels-photo-1671324.jpeg',
    attribution: 'Pexels - Tyler Lastovich',
    location: 'Evening Forest'
  },
  {
    url: 'https://images.pexels.com/photos/1480807/pexels-photo-1480807.jpeg',
    attribution: 'Pexels - Nextvoyage',
    location: 'Beach Sunset'
  },
  {
    url: 'https://images.pexels.com/photos/1287075/pexels-photo-1287075.jpeg',
    attribution: 'Pexels - James Wheeler',
    location: 'Lake View'
  },
  {
    url: 'https://images.pexels.com/photos/2832039/pexels-photo-2832039.jpeg',
    attribution: 'Pexels - Anel Rossouw',
    location: 'Calm Waters'
  }
];

interface BackgroundContextType {
  background: typeof backgrounds[0];
  nextBackground: () => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export const useBackground = () => {
  const context = useContext(BackgroundContext);
  if (!context) {
    throw new Error('useBackground must be used within a BackgroundProvider');
  }
  return context;
};

interface BackgroundProviderProps {
  children: React.ReactNode;
}

const BackgroundProvider: React.FC<BackgroundProviderProps> = ({ children }) => {
  const [backgroundIndex, setBackgroundIndex] = useState(() => {
    // Get random background index initially
    return Math.floor(Math.random() * backgrounds.length);
  });

  const background = backgrounds[backgroundIndex];

  const nextBackground = () => {
    setBackgroundIndex((prev) => (prev + 1) % backgrounds.length);
  };

  // Preload the next background image
  useEffect(() => {
    const nextIndex = (backgroundIndex + 1) % backgrounds.length;
    const img = new Image();
    img.src = backgrounds[nextIndex].url;
  }, [backgroundIndex]);

  return (
    <BackgroundContext.Provider value={{ background, nextBackground }}>
      <div 
        className="min-h-screen bg-cover bg-center bg-no-repeat transition-opacity duration-1000 absolute inset-0"
        style={{ backgroundImage: `url(${background.url})` }}
      >
        <div className="absolute inset-0 bg-black/30" /> {/* Darken overlay for better text readability */}
      </div>
      <div className="relative z-10 min-h-screen">
        {children}
      </div>
      <div className="absolute bottom-2 left-2 text-xs text-white/70 z-10">
        {background.location} • {background.attribution}
      </div>
    </BackgroundContext.Provider>
  );
};

export default BackgroundProvider;