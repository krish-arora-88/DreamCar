'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { searchFormSchema, type SearchFormData } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function SearchPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SearchFormData>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      weightPriceFit: 2,
      weightFuel: 1,
      weightVehicleType: 1,
    },
  });

  const onSubmit = async (data: SearchFormData) => {
    const prefs = {
      hardFilters: {
        price: {
          min: data.priceMin,
          max: data.priceMax,
        },
        vehicleType: data.vehicleTypes,
        fuelType: data.fuelTypes,
        brands: data.brands,
        year: {
          min: data.yearMin,
          max: data.yearMax,
        },
      },
      weights: {
        priceFit: data.weightPriceFit,
        fuel: data.weightFuel,
        vehicleType: data.weightVehicleType,
      },
      topN: 20,
    };

    const params = new URLSearchParams({ prefs: JSON.stringify(prefs) });
    router.push(`/results?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Find Your Perfect Car</CardTitle>
            <CardDescription>Set your preferences and weights to get personalized recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Price Range */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Price Range</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priceMin">Min Price ($)</Label>
                    <Input id="priceMin" type="number" placeholder="0" {...register('priceMin')} />
                    {errors.priceMin && <p className="text-sm text-destructive mt-1">{errors.priceMin.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="priceMax">Max Price ($)</Label>
                    <Input id="priceMax" type="number" placeholder="50000" {...register('priceMax')} />
                    {errors.priceMax && <p className="text-sm text-destructive mt-1">{errors.priceMax.message}</p>}
                  </div>
                </div>
              </div>

              {/* Year Range */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Model Year</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="yearMin">Min Year</Label>
                    <Input id="yearMin" type="number" placeholder="2018" {...register('yearMin')} />
                    {errors.yearMin && <p className="text-sm text-destructive mt-1">{errors.yearMin.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="yearMax">Max Year</Label>
                    <Input id="yearMax" type="number" placeholder="2025" {...register('yearMax')} />
                    {errors.yearMax && <p className="text-sm text-destructive mt-1">{errors.yearMax.message}</p>}
                  </div>
                </div>
              </div>

              {/* Vehicle Types */}
              <div className="space-y-2">
                <Label htmlFor="vehicleTypes">Vehicle Types (comma-separated)</Label>
                <Input id="vehicleTypes" placeholder="SUV, Sedan, Truck" {...register('vehicleTypes')} />
                <p className="text-xs text-muted-foreground">Leave empty for all types</p>
              </div>

              {/* Fuel Types */}
              <div className="space-y-2">
                <Label htmlFor="fuelTypes">Fuel Types (comma-separated)</Label>
                <Input id="fuelTypes" placeholder="hybrid, ev" {...register('fuelTypes')} />
                <p className="text-xs text-muted-foreground">Options: gas, hybrid, phev, ev</p>
              </div>

              {/* Brands */}
              <div className="space-y-2">
                <Label htmlFor="brands">Brands (comma-separated)</Label>
                <Input id="brands" placeholder="Toyota, Tesla, Honda" {...register('brands')} />
                <p className="text-xs text-muted-foreground">Leave empty for all brands</p>
              </div>

              {/* Weights */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Importance Weights (0-10)</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="weightPriceFit">Price Fit</Label>
                    <Input id="weightPriceFit" type="number" step="0.1" {...register('weightPriceFit')} />
                    {errors.weightPriceFit && (
                      <p className="text-sm text-destructive mt-1">{errors.weightPriceFit.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="weightFuel">Fuel Type</Label>
                    <Input id="weightFuel" type="number" step="0.1" {...register('weightFuel')} />
                    {errors.weightFuel && <p className="text-sm text-destructive mt-1">{errors.weightFuel.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="weightVehicleType">Vehicle Type</Label>
                    <Input id="weightVehicleType" type="number" step="0.1" {...register('weightVehicleType')} />
                    {errors.weightVehicleType && (
                      <p className="text-sm text-destructive mt-1">{errors.weightVehicleType.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? 'Searching...' : 'Search Cars'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

