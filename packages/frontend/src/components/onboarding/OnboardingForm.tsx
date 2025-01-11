import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useNavigate } from "@tanstack/react-router";
import { BankForm } from "./BankForm";
import { EmployeeForm } from "./EmployeeForm";
import { toast } from "sonner";
import { useAuth } from "../../lib/auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { onboardingSchema, type OnboardingData } from "./schema";
import { getOnboardingStatus, submitOnboarding } from "../../lib/api";

type OnboardingStep = "profile" | "company" | "banks" | "employees";

export function OnboardingForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<OnboardingStep>("profile");

  // Query onboarding status
  const { data: status, isLoading } = useQuery({
    queryKey: ["onboardingStatus"],
    queryFn: getOnboardingStatus,
    onSuccess: (data) => {
      if (data.isComplete) {
        navigate({ to: "/dashboard" });
      } else {
        setStep(data.currentStep as OnboardingStep);
      }
    },
  });

  // Form setup
  const methods = useForm<OnboardingData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      fullname: "",
      pfp: "",
      legalEntity: {
        name: "",
        pfp: "",
        type: "",
        address: "",
        phone: "",
        oked: "",
        bin: "",
        registrationDate: "",
        ugd: "",
        banks: [],
        employees: [],
      },
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    watch,
    setValue,
  } = methods;

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: submitOnboarding,
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
        const isValid = await trigger(["fullname"]);
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
        if (isValid) setStep("banks");
        break;
      }
      case "banks": {
        const banks = watch("legalEntity.banks");
        if (banks.length > 0) setStep("employees");
        break;
      }
      case "employees": {
        handleSubmit((data) => submitMutation.mutateAsync(data))();
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

  const renderProfileForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="fullname">Full Name</Label>
        <Input
          id="fullname"
          {...register("fullname")}
          error={errors.fullname?.message}
        />
        {errors.fullname && (
          <p className="text-sm text-destructive mt-1">
            {errors.fullname.message}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="pfp">Profile Picture URL</Label>
        <Input id="pfp" {...register("pfp")} />
      </div>
    </div>
  );

  const renderCompanyForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="legalEntity.name">Company Name</Label>
        <Input
          id="legalEntity.name"
          {...register("legalEntity.name")}
          error={errors.legalEntity?.name?.message}
        />
        {errors.legalEntity?.name && (
          <p className="text-sm text-destructive mt-1">
            {errors.legalEntity.name.message}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="legalEntity.type">Company Type</Label>
        <Input
          id="legalEntity.type"
          {...register("legalEntity.type")}
          error={errors.legalEntity?.message}
        />
      </div>
      <div>
        <Label htmlFor="legalEntity.bin">BIN</Label>
        <Input
          id="legalEntity.bin"
          {...register("legalEntity.bin")}
          error={errors.legalEntity?.bin?.message}
        />
      </div>
      <div>
        <Label htmlFor="legalEntity.address">Address</Label>
        <Input
          id="legalEntity.address"
          {...register("legalEntity.address")}
          error={errors.legalEntity?.address?.message}
        />
      </div>
      <div>
        <Label htmlFor="legalEntity.phone">Phone</Label>
        <Input
          id="legalEntity.phone"
          {...register("legalEntity.phone")}
          error={errors.legalEntity?.phone?.message}
        />
      </div>
      <div>
        <Label htmlFor="legalEntity.oked">OKED</Label>
        <Input
          id="legalEntity.oked"
          {...register("legalEntity.oked")}
          error={errors.legalEntity?.oked?.message}
        />
      </div>
      <div>
        <Label htmlFor="legalEntity.registrationDate">Registration Date</Label>
        <Input
          id="legalEntity.registrationDate"
          type="date"
          {...register("legalEntity.registrationDate")}
          error={errors.legalEntity?.registrationDate?.message}
        />
      </div>
      <div>
        <Label htmlFor="legalEntity.ugd">UGD</Label>
        <Input
          id="legalEntity.ugd"
          {...register("legalEntity.ugd")}
          error={errors.legalEntity?.ugd?.message}
        />
      </div>
      <div>
        <Label htmlFor="legalEntity.pfp">Company Logo URL</Label>
        <Input
          id="legalEntity.pfp"
          {...register("legalEntity.pfp")}
          error={errors.legalEntity?.pfp?.message}
        />
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-2 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">
          {step === "profile"
            ? "Your Profile"
            : step === "company"
              ? "Company Information"
              : step === "banks"
                ? "Bank Details"
                : "Employee Information"}
        </h2>
        <p className="text-gray-500">
          Step{" "}
          {step === "profile"
            ? "1"
            : step === "company"
              ? "2"
              : step === "banks"
                ? "3"
                : "4"}{" "}
          of 4
        </p>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={(e) => e.preventDefault()}>
          {step === "profile" && renderProfileForm()}
          {step === "company" && renderCompanyForm()}
          {step === "banks" && (
            <BankForm
              banks={watch("legalEntity.banks")}
              onChange={(banks) => setValue("legalEntity.banks", banks)}
              error={errors.legalEntity?.banks?.message}
            />
          )}
          {step === "employees" && (
            <EmployeeForm
              employees={watch("legalEntity.employees")}
              onChange={(employees) =>
                setValue("legalEntity.employees", employees)
              }
              error={errors.legalEntity?.employees?.message}
            />
          )}

          <div className="mt-6 flex justify-between">
            {step !== "profile" && (
              <Button type="button" variant="outline" onClick={handleBack}>
                Back
              </Button>
            )}
            <Button
              type="button"
              onClick={handleNext}
              disabled={submitMutation.isPending}
            >
              {step === "employees"
                ? submitMutation.isPending
                  ? "Creating Account..."
                  : "Submit"
                : "Next"}
            </Button>
          </div>
        </form>
      </FormProvider>
    </Card>
  );
}
