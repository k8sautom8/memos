import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (rows: number, cols: number) => void;
}

const TableDialog: React.FC<TableDialogProps> = ({ open, onOpenChange, onConfirm }) => {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);

  const handleConfirm = () => {
    if (rows > 0 && cols > 0 && rows <= 20 && cols <= 10) {
      onConfirm(rows, cols);
      onOpenChange(false);
      // Reset for next time
      setRows(3);
      setCols(3);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Insert Table</DialogTitle>
          <DialogDescription>Specify the number of rows and columns for your table.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="rows">Rows</Label>
              <Input
                id="rows"
                type="number"
                min="1"
                max="20"
                value={rows}
                onChange={(e) => setRows(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cols">Columns</Label>
              <Input
                id="cols"
                type="number"
                min="1"
                max="10"
                value={cols}
                onChange={(e) => setCols(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
              />
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Preview: {rows} row{rows !== 1 ? "s" : ""} × {cols} column{cols !== 1 ? "s" : ""}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Insert Table</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TableDialog;

