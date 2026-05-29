"use client";

import { ReactNode, useState, useEffect } from "react";
import { useFormGuard } from "@/hooks/useFormGuard";
import { AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultiStepFormGuardProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  hasUnsavedChanges: boolean;
  onSave?: () => Promise<void>;
  onDiscard?: () => void;
  className?: string;
}

/**
 * Wrapper component for multi-step forms with unsaved changes protection
 */
export function MultiStepFormGuard({
  children,
  currentStep,
  totalSteps,
  hasUnsavedChanges,
  onSave,
  onDiscard,
  className,
}: MultiStepFormGuardProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { confirmNavigation, guardedRouter } = useFormGuard(hasUnsavedChanges, {
    message: "You have unsaved changes in this form. Do you want to leave without saving?",
    onRouteChange: async () => {
      setShowWarning(true);
      return false; // Prevent navigation initially
    },
  });

  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave();
      setShowWarning(false);
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    onDiscard?.();
    setShowWarning(false);
  };

  return (
    <div className={cn("relative", className)}>
      {/* Unsaved Changes Warning Banner */}
      {hasUnsavedChanges && !showWarning && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-yellow-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-400">Unsaved Changes</p>
            <p className="text-xs text-yellow-400/80">
              Step {currentStep} of {totalSteps} - Your changes haven't been saved yet
            </p>
          </div>
          {onSave && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-yellow-400 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Now"}
            </button>
          )}
        </div>
      )}

      {/* Modal Confirmation Dialog */}
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface-raised p-6 shadow-card-dark">
            <button
              onClick={() => setShowWarning(false)}
              className="absolute right-4 top-4 text-text-muted hover:text-text-primary"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-full bg-yellow-500/10 p-3">
                <AlertCircle className="h-6 w-6 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Unsaved Changes</h3>
                <p className="text-sm text-text-muted">
                  Step {currentStep} of {totalSteps}
                </p>
              </div>
            </div>

            <p className="mb-6 text-sm text-text-secondary">
              You have unsaved changes in this form. What would you like to do?
            </p>

            <div className="flex gap-3">
              {onSave && (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              )}
              <button
                onClick={handleDiscard}
                className="flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-overlay"
              >
                Discard
              </button>
              <button
                onClick={() => setShowWarning(false)}
                className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-overlay"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Content */}
      {children}
    </div>
  );
}

/**
 * Step indicator for multi-step forms
 */
interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps?: string[];
  className?: string;
}

export function StepIndicator({ currentStep, totalSteps, steps, className }: StepIndicatorProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step, index) => {
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;
        const isLast = index === totalSteps - 1;

        return (
          <div key={step} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold transition-all",
                  isCompleted && "border-brand-500 bg-brand-500 text-white",
                  isActive && "border-brand-500 bg-brand-500/10 text-brand-500",
                  !isActive && !isCompleted && "border-border bg-surface text-text-muted"
                )}
              >
                {step}
              </div>
              {steps && steps[index] && (
                <span
                  className={cn(
                    "mt-2 text-xs font-medium",
                    isActive ? "text-text-primary" : "text-text-muted"
                  )}
                >
                  {steps[index]}
                </span>
              )}
            </div>
            {!isLast && (
              <div
                className={cn(
                  "mx-2 h-0.5 flex-1 transition-colors",
                  isCompleted ? "bg-brand-500" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
