'use client';

import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ContributionChart } from '@/components/contribution-chart';
import { ArrowLeft, Car } from 'lucide-react';
import type { ScoredCarResult } from '@/types/preferences';

async function searchCars(prefs: any): Promise<{ items: ScoredCarResult[] }> {
  const res = await fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prefs),
  });
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const prefsParam = searchParams.get('prefs');
  const reasoningParam = searchParams.get('reasoning');
  const prefs = prefsParam ? JSON.parse(prefsParam) : null;

  const { data, isLoading, error } = useQuery({
    queryKey: ['search', prefs],
    queryFn: () => searchCars(prefs),
    enabled: !!prefs,
  });

  if (!prefs) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-background to-muted py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <p className="text-center text-muted-foreground">No search preferences provided</p>
          <div className="text-center mt-4">
            <Link href="/search">
              <Button>Start a Search</Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link href="/quiz" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retake Quiz
        </Link>

        <h1 className="text-3xl font-bold mb-2">Your Perfect Matches</h1>
        {reasoningParam && (
          <Card className="mb-6 bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground leading-relaxed">{reasoningParam}</p>
            </CardContent>
          </Card>
        )}


        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {error && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
              <CardDescription>{(error as Error).message}</CardDescription>
            </CardHeader>
          </Card>
        )}

        {data && data.items.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>No Results Found</CardTitle>
              <CardDescription>Try taking the quiz again with different answers</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/quiz">
                <Button>Retake Quiz</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {data && data.items.length > 0 && (
          <div className="space-y-4">
            {data.items.map((car, idx) => (
              <Card key={car.carId} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-muted-foreground">#{idx + 1}</span>
                        {car.make} {car.model} ({car.year})
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {car.vehicleType && <span className="mr-4">Type: {car.vehicleType}</span>}
                        {car.priceLower && car.priceUpper && (
                          <span>
                            Price: ${car.priceLower.toLocaleString()} - ${car.priceUpper.toLocaleString()}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-primary">{(car.overall * 100).toFixed(0)}%</div>
                      <div className="text-xs text-muted-foreground">Match Score</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold mb-2">Why This Match</h4>
                    <ContributionChart contributions={car.contributions} />
                    <p className="text-xs text-muted-foreground mt-2">
                      Based on your quiz answers, this car excels in areas that matter most to you.
                    </p>
                  </div>
                  <Link href={`/cars/${car.carId}`}>
                    <Button variant="outline" className="w-full">
                      <Car className="mr-2 h-4 w-4" />
                      View Full Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

