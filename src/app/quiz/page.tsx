'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { quizV2Questions } from '@/config/quiz-questions';
import type { QuizV2Answers, QuizV2Question } from '@/types/quiz';
import { ArrowLeft, ArrowRight, Loader2, SkipForward } from 'lucide-react';
import Link from 'next/link';
import { saveSearchState } from '@/lib/clientPrefs';

type AnswerValue = string | string[] | number | boolean;

export default function QuizPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuizV2Answers>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const visibleQuestions = useMemo(
    () => quizV2Questions.filter((q) => !q.showIf || q.showIf(answers)),
    [answers],
  );

  const safeStep = Math.min(currentStep, Math.max(0, visibleQuestions.length - 1));
  const currentQuestion = visibleQuestions[safeStep];
  const progress = visibleQuestions.length > 0
    ? ((safeStep + 1) / visibleQuestions.length) * 100
    : 0;

  const handleAnswer = (value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleMultiToggle = (optionValue: string) => {
    const current = (answers[currentQuestion.id] as string[] | undefined) ?? [];
    const max = currentQuestion.maxSelect;
    if (current.includes(optionValue)) {
      handleAnswer(current.filter((v) => v !== optionValue));
    } else if (!max || current.length < max) {
      handleAnswer([...current, optionValue]);
    }
  };

  const handleNext = () => {
    if (safeStep < visibleQuestions.length - 1) {
      setCurrentStep(safeStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSkip = () => {
    if (safeStep < visibleQuestions.length - 1) {
      setCurrentStep(safeStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (safeStep > 0) setCurrentStep(safeStep - 1);
  };

  const handleSubmit = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/quiz/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) throw new Error('Failed to analyze preferences');

      const data = await response.json();
      saveSearchState({
        prefs: data.preferences,
        reasoning: data.reasoning,
        criteriaImportance: data.criteriaImportance,
      });
      router.push('/results');
    } catch (error) {
      console.error('Error analyzing quiz:', error);
      alert('Failed to analyze your preferences. Please try again.');
      setIsAnalyzing(false);
    }
  };

  const canProceed = (() => {
    const val = answers[currentQuestion?.id];
    if (val === undefined || val === null) return false;
    switch (currentQuestion?.type) {
      case 'single':
        return typeof val === 'string' && val !== '';
      case 'multi':
        return Array.isArray(val) && val.length > 0;
      case 'scale':
        return typeof val === 'number';
      case 'yesno':
        return typeof val === 'boolean';
      default:
        return false;
    }
  })();

  const isConditional = !!currentQuestion?.showIf;
  const isLastStep = safeStep === visibleQuestions.length - 1;

  if (!currentQuestion) return null;

  const prevSection =
    safeStep > 0 ? visibleQuestions[safeStep - 1]?.section : undefined;
  const showSectionBadge =
    currentQuestion.section && currentQuestion.section !== prevSection;

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {safeStep === 0 && (
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        )}

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">
              Question {safeStep + 1} of {visibleQuestions.length}
            </span>
            <span className="text-sm font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            {showSectionBadge && (
              <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">
                {currentQuestion.section}
              </p>
            )}
            <CardTitle className="text-2xl">{currentQuestion.title}</CardTitle>
            {currentQuestion.helper && (
              <CardDescription>{currentQuestion.helper}</CardDescription>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            <QuestionBody
              question={currentQuestion}
              value={answers[currentQuestion.id]}
              onAnswer={handleAnswer}
              onMultiToggle={handleMultiToggle}
            />

            {/* Navigation */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={safeStep === 0 || isAnalyzing}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>

              <div className="flex gap-2">
                {isConditional && !isLastStep && (
                  <Button variant="ghost" onClick={handleSkip} disabled={isAnalyzing}>
                    <SkipForward className="mr-2 h-4 w-4" />
                    Skip
                  </Button>
                )}

                <Button
                  onClick={handleNext}
                  disabled={!canProceed || isAnalyzing}
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing…
                    </>
                  ) : isLastStep ? (
                    'See My Matches'
                  ) : (
                    <>
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

// ── question renderers ──────────────────────────────────────────

function QuestionBody({
  question,
  value,
  onAnswer,
  onMultiToggle,
}: {
  question: QuizV2Question;
  value: AnswerValue | undefined;
  onAnswer: (v: AnswerValue) => void;
  onMultiToggle: (optionValue: string) => void;
}) {
  switch (question.type) {
    case 'yesno':
      return (
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant={value === true ? 'default' : 'outline'}
            size="lg"
            onClick={() => onAnswer(true)}
            className="h-20 text-lg"
          >
            Yes
          </Button>
          <Button
            variant={value === false ? 'default' : 'outline'}
            size="lg"
            onClick={() => onAnswer(false)}
            className="h-20 text-lg"
          >
            No
          </Button>
        </div>
      );

    case 'single':
      return (
        <div className="space-y-2">
          {question.options?.map((opt) => (
            <Button
              key={opt.value}
              variant={value === opt.value ? 'default' : 'outline'}
              size="lg"
              onClick={() => onAnswer(opt.value)}
              className="w-full h-auto py-4 text-left justify-start"
            >
              {opt.label}
            </Button>
          ))}
        </div>
      );

    case 'multi': {
      const selected = Array.isArray(value) ? value : [];
      const atLimit = question.maxSelect != null && selected.length >= question.maxSelect;
      return (
        <div className="space-y-2">
          {question.options?.map((opt) => {
            const isSelected = selected.includes(opt.value);
            return (
              <Button
                key={opt.value}
                variant={isSelected ? 'default' : 'outline'}
                size="lg"
                onClick={() => onMultiToggle(opt.value)}
                disabled={!isSelected && atLimit}
                className="w-full h-auto py-4 text-left justify-start"
              >
                <span className="mr-3 inline-flex h-5 w-5 items-center justify-center rounded border text-xs">
                  {isSelected ? '✓' : ''}
                </span>
                {opt.label}
              </Button>
            );
          })}
        </div>
      );
    }

    case 'scale': {
      const labels = question.scale?.labels;
      return (
        <div className="space-y-4">
          <div className="flex justify-between text-sm text-muted-foreground px-1">
            <span>{labels?.[1]}</span>
            {labels?.[3] && <span>{labels[3]}</span>}
            <span>{labels?.[5]}</span>
          </div>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((n) => (
              <Button
                key={n}
                variant={value === n ? 'default' : 'outline'}
                size="lg"
                onClick={() => onAnswer(n)}
                className="w-14 h-14 text-lg"
              >
                {n}
              </Button>
            ))}
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}
