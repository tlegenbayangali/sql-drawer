"use client";

import { useState } from "react";
import { useDiagramStore } from "@/lib/stores/diagram-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import type { Column, IndexType } from "@/lib/types/database";
import {
  DATA_TYPE_GROUPS,
  type MySQLDataType,
} from "@/lib/constants/mysql-types";
import { Settings, Trash2 } from "lucide-react";

interface ColumnAttributesPopoverProps {
  column: Column;
}

export function ColumnAttributesPopover({
  column,
}: ColumnAttributesPopoverProps) {
  const updateColumn = useDiagramStore((state) => state.updateColumn);
  const deleteColumn = useDiagramStore((state) => state.deleteColumn);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDataTypeChange = (dataType: MySQLDataType) => {
    updateColumn(column.id, { dataType });
  };

  const handleIndexTypeChange = (indexType: IndexType) => {
    updateColumn(column.id, { indexType });
  };

  const handleNullableChange = (nullable: boolean) => {
    updateColumn(column.id, { nullable });
  };

  const handleAutoIncrementChange = (autoIncrement: boolean) => {
    updateColumn(column.id, { autoIncrement });
  };

  const handleUnsignedChange = (unsigned: boolean) => {
    updateColumn(column.id, { unsigned });
  };

  const handleDefaultValueChange = (defaultValue: string) => {
    updateColumn(column.id, { defaultValue: defaultValue || null });
  };

  const handleCommentChange = (comment: string) => {
    updateColumn(column.id, { comment: comment || null });
  };

  const handleDelete = () => {
    deleteColumn(column.id);
    setShowDeleteDialog(false);
    setOpen(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1.5 h-7 text-xs">
            <Settings className="h-3.5 w-3.5" />
            Attributes
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-80 max-h-[300px] overflow-y-auto"
          align="end"
          side="bottom"
          sideOffset={8}
          avoidCollisions={true}
          collisionPadding={20}
        >
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Attributes</h4>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor={`type-${column.id}`} className="text-sm">
                  Type
                </Label>
                <Select
                  value={column.dataType}
                  onValueChange={handleDataTypeChange}
                >
                  <SelectTrigger
                    id={`type-${column.id}`}
                    className="h-8 text-sm"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DATA_TYPE_GROUPS).map(([group, types]) => (
                      <div key={group}>
                        <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                          {group}
                        </div>
                        {types.map((type) => (
                          <SelectItem
                            key={type}
                            value={type}
                            className="text-xs"
                          >
                            {type}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`index-${column.id}`} className="text-sm">
                  Index
                </Label>
                <Select
                  value={column.indexType || "None"}
                  onValueChange={handleIndexTypeChange}
                >
                  <SelectTrigger
                    id={`index-${column.id}`}
                    className="h-8 text-sm"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="None" className="text-xs">
                      None
                    </SelectItem>
                    <SelectItem value="PK" className="text-xs">
                      Primary Key
                    </SelectItem>
                    <SelectItem value="FK" className="text-xs">
                      Foreign Key
                    </SelectItem>
                    <SelectItem value="UK" className="text-xs">
                      Unique Key
                    </SelectItem>
                    <SelectItem value="Index" className="text-xs">
                      Index
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <h4 className="font-medium text-sm">Column Attributes</h4>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`nullable-${column.id}`}
                  checked={column.nullable}
                  onCheckedChange={handleNullableChange}
                  className="h-4 w-4"
                />
                <Label
                  htmlFor={`nullable-${column.id}`}
                  className="cursor-pointer text-sm"
                >
                  Nullable
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`auto-increment-${column.id}`}
                  checked={column.autoIncrement}
                  onCheckedChange={handleAutoIncrementChange}
                  className="h-4 w-4"
                />
                <Label
                  htmlFor={`auto-increment-${column.id}`}
                  className="cursor-pointer text-sm"
                >
                  Auto Increment
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`unsigned-${column.id}`}
                  checked={column.unsigned}
                  onCheckedChange={handleUnsignedChange}
                  className="h-4 w-4"
                />
                <Label
                  htmlFor={`unsigned-${column.id}`}
                  className="cursor-pointer text-sm"
                >
                  Unsigned
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`default-${column.id}`} className="text-sm">
                  Default Value
                </Label>
                <Input
                  id={`default-${column.id}`}
                  value={column.defaultValue || ""}
                  onChange={(e) => handleDefaultValueChange(e.target.value)}
                  placeholder="NULL"
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`comment-${column.id}`} className="text-sm">
                  Comment
                </Label>
                <Input
                  id={`comment-${column.id}`}
                  value={column.comment || ""}
                  onChange={(e) => handleCommentChange(e.target.value)}
                  placeholder="Column description"
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <Separator />

            <Button
              variant="destructive"
              size="sm"
              className="w-full gap-2"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete Column
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Column</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the column &quot;{column.name}
              &quot;? This will also remove any relationships connected to this
              column.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
