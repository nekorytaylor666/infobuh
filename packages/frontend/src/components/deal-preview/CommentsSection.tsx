import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Comment {
  id: string;
  content?: string | null;
  createdAt: string;
  author?: {
    fullname?: string | null;
    email?: string | null;
  } | null;
}

interface CommentsSectionProps {
  comments: Comment[];
}

function getInitials(name?: string | null): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function CommentsSection({ comments }: CommentsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Комментарии</CardTitle>
        <CardDescription>
          {comments.length === 0
            ? "Нет комментариев"
            : `${comments.length} ${
                comments.length === 1
                  ? "комментарий"
                  : comments.length < 5
                    ? "комментария"
                    : "комментариев"
              }`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Пока нет комментариев к этой сделке
          </p>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="p-4 bg-muted rounded-lg">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(comment.author?.fullname)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">
                          {comment.author?.fullname || "Пользователь"}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          •
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleString("ru-KZ", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <p className="text-sm mt-2 whitespace-pre-wrap break-words">
                        {comment.content || ""}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
