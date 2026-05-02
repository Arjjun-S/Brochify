"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface SelectBoxProps {
  value?: string;
  onChange?: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  name?: string;
}

export function SelectBox({ 
  value, 
  onChange, 
  options, 
  placeholder = "Select an option", 
  className, 
  disabled,
  name 
}: SelectBoxProps) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onChange} disabled={disabled} name={name}>
      <SelectPrimitive.Trigger
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-xl border border-slate-200/70 bg-white/60 px-4 py-2 text-sm text-slate-800 shadow-sm ring-offset-white transition-all hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-50 backdrop-blur-xl",
          className
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="h-4 w-4 opacity-60" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className="relative z-50 min-w-[8rem] overflow-hidden rounded-xl border border-slate-200/70 bg-white/90 text-slate-800 shadow-2xl backdrop-blur-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
          position="popper"
          sideOffset={8}
        >
          <SelectPrimitive.Viewport className="p-1.5 w-full min-w-[var(--radix-select-trigger-width)]">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className="relative flex w-full cursor-pointer select-none items-center rounded-lg py-2.5 pl-9 pr-3 text-sm font-medium outline-none focus:bg-indigo-50 focus:text-indigo-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors"
              >
                <span className="absolute left-3 flex h-3.5 w-3.5 items-center justify-center">
                  <SelectPrimitive.ItemIndicator>
                    <Check className="h-4 w-4 text-indigo-600" />
                  </SelectPrimitive.ItemIndicator>
                </span>
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
