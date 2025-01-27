import { OnboardingForm } from "./OnboardingForm";
import { Logo } from "../ui/logo";
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
  step: "profile" | "company" | "banks" | "employees";
  question: string;
  subtitle: string;
}

const steps: Step[] = [
  {
    name: "Profile",
    step: "profile",
    question: "Расскажите о себе",
    subtitle: "Ваше имя и фото",
  },
  {
    name: "Company",
    step: "company",
    question: "Расскажите про вашу компанию",
    subtitle: "Название компании, тип, адрес, телефон, OKED, BIN, UGD",
  },
  {
    name: "Banks",
    step: "banks",
    question: "Расскажите о банковских реквизитах",
    subtitle: "Название банка, БИК, номер счета",
  },
  {
    name: "Employees",
    step: "employees",
    question: "Расскажите о сотрудниках компании",
    subtitle:
      "Имя, роль, адрес, ИИН, дата рождения, ID UDOS, дата выдачи UDOS, кто выдал UDOS",
  },
];

function StepProgress({ currentStep }: { currentStep: string }) {
  const currentStepIndex = steps.findIndex((s) => s.step === currentStep);

  return (
    <div aria-label="Onboarding progress">
      <ol className="mx-auto flex w-24 flex-nowrap gap-1 md:w-fit">
        {steps.map((step, index) => (
          <li
            key={step.name}
            className={cx(
              "h-1 w-12 rounded-full",
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
  const [currentStep, setCurrentStep] = useState<Step["step"]>("profile");

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
          className="hidden flex-nowrap items-center gap-0.5 md:flex"
          aria-hidden="true"
        >
          <span className="mt-0.5 text-lg font-semibold text-gray-900 dark:text-gray-50">
            ИнфоБух
          </span>
        </div>
        <StepProgress currentStep={currentStep} />
        <Button variant="ghost" className="ml-auto w-fit" asChild>
          <a href="/dashboard">Пропустить</a>
        </Button>
      </header>
      <main className="container mx-auto max-w-lg mb-20 mt-28 px-4">
        <Card className="shadow-none border-none">
          <CardHeader>
            <CardTitle>{currentStepData?.question}</CardTitle>
            <CardDescription>{currentStepData?.subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <OnboardingForm onStepChange={setCurrentStep} />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
