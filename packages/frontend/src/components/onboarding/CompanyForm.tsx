import { useFormContext } from "react-hook-form";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import type { OnboardingData } from "./schema";

export function CompanyForm() {
  const {
    register,
    formState: { errors },
  } = useFormContext<OnboardingData>();

  return (
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
          error={errors.legalEntity?.type?.message}
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
        <Label htmlFor="legalEntity.image">Company Logo URL</Label>
        <Input
          id="legalEntity.image"
          {...register("legalEntity.image")}
          error={errors.legalEntity?.image?.message}
        />
      </div>
    </div>
  );
}
