import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Plus, Trash2 } from "lucide-react";
import { type Employee } from "./schema";
import { useFormContext } from "react-hook-form";

interface EmployeeFormProps {
  employees: Employee[];
  onChange: (employees: Employee[]) => void;
  error?: string;
}

export function EmployeeForm({
  employees,
  onChange,
  error,
}: EmployeeFormProps) {
  const {
    formState: { errors },
  } = useFormContext();
  const [newEmployee, setNewEmployee] = useState<Employee>({
    fullName: "",
    pfp: "",
    role: "",
    address: "",
    iin: "",
    dateOfBirth: "",
    udosId: "",
    udosDateGiven: "",
    udosWhoGives: "",
  });

  const handleAddEmployee = () => {
    if (newEmployee.fullName && newEmployee.role) {
      onChange([...employees, newEmployee]);
      setNewEmployee({
        fullName: "",
        pfp: "",
        role: "",
        address: "",
        iin: "",
        dateOfBirth: "",
        udosId: "",
        udosDateGiven: "",
        udosWhoGives: "",
      });
    }
  };

  const handleRemoveEmployee = (index: number) => {
    const updatedEmployees = employees.filter((_, i) => i !== index);
    onChange(updatedEmployees);
  };

  const handleNewEmployeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewEmployee((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="space-y-4">
        {employees.map((employee, index) => (
          <div key={`employee-${index}`} className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">{employee.fullName}</h4>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveEmployee(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Роль</Label>
                <div className="mt-1">{employee.role}</div>
              </div>
              <div>
                <Label>ИИН</Label>
                <div className="mt-1">{employee.iin}</div>
              </div>
              <div>
                <Label>Адрес</Label>
                <div className="mt-1">{employee.address}</div>
              </div>
              <div>
                <Label>Дата рождения</Label>
                <div className="mt-1">{employee.dateOfBirth}</div>
              </div>
              <div>
                <Label>UDOS ID</Label>
                <div className="mt-1">{employee.udosId}</div>
              </div>
              <div>
                <Label>Дата выдачи UDOS</Label>
                <div className="mt-1">{employee.udosDateGiven}</div>
              </div>
              <div>
                <Label>Кто выдает UDOS</Label>
                <div className="mt-1">{employee.udosWhoGives}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4 border-t pt-4">
        <h3 className="font-medium">Добавить нового сотрудника</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fullName">Полное имя</Label>
            <Input
              id="fullName"
              name="fullName"
              value={newEmployee.fullName}
              onChange={handleNewEmployeeChange}
            />
          </div>
          <div>
            <Label htmlFor="role">Роль</Label>
            <Input
              id="role"
              name="role"
              value={newEmployee.role}
              onChange={handleNewEmployeeChange}
            />
          </div>
          <div>
            <Label htmlFor="iin">ИИН</Label>
            <Input
              id="iin"
              name="iin"
              value={newEmployee.iin}
              onChange={handleNewEmployeeChange}
            />
          </div>
          <div>
            <Label htmlFor="address">Адрес</Label>
            <Input
              id="address"
              name="address"
              value={newEmployee.address}
              onChange={handleNewEmployeeChange}
            />
          </div>
          <div>
            <Label htmlFor="dateOfBirth">Дата рождения</Label>
            <Input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              value={newEmployee.dateOfBirth}
              onChange={handleNewEmployeeChange}
            />
          </div>
          <div>
            <Label htmlFor="udosId">Номер удостоверения личности</Label>
            <Input
              id="udosId"
              name="udosId"
              value={newEmployee.udosId}
              onChange={handleNewEmployeeChange}
            />
          </div>
          <div>
            <Label htmlFor="udosDateGiven">
              Дата выдачи удостоверения личности
            </Label>
            <Input
              id="udosDateGiven"
              name="udosDateGiven"
              type="date"
              value={newEmployee.udosDateGiven}
              onChange={handleNewEmployeeChange}
            />
          </div>
          <div>
            <Label htmlFor="udosWhoGives">
              Кто выдает удостоверение личности
            </Label>
            <Input
              id="udosWhoGives"
              name="udosWhoGives"
              value={newEmployee.udosWhoGives}
              onChange={handleNewEmployeeChange}
            />
          </div>
          <div>
            <Label htmlFor="pfp">URL профиля (по желанию)</Label>
            <Input
              id="pfp"
              name="pfp"
              value={newEmployee.pfp}
              onChange={handleNewEmployeeChange}
            />
          </div>
        </div>
        <Button
          type="button"
          onClick={handleAddEmployee}
          disabled={!newEmployee.fullName || !newEmployee.role}
        >
          <Plus className="h-4 w-4 mr-2" />
          Добавить сотрудника
        </Button>
      </div>
    </div>
  );
}
