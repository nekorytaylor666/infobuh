import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { useNavigate } from "@tanstack/react-router";
import { BankForm } from "./BankForm";
import { EmployeeForm } from "./EmployeeForm";
import { ProfileForm } from "./ProfileForm";
import { CompanyForm } from "./CompanyForm";
import { toast } from "sonner";
import { useAuth } from "../../lib/auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { onboardingSchema, type OnboardingData } from "./schema";
import { getOnboardingStatus, submitOnboarding } from "../../lib/api";

type OnboardingStep = "profile" | "company" | "banks" | "employees";

interface OnboardingFormProps {
  onStepChange: (step: OnboardingStep) => void;
}

export function OnboardingForm({ onStepChange }: OnboardingFormProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<OnboardingStep>("profile");

  useEffect(() => {
    onStepChange(step);
  }, [step, onStepChange]);

  // Query onboarding status
  const { isLoading } = useQuery({
    queryKey: ["onboardingStatus", user?.id],
    queryFn: () => {
      if (!user?.id) throw new Error("User ID is required");
      return getOnboardingStatus(user.id);
    },
    enabled: !!user?.id,
    onSuccess: (data) => {
      if (data.isComplete) {
        navigate({ to: "/dashboard" });
      } else {
        setStep(data.currentStep as OnboardingStep);
      }
    },
  });

  const formRef = useRef<HTMLFormElement>(null);

  // Form setup
  const methods = useForm<OnboardingData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: "",
      image: "",
      legalEntity: {
        name: "",
        image: "",
        type: "",
        address: "",
        phone: "",
        oked: "",
        bin: "",
        registrationDate: "",
        ugd: "",
      },
      banks: [],
      employees: [],
    },
  });

  const {
    handleSubmit,

    formState: { errors },
    trigger,
    setValue,
  } = methods;

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (data: OnboardingData) => {
      console.log(data);
      if (!user?.id) throw new Error("User ID is required");
      return submitOnboarding(user.id, {
        ...data,
        email: user.email || data.email,
      });
    },
    onSuccess: () => {
      toast.success("Your account has been created successfully");
      navigate({ to: "/dashboard" });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create account"
      );
    },
  });

  const handleNext = async () => {
    switch (step) {
      case "profile": {
        const isValid = await trigger(["name"]);
        if (isValid) setStep("company");
        break;
      }
      case "company": {
        const isValid = await trigger([
          "legalEntity.name",
          "legalEntity.type",
          "legalEntity.address",
          "legalEntity.phone",
          "legalEntity.oked",
          "legalEntity.bin",
          "legalEntity.registrationDate",
          "legalEntity.ugd",
        ]);
        if (isValid) {
          setStep("banks");
        }
        break;
      }
      case "banks": {
        setStep("employees");
        break;
      }
      case "employees": {
        console.log(methods.getValues());
        console.log(methods.formState.isValid);
        console.log(methods.formState.errors);
        formRef.current?.requestSubmit();
        break;
      }
    }
  };

  const handleBack = () => {
    switch (step) {
      case "company":
        setStep("profile");
        break;
      case "banks":
        setStep("company");
        break;
      case "employees":
        setStep("banks");
        break;
    }
  };

  const handleSkip = () => {
    if (step === "banks") {
      setStep("employees");
    } else if (step === "employees") {
      formRef.current?.requestSubmit();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-2 text-gray-500">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <form
        ref={formRef}
        onSubmit={handleSubmit((data) => submitMutation.mutate(data))}
      >
        {step === "profile" && <ProfileForm />}
        {step === "company" && (
          <>
            <CompanyForm />
            <div className="mt-4 text-sm text-muted-foreground">
              * Банки и сотрудники могут быть добавлены позже
            </div>
          </>
        )}
        {step === "banks" && (
          <BankForm
            banks={methods.watch("banks")}
            onChange={(banks) => setValue("banks", banks)}
          />
        )}
        {step === "employees" && (
          <EmployeeForm
            employees={methods.watch("employees")}
            onChange={(employees) => setValue("employees", employees)}
          />
        )}

        <div className="mt-8 flex justify-between">
          {step !== "profile" && (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={submitMutation.isPending}
            >
              Back
            </Button>
          )}
          <div className="flex gap-2">
            {(step === "banks" || step === "employees") && (
              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                disabled={submitMutation.isPending}
              >
                Пропустить
              </Button>
            )}
            <Button
              type="button"
              className={step === "profile" ? "w-full" : ""}
              onClick={handleNext}
              disabled={submitMutation.isPending}
            >
              {step === "employees" ? "Завершить настройку" : "Продолжить"}
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
