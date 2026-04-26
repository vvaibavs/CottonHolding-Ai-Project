import { ChevronDown } from "lucide-react";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface AccordionCtx {
  open: string | null;
  toggle: (value: string) => void;
}
const Ctx = createContext<AccordionCtx>({ open: null, toggle: () => {} });

export function Accordion({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const toggle = (v: string) => setOpen((prev) => (prev === v ? null : v));
  return (
    <Ctx.Provider value={{ open, toggle }}>
      <div className={cn("divide-y divide-white/[0.04]", className)}>{children}</div>
    </Ctx.Provider>
  );
}

export function AccordionItem({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className} data-value={value}>
      {children}
    </div>
  );
}

export function AccordionTrigger({
  children,
  value,
  className,
}: {
  children: ReactNode;
  value: string;
  className?: string;
}) {
  const { open, toggle } = useContext(Ctx);
  const isOpen = open === value;
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center justify-between py-4 text-left font-medium transition-colors duration-200 hover:text-foreground",
        isOpen ? "text-foreground" : "text-foreground/70",
        className,
      )}
      data-state={isOpen ? "open" : "closed"}
      onClick={() => toggle(value)}
    >
      {children}
      <ChevronDown
        className={cn(
          "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300",
          isOpen && "rotate-180",
        )}
      />
    </button>
  );
}

export function AccordionContent({
  children,
  value,
  className,
}: {
  children: ReactNode;
  value: string;
  className?: string;
}) {
  const { open } = useContext(Ctx);
  const isOpen = open === value;
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    } else {
      setHeight(0);
    }
  }, [isOpen]);

  return (
    <div
      className="overflow-hidden transition-[height,opacity] duration-300 ease-out"
      style={{ height, opacity: isOpen ? 1 : 0 }}
    >
      <div ref={contentRef} className={cn("pb-4 pt-0 text-sm", className)}>
        {children}
      </div>
    </div>
  );
}
