import { OnboardingForm } from "./OnboardingForm";

export function OnboardingRoute() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to Accounting KZ
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Let's get you set up with your account and company information
          </p>
        </div>
        <OnboardingForm />
      </div>
    </div>
  );
}
