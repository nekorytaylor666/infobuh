import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import {
  MoreHorizontal,
  File,
  Folder,
  Upload,
  FileText,
  Image,
  FileSpreadsheet,
  FileCode,
  Plus,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TreeView, type TreeDataItem } from "@/components/tree-view";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileUploader } from "@/components/FileUploader";

// Define the Document type
interface Document {
  id: string;
  name: string;
  type: "file" | "folder";
  size: string;
  owner: {
    name: string;
    avatar: string;
  };
  year: number;
  uploadedAt: string;
  parentId?: string;
}

// Sample data
const documents: Document[] = [
  {
    id: "1",
    name: "Inbox",
    type: "folder",
    size: "89.17 kb",
    owner: {
      name: "Sam",
      avatar: "/avatars/sam.jpg",
    },
    year: 2023,
    uploadedAt: "2023-01-11T00:00:00Z",
  },
  {
    id: "2",
    name: "Contract 1.jpeg",
    type: "file",
    size: "89.17 kb",
    owner: {
      name: "Lauren",
      avatar: "/avatars/lauren.jpg",
    },
    year: 2022,
    uploadedAt: "2023-01-11T00:00:00Z",
    parentId: "1", // Put this in the Inbox folder
  },
  {
    id: "3",
    name: "Agreement.pdf",
    type: "file",
    size: "2.16 mb",
    owner: {
      name: "Carl",
      avatar: "/avatars/carl.jpg",
    },
    year: 2023,
    uploadedAt: "2023-01-11T00:00:00Z",
    parentId: "1", // Put this in the Inbox folder
  },
  {
    id: "4",
    name: "Project Plan.docx",
    type: "file",
    size: "1.25 mb",
    owner: {
      name: "Alice",
      avatar: "/avatars/alice.jpg",
    },
    year: 2023,
    uploadedAt: "2023-02-15T00:00:00Z",
  },
  {
    id: "5",
    name: "Meeting Notes.txt",
    type: "file",
    size: "45.3 kb",
    owner: {
      name: "Bob",
      avatar: "/avatars/bob.jpg",
    },
    year: 2022,
    uploadedAt: "2023-01-20T00:00:00Z",
  },
  {
    id: "6",
    name: "Budget.xlsx",
    type: "file",
    size: "512.8 kb",
    owner: {
      name: "Charlie",
      avatar: "/avatars/charlie.jpg",
    },
    year: 2023,
    uploadedAt: "2023-03-01T00:00:00Z",
  },
  {
    id: "7",
    name: "Presentation.pptx",
    type: "file",
    size: "3.1 mb",
    owner: {
      name: "Diana",
      avatar: "/avatars/diana.jpg",
    },
    year: 2023,
    uploadedAt: "2023-02-25T00:00:00Z",
  },
  {
    id: "8",
    name: "Research Paper.pdf",
    type: "file",
    size: "1.8 mb",
    owner: {
      name: "Eve",
      avatar: "/avatars/eve.jpg",
    },
    year: 2022,
    uploadedAt: "2023-01-30T00:00:00Z",
  },
];

// Function to get appropriate icon based on file extension
const getFileIcon = (filename: string) => {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "txt":
    case "docx":
    case "doc":
    case "pdf":
      return FileText;
    case "pptx":
    case "jpg":
    case "jpeg":
    case "png":
      return Image;
    case "xlsx":
    case "xls":
    case "csv":
      return FileSpreadsheet;
    case "js":
    case "ts":
    case "jsx":
    case "tsx":
      return FileCode;
    default:
      return File;
  }
};

// Convert flat documents array to tree structure
const buildDocumentTree = (docs: Document[]): TreeDataItem[] => {
  const itemMap = new Map<string, TreeDataItem>();
  const rootItems: TreeDataItem[] = [];

  // First pass: Create TreeDataItems for all documents
  for (const doc of docs) {
    const item: TreeDataItem = {
      id: doc.id,
      name: doc.name,
      icon: doc.type === "folder" ? Folder : getFileIcon(doc.name),
      children: doc.type === "folder" ? [] : undefined,
      metadata:
        doc.type === "file"
          ? {
              owner: (
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={doc.owner.avatar} alt={doc.owner.name} />
                    <AvatarFallback>{doc.owner.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span>{doc.owner.name}</span>
                </div>
              ),
              uploadTime: formatDistanceToNow(new Date(doc.uploadedAt), {
                addSuffix: true,
              }),
              size: doc.size,
            }
          : undefined,
      actions:
        doc.type === "folder" ? (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Implement new file creation
                console.log("Create new file in folder:", doc.id);
              }}
            >
              <Plus className="h-4 w-4" />
              New File
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement file actions menu
              console.log("Open actions for file:", doc.id);
            }}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        ),
    };
    itemMap.set(doc.id, item);
  }

  // Second pass: Build the tree structure
  for (const doc of docs) {
    const item = itemMap.get(doc.id);
    if (item) {
      if (doc.parentId) {
        const parent = itemMap.get(doc.parentId);
        if (parent?.children) {
          parent.children.push(item);
        }
      } else {
        rootItems.push(item);
      }
    }
  }

  return rootItems;
};

export const Route = createFileRoute("/dashboard/documents/")({
  component: DocumentsPage,
});

export default function DocumentsPage() {
  const documentTree = buildDocumentTree(documents);

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-end items-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="p-4">
              <FileUploader
                supabaseUrl={import.meta.env.VITE_SUPABASE_URL}
                supabaseAnonKey={import.meta.env.VITE_SUPABASE_ANON_KEY}
                bucketName="documents"
                onUploadComplete={(file) => {
                  console.log("Upload complete:", file);
                }}
                onUploadError={(error) => {
                  console.error("Upload error:", error);
                }}
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="mb-4 flex justify-between items-center mt-8">
        <div className="grid grid-cols-[2fr,1fr,1fr,100px,80px] gap-4 px-4 text-sm font-medium text-muted-foreground w-full">
          <div>Name</div>
          <div>Owner</div>
          <div>Last Modified</div>
          <div>Size</div>
          <div></div>
        </div>
      </div>
      <div className="rounded-lg border bg-card ">
        <TreeView
          data={documentTree}
          expandAll={false}
          defaultNodeIcon={Folder}
          defaultLeafIcon={File}
          className="[&_[role='treeitem']]:transition-colors [&_[role='treeitem']]:duration-200 [&_[role='treeitem']]:ease-in-out [&_[role='treeitem']]:rounded-md [&_[role='treeitem']]:hover:bg-accent/50"
        />
      </div>
    </div>
  );
}
