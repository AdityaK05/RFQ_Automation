import type { UserRole, RfqStatus, QuoteStatus, PriceType, EmailDirection, EmailFlag, RfqVendorStatus } from "@prisma/client";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
    };
  }
  interface User {
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}

export type NavItem = {
  id: string;
  label: string;
  icon: string;
  href: string;
  count?: number;
};

export type ItemRowData = {
  id: string;
  from: string;
  subject: string;
  preview: string;
  timestamp: string;
  isRead: boolean;
  tags?: string[];
  avatarFallback?: string;
};

export type ReadingPaneData = {
  id: string;
  from: string;
  fromEmail: string;
  to: string;
  subject: string;
  timestamp: string;
  body: string;
  tags?: string[];
  attachments?: { filename: string; url?: string; size?: number }[];
};

export type ComposeFormData = {
  to: string;
  subject: string;
  body: string;
};

export type FormFieldOption = {
  label: string;
  value: string;
};

export type FormFieldConfig = {
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "url" | "number" | "date" | "select" | "textarea" | "checkbox";
  placeholder?: string;
  options?: FormFieldOption[];
  required?: boolean;
  disabled?: boolean;
  defaultValue?: string | number | boolean;
  gridSpan?: 1 | 2;
  helperText?: string;
};

export type VendorRecord = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  website?: string | null;
  category?: string | null;
  address?: string | null;
  gstin?: string | null;
  isActive: boolean;
  rating: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  rfqCount?: number;
};

export type RfqItemInput = {
  id?: string;
  lineNumber: number;
  description: string;
  partNumber?: string;
  quantity: number;
  unit: string;
  specs?: string;
  targetPrice?: number;
};

export type RfqVendorSummary = {
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  status: RfqVendorStatus;
  sentAt?: string | null;
  respondedAt?: string | null;
};

export type RfqRecord = {
  id: string;
  number: string;
  title: string;
  description?: string | null;
  status: RfqStatus;
  dueDate?: string | null;
  awardedAt?: string | null;
  currency: string;
  totalBudget?: number | null;
  items: RfqItemInput[];
  vendors: RfqVendorSummary[];
  createdAt: string;
  updatedAt: string;
};

export type RfqComposePayload = {
  title: string;
  number?: string;
  description?: string;
  dueDate?: string;
  currency: string;
  vendorIds: string[];
  items: RfqItemInput[];
  status?: RfqStatus;
};

export type { UserRole, RfqStatus, QuoteStatus, PriceType, EmailDirection, EmailFlag, RfqVendorStatus };
