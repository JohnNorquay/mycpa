"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        classNames: {
          toast: "dark:bg-gray-800 dark:border-gray-700",
          title: "dark:text-white",
          description: "dark:text-gray-400",
        },
      }}
    />
  );
}
