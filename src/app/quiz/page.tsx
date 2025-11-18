'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { quizQuestions, type QuizQuestion } from '@/config/quiz-questions';
import type { QuizAnswers } from '@/types/quiz';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function QuizPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const currentQuestion = quizQuestions[currentStep];
  const progress = ((currentStep + 1) / quizQuestions.length) * 100;

  const handleAnswer = (value: string | number | boolean) => {
    setAnswers({ ...answers, [currentQuestion.id]: value });
  };

  const handleNext = () => {
    if (currentStep < quizQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsAnalyzing(true);
    try {
      // Call GPT to analyze quiz answers and generate preferences
      const response = await fetch('/api/quiz/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) throw new Error('Failed to analyze preferences');

      const { preferences, reasoning } = await response.json();

      // Navigate to results with preferences
      const params = new URLSearchParams({
        prefs: JSON.stringify(preferences),
        reasoning: reasoning || '',
      });
      router.push(`/results?${params.toString()}`);
    } catch (error) {
      console.error('Error analyzing quiz:', error);
      alert('Failed to analyze your preferences. Please try again.');
      setIsAnalyzing(false);
    }
  };

  const currentAnswer = answers[currentQuestion.id];
  const canProceed = currentAnswer !== undefined && currentAnswer !== '';

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {currentStep === 0 && (
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        )}

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">
              Question {currentStep + 1} of {quizQuestions.length}
            </span>
            <span className="text-sm font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{currentQuestion.question}</CardTitle>
            <CardDescription>Answer honestly to get the best recommendations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Yes/No Question */}
            {currentQuestion.type === 'yes_no' && (
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={currentAnswer === true ? 'default' : 'outline'}
                  size="lg"
                  onClick={() => handleAnswer(true)}
                  className="h-20"
                >
                  Yes
                </Button>
                <Button
                  variant={currentAnswer === false ? 'default' : 'outline'}
                  size="lg"
                  onClick={() => handleAnswer(false)}
                  className="h-20"
                >
                  No
                </Button>
              </div>
            )}

            {/* Multiple Choice */}
            {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
              <div className="space-y-2">
                {currentQuestion.options.map((option) => (
                  <Button
                    key={option}
                    variant={currentAnswer === option ? 'default' : 'outline'}
                    size="lg"
                    onClick={() => handleAnswer(option)}
                    className="w-full h-auto py-4 text-left justify-start"
                  >
                    {option}
                  </Button>
                ))}
              </div>
            )}

            {/* Scale Question */}
            {currentQuestion.type === 'scale' && (
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-muted-foreground px-1">
                  <span>{currentQuestion.scaleLabels?.min}</span>
                  <span>{currentQuestion.scaleLabels?.max}</span>
                </div>
                <div className="flex gap-2 justify-center">
                  {Array.from(
                    { length: (currentQuestion.scaleMax || 5) - (currentQuestion.scaleMin || 1) + 1 },
                    (_, i) => (currentQuestion.scaleMin || 1) + i
                  ).map((value) => (
                    <Button
                      key={value}
                      variant={currentAnswer === value ? 'default' : 'outline'}
                      size="lg"
                      onClick={() => handleAnswer(value)}
                      className="w-14 h-14 text-lg"
                    >
                      {value}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Text Input */}
            {currentQuestion.type === 'text' && (
              <Input
                value={(currentAnswer as string) || ''}
                onChange={(e) => handleAnswer(e.target.value)}
                placeholder="Type your answer..."
                className="text-lg"
              />
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button variant="ghost" onClick={handleBack} disabled={currentStep === 0 || isAnalyzing}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleNext} disabled={!canProceed || isAnalyzing} size="lg">
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : currentStep === quizQuestions.length - 1 ? (
                  'See My Matches'
                ) : (
                  <>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

