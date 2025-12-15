import { createFileRoute } from "@tanstack/react-router";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DealPreviewHeader } from "@/components/deal-preview/DealPreviewHeader";
import { DealInfoSection } from "@/components/deal-preview/DealInfoSection";
import { CommentsSection } from "@/components/deal-preview/CommentsSection";
import { DocumentsSection } from "@/components/deal-preview/DocumentsSection";

export const Route = createFileRoute("/preview/deals/$shareToken/")({
  component: DealPreviewComponent,
  pendingComponent: DealPreviewPendingComponent,

  loader: async ({ params }) => {
    const shareToken = params.shareToken;

    try {
      // Fetch only deal data, no accounting information
      const dealRes = await api.get(`/deals/${shareToken}`, {
        params: { token: shareToken }
      });

      return {
        deal: dealRes.data,
      };
    } catch (error) {
      console.error("Error loading deal preview:", error);
      throw new Error("Failed to load deal preview");
    }
  },

  errorComponent: ({ error }) => {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Deal Preview Not Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This preview link is invalid or has expired. Please contact the
              deal owner for a valid share link.
            </p>
            {error && (
              <p className="mt-4 text-sm text-destructive">
                Error: {error.message}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  },
});

function DealPreviewComponent() {
  const data = Route.useLoaderData();
  const { deal } = data;
  const { shareToken } = Route.useParams();

  if (!deal) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Deal Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The requested deal could not be found or is not publicly
              accessible.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
        <DealPreviewHeader deal={deal} />

        <div className="mt-6 space-y-6">
          {/* Single column layout */}
          <DealInfoSection deal={deal} />

          {/* Full-width sections */}
          <CommentsSection comments={deal.comments || []} />
          <DocumentsSection
            documents={deal.documentsFlutter || []}
            dealId={shareToken}
            legalEntityId={deal.legalEntityId}
          />
        </div>
      </div>
    </div>
  );
}

function DealPreviewPendingComponent() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
        {/* Header skeleton */}
        <div className="flex items-center justify-between border-b pb-4 mb-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10" />
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>

        <div className="space-y-6">
          {/* Deal info skeleton */}
          <Skeleton className="h-80 w-full" />

          {/* Comments section skeleton */}
          <Skeleton className="h-64 w-full" />

          {/* Documents grid skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-36 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
