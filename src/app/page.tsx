import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Car, Zap } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            DreamCar
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find your perfect car with AI-powered preference matching and explainable scoring
          </p>
        </div>

        <div className="flex justify-center mb-16">
          <Link href="/quiz">
            <Button size="lg" className="text-lg px-8">
              <Search className="mr-2 h-5 w-5" />
              Take the Quiz
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <Search className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Personalized Quiz</CardTitle>
              <CardDescription>
                Answer curated questions about your lifestyle and driving needs to find your perfect match
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>AI-Powered Analysis</CardTitle>
              <CardDescription>
                GPT-4o analyzes your answers and automatically determines what matters most to you
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Car className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Compromise Insights</CardTitle>
              <CardDescription>
                Understand trade-offs with AI-generated explanations for each recommendation
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="mt-16 text-center text-sm text-muted-foreground">
          <p>Powered by deterministic scoring + GPT-4o</p>
        </div>
      </div>
    </main>
  );
}
