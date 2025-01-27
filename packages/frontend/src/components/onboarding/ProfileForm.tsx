import { useFormContext } from "react-hook-form";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import type { OnboardingData } from "./schema";

export function ProfileForm() {
  const {
    register,
    formState: { errors },
  } = useFormContext<OnboardingData>();

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Полное имя</Label>
        <Input id="name" {...register("name")} error={errors.name?.message} />
        {errors.name && (
          <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="pfp">URL профиля</Label>
        <Input id="pfp" {...register("pfp")} />
      </div>
    </div>
  );
}
