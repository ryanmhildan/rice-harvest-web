/**
 * components/ui/button.tsx
 * ================================================================
 * Komponen Button reusable dengan beberapa variant.
 *
 * KONSEP REACT YANG DIPAKAI DI SINI:
 *   1. forwardRef — meneruskan ref ke elemen <button> di dalam,
 *      penting kalau parent component ingin akses DOM langsung.
 *   2. ComponentProps<"button"> — TypeScript trick untuk inherit
 *      semua prop standar HTML button (onClick, type, disabled, dll)
 *      tanpa harus tulis manual satu-satu.
 *   3. Discriminated union via variant — type-safe enum di TypeScript.
 * ================================================================
 */
import { forwardRef, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "default"     // primary action - hijau
  | "secondary"   // secondary action - abu
  | "destructive" // delete/cancel - merah
  | "outline"     // outline only
  | "ghost";      // transparent, hover saja

export type ButtonSize = "default" | "sm" | "lg";

interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

// Tailwind class per variant
const variantClasses: Record<ButtonVariant, string> = {
  default:     "bg-green-700 text-white hover:bg-green-800 focus:ring-green-500",
  secondary:   "bg-slate-200 text-slate-900 hover:bg-slate-300 focus:ring-slate-400",
  destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  outline:     "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 focus:ring-slate-400",
  ghost:       "text-slate-700 hover:bg-slate-100 focus:ring-slate-400",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-10 px-4 py-2 text-sm",
  sm:      "h-8 px-3 py-1 text-xs",
  lg:      "h-12 px-6 py-3 text-base",
};

/**
 * Button dengan variant Tailwind.
 *
 * Contoh:
 *   <Button variant="default" size="lg" onClick={handleSubmit}>
 *     Mulai Stitching
 *   </Button>
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles - selalu ada
          "inline-flex items-center justify-center gap-2 rounded-md font-medium",
          "transition-colors focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          // Variant & size
          variantClasses[variant],
          sizeClasses[size],
          // Tambahan custom dari user
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
