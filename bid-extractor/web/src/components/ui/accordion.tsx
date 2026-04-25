import { ChevronDown } from "lucide-react";
import { createContext, useContext, useState, type ReactNode } from "react";

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
      <div className={cn("divide-y divide-border", className)}>{children}</div>
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
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        className,
      )}
      data-state={open === value ? "open" : "closed"}
      onClick={() => toggle(value)}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
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
  if (open !== value) return null;
  return (
    <div className={cn("pb-4 pt-0 text-sm", className)}>{children}</div>
  );
}
