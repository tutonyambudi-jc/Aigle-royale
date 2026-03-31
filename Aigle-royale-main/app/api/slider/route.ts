import { NextResponse } from 'next/server';

// Simulated database for slider images
let sliderImages = [
  { id: 1, src: '/images/slide1.jpg', alt: 'Slide 1', caption: 'Voyagez avec confort' },
  { id: 2, src: '/images/slide2.jpg', alt: 'Slide 2', caption: 'Découvrez de nouveaux horizons' },
  { id: 3, src: '/images/slide3.jpg', alt: 'Slide 3', caption: 'Profitez de nos services premium' },
];

// GET: Retrieve all slider images
export async function GET() {
  return NextResponse.json(sliderImages);
}

// POST: Add a new slider image
export async function POST(req: Request) {
  const body = await req.json();
  const newImage = { id: Date.now(), ...body };
  sliderImages.push(newImage);
  return NextResponse.json(newImage);
}

// PUT: Update an existing slider image
export async function PUT(req: Request) {
  const body = await req.json();
  const index = sliderImages.findIndex((img) => img.id === body.id);
  if (index === -1) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  }
  sliderImages[index] = { ...sliderImages[index], ...body };
  return NextResponse.json(sliderImages[index]);
}

// DELETE: Remove a slider image
export async function DELETE(req: Request) {
  const { id } = await req.json();
  sliderImages = sliderImages.filter((img) => img.id !== id);
  return NextResponse.json({ success: true });
}