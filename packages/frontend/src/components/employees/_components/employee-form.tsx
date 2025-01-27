import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Employee } from "@/types";
import { format } from "date-fns";

const employeeSchema = z.object({
  fullName: z.string().min(1, "Полное имя обязательно"),
  role: z.string().min(1, "Роль обязательна"),
  address: z.string().min(1, "Адрес обязателен"),
  iin: z.string().length(12, "ИИН должен содержать 12 цифр"),
  dateOfBirth: z.string().min(1, "Дата рождения обязательна"),
  udosId: z.string().min(1, "Номер удостоверения обязателен"),
  udosDateGiven: z.string().min(1, "Дата выдачи обязательна"),
  udosWhoGives: z.string().min(1, "Орган, выдавший удостоверение, обязателен"),
  pfp: z.string().optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  employee: Employee | null;
  onSuccess: () => void;
  legalEntityId: string;
}

export function EmployeeForm({
  employee,
  onSuccess,
  legalEntityId,
}: EmployeeFormProps) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee
      ? {
          ...employee,
          dateOfBirth: format(new Date(employee.dateOfBirth), "yyyy-MM-dd"),
          udosDateGiven: format(new Date(employee.udosDateGiven), "yyyy-MM-dd"),
        }
      : {
          fullName: "",
          role: "",
          address: "",
          iin: "",
          dateOfBirth: "",
          udosId: "",
          udosDateGiven: "",
          udosWhoGives: "",
          pfp: "",
        },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: EmployeeFormData) => {
      if (employee) {
        return api.put(`/employees/${legalEntityId}/${employee.id}`, data);
      }
      return api.post(`/employees/${legalEntityId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees", legalEntityId] });
      onSuccess();
    },
  });

  const onSubmit = (data: EmployeeFormData) => {
    mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="fullName" className="text-sm font-medium">
          Полное имя
        </label>
        <Input {...register("fullName")} id="fullName" />
        {errors.fullName && (
          <p className="text-sm text-red-500">{errors.fullName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="role" className="text-sm font-medium">
          Роль
        </label>
        <Input {...register("role")} id="role" />
        {errors.role && (
          <p className="text-sm text-red-500">{errors.role.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="iin" className="text-sm font-medium">
          ИИН
        </label>
        <Input {...register("iin")} id="iin" maxLength={12} />
        {errors.iin && (
          <p className="text-sm text-red-500">{errors.iin.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="dateOfBirth" className="text-sm font-medium">
          Дата рождения
        </label>
        <Input {...register("dateOfBirth")} id="dateOfBirth" type="date" />
        {errors.dateOfBirth && (
          <p className="text-sm text-red-500">{errors.dateOfBirth.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="address" className="text-sm font-medium">
          Адрес
        </label>
        <Input {...register("address")} id="address" />
        {errors.address && (
          <p className="text-sm text-red-500">{errors.address.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="udosId" className="text-sm font-medium">
          Номер удостоверения
        </label>
        <Input {...register("udosId")} id="udosId" />
        {errors.udosId && (
          <p className="text-sm text-red-500">{errors.udosId.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="udosDateGiven" className="text-sm font-medium">
          Дата выдачи
        </label>
        <Input {...register("udosDateGiven")} id="udosDateGiven" type="date" />
        {errors.udosDateGiven && (
          <p className="text-sm text-red-500">{errors.udosDateGiven.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="udosWhoGives" className="text-sm font-medium">
          Орган, выдавший удостоверение
        </label>
        <Input {...register("udosWhoGives")} id="udosWhoGives" />
        {errors.udosWhoGives && (
          <p className="text-sm text-red-500">{errors.udosWhoGives.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="pfp" className="text-sm font-medium">
          URL профиля
        </label>
        <Input {...register("pfp")} id="pfp" />
        {errors.pfp && (
          <p className="text-sm text-red-500">{errors.pfp.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending
          ? "Сохранение..."
          : employee
            ? "Обновить сотрудника"
            : "Добавить сотрудника"}
      </Button>
    </form>
  );
}
