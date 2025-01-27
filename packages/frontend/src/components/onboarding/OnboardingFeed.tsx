import { Card, Title, Text } from "@tremor/react";
import { ReactNode } from "react";

type OnboardingStep = "profile" | "company" | "banks" | "employees";

interface OnboardingFeedProps {
  currentStep: OnboardingStep;
  children: ReactNode;
}

const steps = [
  {
    id: "profile",
    title: "Set up your profile",
    description: "Add your personal information to get started",
  },
  {
    id: "company",
    title: "Company Information",
    description: "Tell us about your business",
  },
  {
    id: "banks",
    title: "Banking Details",
    description: "Add your company's banking information",
  },
  {
    id: "employees",
    title: "Employee Management",
    description: "Add your company's employees",
  },
];

export function OnboardingFeed({ currentStep, children }: OnboardingFeedProps) {
  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Title>Getting Started</Title>
      <Text className="mt-2">Follow the steps to set up your workspace</Text>

      <div className="mt-8 space-y-4">
        {steps.map((step, index) => {
          const isComplete = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <div
              key={step.id}
              className={`p-4 rounded-lg border ${
                isCurrent ? "border-primary bg-primary/5" : "border-gray-200"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    isComplete
                      ? "bg-primary text-white"
                      : isCurrent
                        ? "bg-primary/10 text-primary border-2 border-primary"
                        : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <span>{index + 1}</span>
                </div>
                <div>
                  <Text className="font-medium">{step.title}</Text>
                  <Text className="text-gray-500">{step.description}</Text>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Card className="mt-8 p-6">{children}</Card>
    </div>
  );
}
