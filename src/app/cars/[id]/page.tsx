'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Info } from 'lucide-react';
import type { Car } from '@prisma/client';

async function fetchCar(id: string): Promise<Car> {
  const res = await fetch(`/api/cars/${id}`);
  if (!res.ok) throw new Error('Car not found');
  return res.json();
}

export default function CarDetailPage({ params }: { params: { id: string } }) {
  const { data: car, isLoading, error } = useQuery({
    queryKey: ['car', params.id],
    queryFn: () => fetchCar(params.id),
  });

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-background to-muted py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-6" />
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (error || !car) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-background to-muted py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
              <CardDescription>{error ? (error as Error).message : 'Car not found'}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/search">
                <Button>Back to Search</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const features = car.features as Record<string, any>;

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link href="/results" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Results
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">
              {car.make} {car.model} ({car.year})
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              {car.vehicleType && <span className="mr-4">Type: {car.vehicleType}</span>}
              {car.transmission && <span>Transmission: {car.transmission}</span>}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Price */}
            {(car.priceLower || car.priceUpper) && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Price Range</h3>
                <p className="text-2xl font-bold text-primary">
                  {car.priceLower && car.priceUpper
                    ? `$${car.priceLower.toLocaleString()} - $${car.priceUpper.toLocaleString()}`
                    : car.priceLower
                      ? `$${car.priceLower.toLocaleString()}+`
                      : `Up to $${car.priceUpper?.toLocaleString()}`}
                </p>
              </div>
            )}

            {/* Fuel Types */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Fuel Options</h3>
              <div className="flex gap-2 flex-wrap">
                {car.gas && <span className="px-3 py-1 bg-secondary rounded-full text-sm">Gas</span>}
                {car.hybrid && <span className="px-3 py-1 bg-secondary rounded-full text-sm">Hybrid</span>}
                {car.phev && <span className="px-3 py-1 bg-secondary rounded-full text-sm">PHEV</span>}
                {car.ev && <span className="px-3 py-1 bg-secondary rounded-full text-sm">Electric</span>}
              </div>
            </div>

            {/* Score */}
            {car.score !== null && car.score !== undefined && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Overall Score</h3>
                <div className="flex items-center gap-2">
                  <div className="text-4xl font-bold text-primary">{car.score}</div>
                  <Info className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            )}

            {/* Additional Features */}
            {features && Object.keys(features).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Additional Features</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(features).map(([key, value]) => {
                    if (value === null || value === false) return null;
                    return (
                      <div key={key} className="text-sm">
                        <span className="font-medium">{key}:</span>{' '}
                        <span className="text-muted-foreground">{String(value)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Last updated: {new Date(car.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

