// import { createFileRoute } from "@tanstack/react-router";
// import { Button } from "../../../components/ui/button";
// import { Plus } from "lucide-react";
// import { useState } from "react";
// import {
//   Sheet,
//   SheetContent,
//   SheetHeader,
//   SheetTitle,
// } from "../../../components/ui/sheet";
// import { useLegalEntity } from "../../../hooks/use-legal-entity";
// import {
//   useQuery,
//   useQueryClient,
//   useSuspenseQuery,
// } from "@tanstack/react-query";
// import { api } from "@/lib/api";
// import { DataTable } from "@/components/ui/DataTable";
// import { columns } from "@/components/employees/_components/columns";
// import { EmployeeForm } from "@/components/employees/_components/employee-form";
// import type { Employee } from "@/types";

// export const Route = createFileRoute("/dashboard/employees/")({
//   component: EmployeesPage,
// });

// function EmployeesPage() {
//   const { legalEntity } = useLegalEntity();
//   const [isDrawerOpen, setIsDrawerOpen] = useState(false);
//   const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
//     null
//   );
//   const queryClient = useQueryClient();

//   const { data: employees = [], isLoading } = useQuery({
//     queryKey: ["employees", legalEntity?.id],
//     queryFn: () =>
//       api
//         .get<Employee[]>(`/employees/${legalEntity?.id}`)
//         .then((res) => res.data),
//     staleTime: 1000 * 60 * 5, // 5 minutes
//     enabled: !!legalEntity?.id,
//     refetchOnMount: false,
//     refetchOnWindowFocus: false,
//   });

//   const handleAddEmployee = () => {
//     setSelectedEmployee(null);
//     setIsDrawerOpen(true);
//   };

//   const handleEditEmployee = (employee: Employee) => {
//     setSelectedEmployee(employee);
//     setIsDrawerOpen(true);
//   };

//   const handleCloseDrawer = () => {
//     setIsDrawerOpen(false);
//     setSelectedEmployee(null);
//   };

//   if (!legalEntity) {
//     return (
//       <div className="flex h-full items-center justify-center">
//         <p className="text-muted-foreground">
//           Пожалуйста, сначала выберите юридическое лицо
//         </p>
//       </div>
//     );
//   }
//   if (isLoading) {
//     return <div>Loading...</div>;
//   }

//   return (
//     <div className="container mx-auto py-10">
//       <div className="mb-8 flex items-center justify-between">
//         <h1 className="text-3xl font-bold">Сотрудники</h1>
//         <Button onClick={handleAddEmployee}>
//           <Plus className="mr-2 h-4 w-4" />
//           Добавить сотрудника
//         </Button>
//       </div>
//       <DataTable
//         columns={columns}
//         data={employees}
//         onRowClick={(row) => handleEditEmployee(row.original)}
//         isLoading={isLoading}
//       />

//       <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
//         <SheetContent className="w-[400px] sm:w-[540px]">
//           <SheetHeader>
//             <SheetTitle>
//               {selectedEmployee
//                 ? "Редактировать сотрудника"
//                 : "Добавить сотрудника"}
//             </SheetTitle>
//           </SheetHeader>
//           <div className="mt-8">
//             <EmployeeForm
//               employee={selectedEmployee}
//               onSuccess={handleCloseDrawer}
//               legalEntityId={legalEntity.id}
//             />
//           </div>
//         </SheetContent>
//       </Sheet>
//     </div>
//   );
// }
