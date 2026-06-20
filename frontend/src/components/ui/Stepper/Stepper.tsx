import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface Step {
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  current: number;
  className?: string;
}

export function Stepper({ steps, current, className }: StepperProps) {
  return (
    <ol className={cn('flex w-full items-center', className)}>
      {steps.map((step, index) => {
        const isComplete = index < current;
        const isActive = index === current;
        const isLast = index === steps.length - 1;
        return (
          <li key={step.label} className={cn('flex items-center', !isLast && 'flex-1')}>
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-body-sm font-medium transition-colors',
                  isComplete && 'border-accent-600 bg-accent-600 text-white',
                  isActive && 'border-accent-600 bg-accent-100 text-accent-600',
                  !isComplete && !isActive && 'border-strong bg-surface text-ink-400',
                )}
              >
                {isComplete ? <Check size={16} strokeWidth={2.5} /> : <span className="font-data">{index + 1}</span>}
              </span>
              <div className="hidden sm:block">
                <p
                  className={cn(
                    'text-body-sm font-medium',
                    isActive || isComplete ? 'text-ink-900' : 'text-ink-400',
                  )}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-caption text-ink-400">{step.description}</p>
                )}
              </div>
            </div>
            {!isLast && (
              <span
                className={cn(
                  'mx-3 h-px flex-1 transition-colors',
                  isComplete ? 'bg-accent-600' : 'bg-subtle',
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
