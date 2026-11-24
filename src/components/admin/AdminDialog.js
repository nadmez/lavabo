import { useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

export default function AdminDialog({
  open,
  onOpenChange,
  title,
  children,
  size = "md",
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(event) {
      if (event.key === "Escape") onOpenChange(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const width =
    size === "lg" ? "w-[min(100%-2rem,36rem)]" : "w-[min(100%-2rem,28rem)]";
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-stone-950/60" />
        <Dialog.Content
          aria-describedby={undefined}
          className={`fixed left-1/2 top-1/2 max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded bg-white p-6 shadow-lg ${width}`}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <Dialog.Title className="text-lg font-semibold">
              {title}
            </Dialog.Title>
            <button
              type="button"
              aria-label="Kapat"
              onClick={() => onOpenChange(false)}
              className="rounded p-2 hover:bg-stone-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
