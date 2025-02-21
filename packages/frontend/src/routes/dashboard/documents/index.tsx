import { createFileRoute } from "@tanstack/react-router";
import DocumentsPage from "@/components/documents/document.page";

export const Route = createFileRoute("/dashboard/documents/")({
  component: DocumentsPage,
});
