import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/layout/Providers";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "RFQPilot — Smart Procurement",
  description:
    "Gmail-style procurement platform: manage RFQs, vendor quotes, and purchase orders in one unified inbox.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <TooltipProvider>{children}</TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
