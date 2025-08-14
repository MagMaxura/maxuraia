import React from 'react';
import { cn } from "@/lib/utils";

// Placeholder components for Dialog
const Dialog = ({ children, open, onOpenChange }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl mx-auto" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

const DialogContent = ({ children, className, ...props }) => (
  <div className={`relative ${className}`} {...props}>
    {children}
  </div>
);

const DialogHeader = ({ children, className, ...props }) => (
  <div className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`} {...props}>
    {children}
  </div>
);

const DialogTitle = ({ children, className, ...props }) => (
  <h2 className={`text-lg font-semibold leading-none tracking-tight ${className}`} {...props}>
    {children}
  </h2>
);

const DialogDescription = ({ children, className, ...props }) => (
  <p className={`text-sm text-muted-foreground ${className}`} {...props}>
    {children}
  </p>
);

const DialogFooter = ({ className, ...props }) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter };
