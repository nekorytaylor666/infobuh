import { useEffect, useRef } from "react";
import { Button } from "../ui/button";
import {
  useLoaderData,
  useNavigate,
  useParams,
  useSearch,
} from "@tanstack/react-router";
import { ProfileForm } from "./ProfileForm";
import { CompanyForm } from "./CompanyForm";
import { SignatureForm } from "./SignatureForm";
import { toast } from "sonner";
import { useAuthContext } from "../../lib/auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { onboardingSchema, type OnboardingData } from "./schema";
import { getOnboardingStatus, submitOnboarding } from "../../lib/api";
import type { OnboardingStepType } from "./OnboardingRoute";

interface OnboardingFormProps {
  currentStep: OnboardingStepType;
  onStepChange: (step: OnboardingStepType) => void;
}

export function OnboardingForm({
  currentStep,
  onStepChange,
}: OnboardingFormProps) {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { returnTo } = useSearch({ from: "/onboarding" });
  // Query onboarding status
  const { isLoading } = useQuery({
    queryKey: ["onboardingStatus", user?.id],
    queryFn: () => {
      if (!user?.id) throw new Error("User ID is required");
      return getOnboardingStatus(user.id);
    },
    enabled: !!user?.id,
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
      });
    },
    onSuccess: () => {
      toast.success("Your account has been created successfully");
      navigate({ to: returnTo || "/dashboard" });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create account"
      );
    },
  });

  const handleNext = async () => {
    switch (currentStep) {
      case "profile": {
        const isValid = await trigger(["name"]);
        if (isValid) onStepChange("signature");
        break;
      }
      case "signature": {
        // SignatureForm handles its own progression via onSuccess
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
          formRef.current?.requestSubmit(); // Submit form after company step
        }
        break;
      }
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case "signature":
        onStepChange("profile");
        break;
      case "company":
        onStepChange("signature");
        break;
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
        {currentStep === "profile" && <ProfileForm />}
        {currentStep === "signature" && (
          <SignatureForm onSuccess={() => onStepChange("company")} />
        )}
        {currentStep === "company" && (
          <>
            <CompanyForm />
          </>
        )}

        <div className="mt-8 flex justify-between">
          {currentStep !== "profile" && (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={submitMutation.isPending}
            >
              Назад
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            {currentStep !== "signature" && (
              <Button
                type="button"
                className={currentStep === "profile" ? "w-full" : ""}
                onClick={handleNext}
                disabled={submitMutation.isPending}
              >
                {currentStep === "company"
                  ? "Завершить настройку"
                  : "Продолжить"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
