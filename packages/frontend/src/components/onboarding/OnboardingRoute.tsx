import { OnboardingForm } from "./OnboardingForm";
import { Button } from "../ui/button";
import { cx } from "../../lib/utils";
import { useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

interface Step {
  name: string;
  step: "profile" | "signature" | "company";
  question: string;
  subtitle: string;
}

export type OnboardingStepType = Step["step"];

const steps: Step[] = [
  {
    name: "Profile",
    step: "profile",
    question: "Расскажите о себе",
    subtitle: "Ваше имя и фото",
  },
  {
    name: "E-Signature",
    step: "signature",
    question: "Подпишите с помощью ЭЦП",
    subtitle: "Загрузите файл ЭЦП и введите пароль",
  },
  {
    name: "Company",
    step: "company",
    question: "Расскажите про вашу компанию",
    subtitle: "Название компании, тип, адрес, телефон, OKED, BIN, UGD",
  },
];

function StepProgress({ currentStep }: { currentStep: string }) {
  const currentStepIndex = steps.findIndex((s) => s.step === currentStep);

  return (
    <div aria-label="Onboarding progress">
      <ol className="mx-auto flex justify-center w-48 flex-nowrap gap-1 md:w-fit">
        {steps.map((step, index) => (
          <li
            key={step.name}
            className={cx(
              "h-1 w-24 rounded-full",
              index <= currentStepIndex
                ? "bg-primary"
                : "bg-gray-300 dark:bg-gray-700"
            )}
          >
            <span className="sr-only">
              {step.name}{" "}
              {index < currentStepIndex
                ? "completed"
                : index === currentStepIndex
                  ? "current"
                  : ""}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function OnboardingRoute() {
  const [scrolled, setScrolled] = useState(false);
  const [currentStep, setCurrentStep] = useState<OnboardingStepType>("profile");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const currentStepData = steps.find((s) => s.step === currentStep);

  return (
    <>
      <header
        className={cx(
          "fixed inset-x-0 top-0 isolate z-50 flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 transition-all md:grid md:grid-cols-[200px_auto_200px] md:px-6 dark:border-gray-900 dark:bg-gray-925",
          scrolled ? "h-12" : "h-20"
        )}
      >
        <div
          className="flex-nowrap items-center gap-0.5 md:flex"
          aria-hidden="true"
        >
          <span className="text-lg font-semibold tracking-tighter text-gray-900 dark:text-gray-50">
            ИнфоБух
          </span>
        </div>
        <StepProgress currentStep={currentStep} />
      </header>
      <main className="container mx-auto max-w-lg mb-20 mt-28">
        <Card className="shadow-none border-none">
          <CardHeader>
            <CardTitle>{currentStepData?.question}</CardTitle>
            <CardDescription>{currentStepData?.subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <OnboardingForm
              currentStep={currentStep}
              onStepChange={setCurrentStep}
            />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
