import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus, MagicWand } from "@phosphor-icons/react";

interface HeaderActionsProps {
  onCreateNew?: () => void;
  onExtend?: () => void;
  className?: string;
}

export function HeaderActions({
  onCreateNew,
  onExtend,
  className
}: HeaderActionsProps) {
  return (
    <div className={cn(
      "flex flex-col sm:flex-row gap-2 sm:gap-3",
      "px-4 pb-4 sm:px-6 md:px-8",
      className
    )}>
      <Button
        onClick={onCreateNew}
        variant="primary"
        size="default"
        className="w-full sm:w-auto"
      >
        <Plus className="w-4 h-4 mr-2" />
        Luo uusi
      </Button>
      <Button
        onClick={onExtend}
        variant="secondary"
        size="default"
        className="w-full sm:w-auto"
      >
        <MagicWand weight="duotone" className="w-4 h-4 mr-2" />
        Laajenna
      </Button>
    </div>
  );
}
