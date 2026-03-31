"use client";
import { useEffect, useState } from 'react';

export default function SliderAdminPage() {
  const [slides, setSlides] = useState([]);
  const [newSlide, setNewSlide] = useState({ src: '', alt: '', caption: '' });

  useEffect(() => {
    async function fetchSlides() {
      const response = await fetch('/api/slider');
      const data = await response.json();
      setSlides(data);
    }
    fetchSlides();
  }, []);

  async function handleAddSlide() {
    const response = await fetch('/api/slider', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSlide),
    });
    const addedSlide = await response.json();
    setSlides((prev) => [...prev, addedSlide]);
    setNewSlide({ src: '', alt: '', caption: '' });
  }

  async function handleDeleteSlide(id) {
    await fetch('/api/slider', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setSlides((prev) => prev.filter((slide) => slide.id !== id));
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Gestion des Slides</h1>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Image URL"
          value={newSlide.src}
          onChange={(e) => setNewSlide({ ...newSlide, src: e.target.value })}
          className="border p-2 mr-2"
        />
        <input
          type="text"
          placeholder="Alt Text"
          value={newSlide.alt}
          onChange={(e) => setNewSlide({ ...newSlide, alt: e.target.value })}
          className="border p-2 mr-2"
        />
        <input
          type="text"
          placeholder="Caption"
          value={newSlide.caption}
          onChange={(e) => setNewSlide({ ...newSlide, caption: e.target.value })}
          className="border p-2 mr-2"
        />
        <button onClick={handleAddSlide} className="bg-blue-500 text-white px-4 py-2 rounded">
          Ajouter
        </button>
      </div>

      <ul>
        {slides.map((slide) => (
          <li key={slide.id} className="mb-4 flex items-center">
            <img src={slide.src} alt={slide.alt} className="w-20 h-20 object-cover mr-4" />
            <div className="flex-1">
              <p className="font-bold">{slide.caption}</p>
              <p className="text-sm text-gray-500">{slide.alt}</p>
            </div>
            <button
              onClick={() => handleDeleteSlide(slide.id)}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Supprimer
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}