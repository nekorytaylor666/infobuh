import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Employee } from "@/types";

export const columns: ColumnDef<Employee>[] = [
  {
    accessorKey: "pfp",
    header: "",
    cell: ({ row }) => {
      const pfp = row.getValue("pfp") as string;
      const fullName = row.getValue("fullName") as string;
      const initials = fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();

      return (
        <Avatar className="h-8 w-8">
          <AvatarImage src={pfp} alt={fullName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      );
    },
  },
  {
    accessorKey: "fullName",
    header: "Полное имя",
  },
  {
    accessorKey: "role",
    header: "Роль",
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      return <Badge variant="outline">{role}</Badge>;
    },
  },
  {
    accessorKey: "iin",
    header: "ИИН",
  },
  {
    accessorKey: "dateOfBirth",
    header: "Дата рождения",
    cell: ({ row }) => {
      const date = row.getValue("dateOfBirth") as string;
      return format(new Date(date), "dd.MM.yyyy");
    },
  },
  {
    accessorKey: "address",
    header: "Адрес",
  },
];
