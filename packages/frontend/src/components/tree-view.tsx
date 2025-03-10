import React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronRight } from "lucide-react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const treeVariants = cva(
  "group hover:before:opacity-100 before:absolute before:rounded-lg before:left-0 px-2 before:w-full before:opacity-0 before:bg-accent/70 before:h-[2rem] before:-z-10"
);

const selectedTreeVariants = cva(
  "before:opacity-100 before:bg-accent/70 text-accent-foreground"
);

interface TreeDataItem {
  id: string;
  name: string;
  icon?: React.ComponentType<{ className?: string }>;
  selectedIcon?: React.ComponentType<{ className?: string }>;
  openIcon?: React.ComponentType<{ className?: string }>;
  children?: TreeDataItem[];

  actions?: React.ReactNode;
  onClick?: () => void;
  metadata?: {
    owner?: React.ReactNode;
    uploadTime?: React.ReactNode;
    size?: string;
    signatures?: number;
  };
}

type TreeProps = React.HTMLAttributes<HTMLDivElement> & {
  data: TreeDataItem[] | TreeDataItem;
  initialSelectedItemId?: string;
  onSelect?: (item: TreeDataItem) => void;
  onMouseEnter?: (item: TreeDataItem) => void;
  expandAll?: boolean;
  defaultNodeIcon?: React.ComponentType<{ className?: string }>;
  defaultLeafIcon?: React.ComponentType<{ className?: string }>;
};

const TreeView = React.forwardRef<HTMLDivElement, TreeProps>(
  (
    {
      data,
      initialSelectedItemId,
      onSelect,
      onMouseEnter,
      expandAll,
      defaultLeafIcon,
      defaultNodeIcon,
      className,
      ...props
    },
    ref
  ) => {
    const [selectedItemId, setSelectedItemId] = React.useState<
      string | undefined
    >(initialSelectedItemId);

    const handleSelectChange = React.useCallback(
      (item: TreeDataItem | undefined) => {
        setSelectedItemId(item?.id);
        if (onSelect) {
          onSelect(item as TreeDataItem);
        }
      },
      [onSelect]
    );

    const expandedItemIds = React.useMemo(() => {
      if (!initialSelectedItemId) {
        return [] as string[];
      }

      const ids: string[] = [];

      function walkTreeItems(
        items: TreeDataItem[] | TreeDataItem,
        targetId: string
      ) {
        if (items instanceof Array) {
          for (let i = 0; i < items.length; i++) {
            ids.push(items[i]!.id);
            if (walkTreeItems(items[i]!, targetId) && !expandAll) {
              return true;
            }
            if (!expandAll) ids.pop();
          }
        } else if (!expandAll && items.id === targetId) {
          return true;
        } else if (items.children) {
          return walkTreeItems(items.children, targetId);
        }
      }

      walkTreeItems(data, initialSelectedItemId);
      return ids;
    }, [data, expandAll, initialSelectedItemId]);

    return (
      <div className={cn("overflow-hidden relative p-2", className)}>
        <TreeItem
          data={data}
          ref={ref}
          selectedItemId={selectedItemId}
          handleSelectChange={handleSelectChange}
          expandedItemIds={expandedItemIds}
          defaultLeafIcon={defaultLeafIcon}
          defaultNodeIcon={defaultNodeIcon}
          onMouseEnter={onMouseEnter}
          {...props}
        />
      </div>
    );
  }
);
TreeView.displayName = "TreeView";

type TreeItemProps = TreeProps & {
  selectedItemId?: string;
  handleSelectChange: (item: TreeDataItem | undefined) => void;
  expandedItemIds: string[];
  defaultNodeIcon?: React.ComponentType<{ className?: string }>;
  defaultLeafIcon?: React.ComponentType<{ className?: string }>;
  onMouseEnter?: (item: TreeDataItem) => void;
};

const TreeItem = React.forwardRef<HTMLDivElement, TreeItemProps>(
  (
    {
      className,
      data,
      selectedItemId,
      handleSelectChange,
      expandedItemIds,
      defaultNodeIcon,
      defaultLeafIcon,
      onMouseEnter,
      ...props
    },
    ref
  ) => {
    if (!Array.isArray(data)) {
      data = [data];
    }
    return (
      <div ref={ref} role="tree" className={className} {...props}>
        <ul>
          {data.map((item) => (
            <li key={item.id}>
              {item.children ? (
                <TreeNode
                  item={item}
                  selectedItemId={selectedItemId}
                  expandedItemIds={expandedItemIds}
                  handleSelectChange={handleSelectChange}
                  defaultNodeIcon={defaultNodeIcon}
                  defaultLeafIcon={defaultLeafIcon}
                  onMouseEnter={onMouseEnter}
                />
              ) : (
                <TreeLeaf
                  item={item}
                  selectedItemId={selectedItemId}
                  handleSelectChange={handleSelectChange}
                  defaultLeafIcon={defaultLeafIcon}
                  onMouseEnter={onMouseEnter}
                />
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  }
);
TreeItem.displayName = "TreeItem";

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header>
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 w-full items-center py-2 transition-all",
        className
      )}
      {...props}
    >
      {children}
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));

const TreeNode = ({
  item,
  handleSelectChange,
  expandedItemIds,
  selectedItemId,
  defaultNodeIcon,
  defaultLeafIcon,
  onMouseEnter,
}: {
  item: TreeDataItem;
  handleSelectChange: (item: TreeDataItem | undefined) => void;
  expandedItemIds: string[];
  selectedItemId?: string;
  defaultNodeIcon?: React.ComponentType<{ className?: string }>;
  defaultLeafIcon?: React.ComponentType<{ className?: string }>;
  onMouseEnter?: (item: TreeDataItem) => void;
}) => {
  const [value, setValue] = React.useState(
    expandedItemIds.includes(item.id) ? [item.id] : []
  );
  return (
    <AccordionPrimitive.Root
      type="multiple"
      value={value}
      onValueChange={(s) => setValue(s)}
    >
      <AccordionPrimitive.Item value={item.id}>
        <AccordionTrigger
          className={cn(
            "grid grid-cols-[2fr,1fr,1fr,100px,80px] gap-4 items-center",
            treeVariants(),
            selectedItemId === item.id && selectedTreeVariants()
          )}
          onClick={() => {
            handleSelectChange(item);
            item.onClick?.();
          }}
          onMouseEnter={() => onMouseEnter?.(item)}
        >
          <div className="flex items-center min-w-0 relative">
            <ChevronRight
              className={cn(
                "h-4 w-4 shrink-0 transition-transform duration-200 text-accent-foreground/50 mr-1 absolute -left-5",
                value.includes(item.id) && "rotate-90"
              )}
            />
            <TreeIcon
              item={item}
              isSelected={selectedItemId === item.id}
              isOpen={value.includes(item.id)}
              default={defaultNodeIcon}
            />
            <span className="text-sm truncate">{item.name}</span>
          </div>
          <div className="text-sm text-muted-foreground">-</div>
          <div className="text-sm text-muted-foreground">-</div>
          <div className="text-sm text-muted-foreground">-</div>
          <div className="flex justify-end">
            <TreeActions isSelected={selectedItemId === item.id}>
              {item.actions}
            </TreeActions>
          </div>
        </AccordionTrigger>
        <AccordionContent className="ml-4 ">
          <TreeItem
            data={item.children ? item.children : item}
            selectedItemId={selectedItemId}
            handleSelectChange={handleSelectChange}
            expandedItemIds={expandedItemIds}
            defaultLeafIcon={defaultLeafIcon}
            defaultNodeIcon={defaultNodeIcon}
            onMouseEnter={onMouseEnter}
            className="ml-4"
          />
        </AccordionContent>
      </AccordionPrimitive.Item>
    </AccordionPrimitive.Root>
  );
};

const TreeLeaf = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    item: TreeDataItem;
    selectedItemId?: string;
    handleSelectChange: (item: TreeDataItem | undefined) => void;
    defaultLeafIcon?: React.ComponentType<{ className?: string }>;
    onMouseEnter?: (item: TreeDataItem) => void;
  }
>(
  (
    {
      className,
      item,
      selectedItemId,
      handleSelectChange,
      defaultLeafIcon,
      onMouseEnter,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "grid grid-cols-[2fr,1fr,1fr,100px,80px] gap-4 items-center justify-center py-2 cursor-pointer rounded-md hover:bg-accent/70 transition-colors duration-200 ease-in-out",
          treeVariants(),
          className,
          selectedItemId === item.id && selectedTreeVariants()
        )}
        onClick={() => {
          handleSelectChange(item);
          item.onClick?.();
        }}
        onMouseEnter={() => onMouseEnter?.(item)}
        {...props}
      >
        <div className="flex items-center min-w-0">
          <TreeIcon
            item={item}
            isSelected={selectedItemId === item.id}
            default={defaultLeafIcon}
          />
          <span className="text-sm truncate">{item.name}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Avatar className="size-8 mr-2">
            <AvatarImage
              src={item.metadata?.owner}
              alt={item.metadata?.owner}
            />
            <AvatarFallback>
              {item.metadata?.owner?.toString().charAt(0)}
            </AvatarFallback>
          </Avatar>
          {item.metadata?.owner}
        </div>
        <div className="text-sm text-muted-foreground">
          {item.metadata?.uploadTime}
        </div>
        <div className="text-sm text-muted-foreground">
          {item.metadata?.signatures === 0
            ? "Без подписей"
            : `${item.metadata?.signatures} ${
                item.metadata?.signatures === 1 ? "подпись" : "подписи"
              }`}
        </div>
        <div className="flex justify-end">
          <TreeActions isSelected={selectedItemId === item.id}>
            {item.actions}
          </TreeActions>
        </div>
      </div>
    );
  }
);
TreeLeaf.displayName = "TreeLeaf";

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={cn(
      "overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
      className
    )}
    {...props}
  >
    <div className="pb-1 pt-0">{children}</div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

const TreeIcon = ({
  item,
  isOpen,
  isSelected,
  default: defaultIcon,
}: {
  item: TreeDataItem;
  isOpen?: boolean;
  isSelected?: boolean;
  default?: React.ComponentType<{ className?: string }>;
}) => {
  let Icon = defaultIcon;
  if (isSelected && item.selectedIcon) {
    Icon = item.selectedIcon;
  } else if (isOpen && item.openIcon) {
    Icon = item.openIcon;
  } else if (item.icon) {
    Icon = item.icon;
  }
  return Icon ? <Icon className="h-4 w-4 shrink-0 mr-2" /> : <></>;
};

const TreeActions = ({
  children,
  isSelected,
}: {
  children: React.ReactNode;
  isSelected: boolean;
}) => {
  return (
    <div
      className={cn(
        isSelected ? "opacity-100" : "opacity-0",
        "group-hover:opacity-100 transition-opacity duration-200"
      )}
    >
      {children}
    </div>
  );
};

export { TreeView, type TreeDataItem };
