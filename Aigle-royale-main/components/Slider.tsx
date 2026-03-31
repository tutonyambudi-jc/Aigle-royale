"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

type Slide = {
  id: number;
  src: string;
  alt: string;
  caption: string;
};

const Slider = () => {
  const [slides, setSlides] = useState<Slide[]>([]);

  useEffect(() => {
    async function fetchSlides() {
      const response = await fetch('/api/slider');
      const data = await response.json();
      setSlides(data);
    }
    fetchSlides();
  }, []);

  return (
    <div className="relative w-full h-[400px] overflow-hidden rounded-b-[2rem] shadow-lg">
      <div className="absolute inset-0 flex transition-transform duration-500 ease-in-out">
        {slides.map((slide) => (
          <div key={slide.id} className="flex-shrink-0 w-full h-full relative">
            <Image
              src={slide.src}
              alt={slide.alt}
              layout="fill"
              objectFit="cover"
              className="rounded-b-[2rem]"
            />
            <div className="absolute bottom-4 left-4 bg-black/50 text-white px-4 py-2 rounded">
              {slide.caption}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Slider;