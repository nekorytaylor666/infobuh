// import { Card, CardTitle, CardHeader, CardContent } from "@/components/ui/card";
// import { Skeleton } from "@/components/ui/skeleton";
// import { useLegalEntity } from "@/hooks/use-legal-entity";
// import { api, getEmployee } from "@/lib/api";
// import type { Employee } from "@/types";
// import { useQuery } from "@tanstack/react-query";
// import { createFileRoute } from "@tanstack/react-router";
// import { useEffect } from "react";

// export const Route = createFileRoute("/dashboard/employees/$id")({
//   component: RouteComponent,
//   pendingComponent: () => <Skeleton className="h-24 w-full" />,
// });

// function RouteComponent() {
//   const { id } = Route.useParams();
//   const { legalEntity } = useLegalEntity();
//   const {
//     data: employee,
//     isLoading,
//     isError,
//     error,
//     isFetched,
//   } = useQuery({
//     queryKey: ["employee", id],
//     queryFn: () => getEmployee(legalEntity?.id, id),
//     enabled: Boolean(legalEntity?.id),
//   });

//   if (isLoading || !isFetched) return <Skeleton className="h-24 w-full" />;
//   if (isError) return <div>Error: {error?.message}</div>;

//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle>id: {employee?.fullName}</CardTitle>
//       </CardHeader>
//       <CardContent>
//         <div>email: {employee?.role}</div>
//         <div>phone: {employee?.iin}</div>
//         <div>phone: {employee?.address}</div>
//       </CardContent>
//     </Card>
//   );
// }
