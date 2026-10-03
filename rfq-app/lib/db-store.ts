import { prisma } from "@/lib/prisma";
import type { VendorRecord, RfqRecord, RfqComposePayload, RfqStatus, RfqVendorStatus } from "@/lib/types";

let mockVendors: VendorRecord[] = [
  {
    id: "v-1",
    name: "Acme Supplies",
    email: "quotes@acme-supplies.com",
    phone: "+91 98765 43210",
    website: "https://acme-supplies.com",
    category: "Metals & Fasteners",
    address: "Plot 42, MIDC Industrial Area, Pune",
    gstin: "27AAPCA1234A1Z5",
    isActive: true,
    rating: 4,
    notes: "Primary supplier for standard grade SS and MS fasteners.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rfqCount: 8,
  },
  {
    id: "v-2",
    name: "Global Parts Co.",
    email: "sunita@globalparts.in",
    phone: "+91 77654 32109",
    website: "https://globalparts.in",
    category: "Hydraulics & Pneumatics",
    address: "Peenya Industrial Estate, Bengaluru",
    gstin: "29AABCG5678B1Z3",
    isActive: true,
    rating: 5,
    notes: "High reliability supplier for hydraulic hoses, valves and cylinders.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rfqCount: 5,
  },
  {
    id: "v-3",
    name: "TechFab Industries",
    email: "arun@techfab.co.in",
    phone: "+91 88765 43210",
    website: "https://techfab.co.in",
    category: "Sheet Metal Fabrication",
    address: "Ambattur Industrial Estate, Chennai",
    gstin: "33AABCT9876C1Z2",
    isActive: true,
    rating: 4,
    notes: "Precision CNC cutting, bending, and powder coating.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rfqCount: 12,
  },
  {
    id: "v-4",
    name: "Eastern Fasteners",
    email: "priya@easternfast.com",
    phone: "+91 99887 76655",
    website: "https://easternfast.com",
    category: "Fasteners & Hardware",
    address: "Sector 58, Faridabad, Haryana",
    gstin: "06AABCE1122D1Z8",
    isActive: false,
    rating: 3,
    notes: "Secondary vendor for bulk bolts and spring washers.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rfqCount: 3,
  },
];

let mockRfqs: RfqRecord[] = [
  {
    id: "rfq-1024",
    number: "RFQ-1024",
    title: "Steel Brackets – Grade 304 SS",
    description: "Grade 304 stainless steel brackets and M8 hex bolts for conveyor assembly line.",
    status: "RECEIVED" as RfqStatus,
    dueDate: "2026-10-10",
    currency: "INR",
    totalBudget: 150000,
    items: [
      {
        id: "item-1",
        lineNumber: 1,
        description: "Steel Bracket Type-A (Grade 304 SS)",
        partNumber: "PMW-SB-304-A",
        quantity: 500,
        unit: "PCS",
        specs: "Tolerance ±0.02mm, surface finish Ra 1.6",
        targetPrice: 180,
      },
      {
        id: "item-2",
        lineNumber: 2,
        description: "M8 × 25 Hex Bolt (SS 304)",
        partNumber: "PMW-HB-M8-25",
        quantity: 2000,
        unit: "PCS",
        specs: "DIN 933, full thread",
        targetPrice: 12,
      },
    ],
    vendors: [
      {
        vendorId: "v-1",
        vendorName: "Acme Supplies",
        vendorEmail: "quotes@acme-supplies.com",
        status: "QUOTED" as RfqVendorStatus,
        sentAt: "2026-09-20T10:00:00Z",
        respondedAt: "2026-09-22T14:30:00Z",
      },
      {
        vendorId: "v-3",
        vendorName: "TechFab Industries",
        vendorEmail: "arun@techfab.co.in",
        status: "QUOTED" as RfqVendorStatus,
        sentAt: "2026-09-20T10:00:00Z",
        respondedAt: "2026-09-23T09:15:00Z",
      },
      {
        vendorId: "v-2",
        vendorName: "Global Parts Co.",
        vendorEmail: "sunita@globalparts.in",
        status: "SENT" as RfqVendorStatus,
        sentAt: "2026-09-20T10:00:00Z",
      },
    ],
    createdAt: "2026-09-20T09:00:00Z",
    updatedAt: "2026-09-23T09:15:00Z",
  },
  {
    id: "rfq-1023",
    number: "RFQ-1023",
    title: "Hydraulic Fittings & Couplers",
    description: "High pressure quick-release fittings and hydraulic return line couplers.",
    status: "PARTIAL" as RfqStatus,
    dueDate: "2026-10-05",
    currency: "INR",
    totalBudget: 60000,
    items: [
      {
        id: "item-3",
        lineNumber: 1,
        description: "1/2 inch Quick Release Hydraulic Coupler",
        partNumber: "QRC-HYD-050",
        quantity: 120,
        unit: "PCS",
        specs: "Working pressure 350 bar, ISO 7241-1 Series A",
        targetPrice: 450,
      },
    ],
    vendors: [
      {
        vendorId: "v-2",
        vendorName: "Global Parts Co.",
        vendorEmail: "sunita@globalparts.in",
        status: "QUOTED" as RfqVendorStatus,
        sentAt: "2026-09-18T11:00:00Z",
        respondedAt: "2026-09-21T16:00:00Z",
      },
      {
        vendorId: "v-4",
        vendorName: "Eastern Fasteners",
        vendorEmail: "priya@easternfast.com",
        status: "SENT" as RfqVendorStatus,
        sentAt: "2026-09-18T11:00:00Z",
      },
    ],
    createdAt: "2026-09-18T10:30:00Z",
    updatedAt: "2026-09-21T16:00:00Z",
  },
  {
    id: "rfq-1021",
    number: "RFQ-1021",
    title: "Custom Sheet Metal Enclosures",
    description: "IP65 weatherproof control box cabinets for automation drives.",
    status: "AWARDED" as RfqStatus,
    dueDate: "2026-09-15",
    awardedAt: "2026-09-16T12:00:00Z",
    currency: "INR",
    totalBudget: 220000,
    items: [
      {
        id: "item-4",
        lineNumber: 1,
        description: "IP65 Electrical Control Enclosure 600x400x250",
        partNumber: "ENC-IP65-642",
        quantity: 40,
        unit: "PCS",
        specs: "1.6mm CRCA sheet, RAL 7035 powder coating, polyurethane gasket",
        targetPrice: 4200,
      },
    ],
    vendors: [
      {
        vendorId: "v-3",
        vendorName: "TechFab Industries",
        vendorEmail: "arun@techfab.co.in",
        status: "QUOTED" as RfqVendorStatus,
        sentAt: "2026-09-10T09:00:00Z",
        respondedAt: "2026-09-12T17:00:00Z",
      },
    ],
    createdAt: "2026-09-10T08:30:00Z",
    updatedAt: "2026-09-16T12:00:00Z",
  },
  {
    id: "rfq-1020",
    number: "RFQ-1020",
    title: "Pneumatic Cylinders 50mm Bore",
    description: "Double acting pneumatic cylinders with magnetic sensor brackets.",
    status: "DRAFT" as RfqStatus,
    dueDate: "2026-10-20",
    currency: "INR",
    totalBudget: 85000,
    items: [
      {
        id: "item-5",
        lineNumber: 1,
        description: "ISO 15552 Pneumatic Cylinder 50 Bore x 200 Stroke",
        partNumber: "PNC-50-200-DA",
        quantity: 25,
        unit: "PCS",
        specs: "Cushioned, magnetic piston, PU seals",
        targetPrice: 2800,
      },
    ],
    vendors: [],
    createdAt: "2026-09-08T14:00:00Z",
    updatedAt: "2026-09-08T14:00:00Z",
  },
];

async function isDatabaseAvailable(): Promise<boolean> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.includes("placeholder")) return false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export async function fetchAllVendors(): Promise<VendorRecord[]> {
  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    try {
      const records = await prisma.vendor.findMany({
        include: {
          _count: {
            select: { rfqVendors: true },
          },
        },
        orderBy: { name: "asc" },
      });
      return records.map((v) => ({
        id: v.id,
        name: v.name,
        email: v.email,
        phone: v.phone,
        website: v.website,
        category: v.category,
        address: v.address,
        gstin: v.gstin,
        isActive: v.isActive,
        rating: v.rating,
        notes: v.notes,
        createdAt: v.createdAt.toISOString(),
        updatedAt: v.updatedAt.toISOString(),
        rfqCount: v._count.rfqVendors,
      }));
    } catch {
      return [...mockVendors];
    }
  }
  return [...mockVendors];
}

export async function createVendorRecord(data: Omit<VendorRecord, "id" | "createdAt" | "updatedAt" | "rfqCount">): Promise<VendorRecord> {
  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    try {
      const created = await prisma.vendor.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          website: data.website || null,
          category: data.category || null,
          address: data.address || null,
          gstin: data.gstin || null,
          isActive: data.isActive ?? true,
          rating: Number(data.rating) || 0,
          notes: data.notes || null,
        },
      });
      return {
        id: created.id,
        name: created.name,
        email: created.email,
        phone: created.phone,
        website: created.website,
        category: created.category,
        address: created.address,
        gstin: created.gstin,
        isActive: created.isActive,
        rating: created.rating,
        notes: created.notes,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
        rfqCount: 0,
      };
    } catch {
      // fallback to mock
    }
  }

  const newVendor: VendorRecord = {
    ...data,
    id: `v-${Date.now()}`,
    rating: Number(data.rating) || 0,
    isActive: data.isActive ?? true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rfqCount: 0,
  };
  mockVendors = [newVendor, ...mockVendors];
  return newVendor;
}

export async function updateVendorRecord(id: string, data: Partial<VendorRecord>): Promise<VendorRecord | null> {
  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    try {
      const updated = await prisma.vendor.update({
        where: { id },
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          website: data.website,
          category: data.category,
          address: data.address,
          gstin: data.gstin,
          isActive: data.isActive,
          rating: data.rating !== undefined ? Number(data.rating) : undefined,
          notes: data.notes,
        },
      });
      return {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        website: updated.website,
        category: updated.category,
        address: updated.address,
        gstin: updated.gstin,
        isActive: updated.isActive,
        rating: updated.rating,
        notes: updated.notes,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    } catch {
      // fallback to mock
    }
  }

  const index = mockVendors.findIndex((v) => v.id === id);
  if (index === -1) return null;
  mockVendors[index] = {
    ...mockVendors[index],
    ...data,
    rating: data.rating !== undefined ? Number(data.rating) : mockVendors[index].rating,
    updatedAt: new Date().toISOString(),
  };
  return mockVendors[index];
}

export async function deleteVendorRecord(id: string): Promise<boolean> {
  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    try {
      await prisma.vendor.delete({ where: { id } });
      return true;
    } catch {
      // fallback to mock
    }
  }

  const initialLength = mockVendors.length;
  mockVendors = mockVendors.filter((v) => v.id !== id);
  return mockVendors.length < initialLength;
}

export async function fetchAllRfqs(): Promise<RfqRecord[]> {
  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    try {
      const records = await prisma.rfq.findMany({
        include: {
          items: true,
          rfqVendors: {
            include: { vendor: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return records.map((r) => ({
        id: r.id,
        number: r.number,
        title: r.title,
        description: r.description,
        status: r.status,
        dueDate: r.dueDate ? r.dueDate.toISOString().split("T")[0] : null,
        awardedAt: r.awardedAt ? r.awardedAt.toISOString() : null,
        currency: r.currency,
        totalBudget: r.totalBudget ? Number(r.totalBudget) : null,
        items: r.items.map((it) => ({
          id: it.id,
          lineNumber: it.lineNumber,
          description: it.description,
          partNumber: it.partNumber || undefined,
          quantity: Number(it.quantity),
          unit: it.unit,
          specs: it.specs || undefined,
          targetPrice: it.targetPrice ? Number(it.targetPrice) : undefined,
        })),
        vendors: r.rfqVendors.map((rv) => ({
          vendorId: rv.vendorId,
          vendorName: rv.vendor.name,
          vendorEmail: rv.vendor.email,
          status: rv.status,
          sentAt: rv.sentAt ? rv.sentAt.toISOString() : null,
          respondedAt: rv.respondedAt ? rv.respondedAt.toISOString() : null,
        })),
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }));
    } catch {
      return [...mockRfqs];
    }
  }
  return [...mockRfqs];
}

export async function createRfqRecord(payload: RfqComposePayload): Promise<RfqRecord> {
  const vendorIds = Array.isArray(payload.vendorIds) ? payload.vendorIds : [];
  const items = Array.isArray(payload.items) ? payload.items : [];
  const generatedNumber = payload.number || `RFQ-${Math.floor(1000 + Math.random() * 9000)}`;
  const initialStatus = payload.status || (vendorIds.length > 0 ? ("SENT" as RfqStatus) : ("DRAFT" as RfqStatus));

  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    try {
      const created = await prisma.rfq.create({
        data: {
          number: generatedNumber,
          title: payload.title,
          description: payload.description || null,
          status: initialStatus,
          currency: payload.currency || "INR",
          dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
          items: {
            create: payload.items.map((item, idx) => ({
              lineNumber: idx + 1,
              description: item.description,
              partNumber: item.partNumber || null,
              quantity: item.quantity,
              unit: item.unit || "PCS",
              specs: item.specs || null,
              targetPrice: item.targetPrice || null,
            })),
          },
          rfqVendors: {
            create: payload.vendorIds.map((vId) => ({
              vendorId: vId,
              status: initialStatus === "SENT" ? ("SENT" as RfqVendorStatus) : ("PENDING" as RfqVendorStatus),
              sentAt: initialStatus === "SENT" ? new Date() : null,
            })),
          },
        },
        include: {
          items: true,
          rfqVendors: {
            include: { vendor: true },
          },
        },
      });

      return {
        id: created.id,
        number: created.number,
        title: created.title,
        description: created.description,
        status: created.status,
        dueDate: created.dueDate ? created.dueDate.toISOString().split("T")[0] : null,
        awardedAt: null,
        currency: created.currency,
        totalBudget: null,
        items: created.items.map((it) => ({
          id: it.id,
          lineNumber: it.lineNumber,
          description: it.description,
          partNumber: it.partNumber || undefined,
          quantity: Number(it.quantity),
          unit: it.unit,
          specs: it.specs || undefined,
          targetPrice: it.targetPrice ? Number(it.targetPrice) : undefined,
        })),
        vendors: created.rfqVendors.map((rv) => ({
          vendorId: rv.vendorId,
          vendorName: rv.vendor.name,
          vendorEmail: rv.vendor.email,
          status: rv.status,
          sentAt: rv.sentAt ? rv.sentAt.toISOString() : null,
          respondedAt: null,
        })),
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      };
    } catch {
      // fallback to mock
    }
  }

  const linkedVendors = mockVendors
    .filter((v) => vendorIds.includes(v.id))
    .map((v) => ({
      vendorId: v.id,
      vendorName: v.name,
      vendorEmail: v.email,
      status: initialStatus === "SENT" ? ("SENT" as RfqVendorStatus) : ("PENDING" as RfqVendorStatus),
      sentAt: initialStatus === "SENT" ? new Date().toISOString() : null,
      respondedAt: null,
    }));

  const newRfq: RfqRecord = {
    id: `rfq-${Date.now()}`,
    number: generatedNumber,
    title: payload.title,
    description: payload.description || null,
    status: initialStatus,
    dueDate: payload.dueDate || null,
    awardedAt: null,
    currency: payload.currency || "INR",
    totalBudget: items.reduce((sum, it) => sum + ((Number(it.quantity) || 0) * (Number(it.targetPrice) || 0)), 0) || null,
    items: items.map((item, idx) => ({
      ...item,
      id: `item-${Date.now()}-${idx}`,
      lineNumber: idx + 1,
    })),
    vendors: linkedVendors,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockRfqs = [newRfq, ...mockRfqs];
  return newRfq;
}

export async function updateRfqRecord(id: string, data: Partial<RfqRecord>): Promise<RfqRecord | null> {
  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    try {
      const updated = await prisma.rfq.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          status: data.status,
          currency: data.currency,
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        },
        include: {
          items: true,
          rfqVendors: { include: { vendor: true } },
        },
      });
      return {
        id: updated.id,
        number: updated.number,
        title: updated.title,
        description: updated.description,
        status: updated.status,
        dueDate: updated.dueDate ? updated.dueDate.toISOString().split("T")[0] : null,
        awardedAt: updated.awardedAt ? updated.awardedAt.toISOString() : null,
        currency: updated.currency,
        totalBudget: updated.totalBudget ? Number(updated.totalBudget) : null,
        items: updated.items.map((it) => ({
          id: it.id,
          lineNumber: it.lineNumber,
          description: it.description,
          partNumber: it.partNumber || undefined,
          quantity: Number(it.quantity),
          unit: it.unit,
          specs: it.specs || undefined,
          targetPrice: it.targetPrice ? Number(it.targetPrice) : undefined,
        })),
        vendors: updated.rfqVendors.map((rv) => ({
          vendorId: rv.vendorId,
          vendorName: rv.vendor.name,
          vendorEmail: rv.vendor.email,
          status: rv.status,
          sentAt: rv.sentAt ? rv.sentAt.toISOString() : null,
          respondedAt: rv.respondedAt ? rv.respondedAt.toISOString() : null,
        })),
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    } catch {
      // fallback to mock
    }
  }

  const index = mockRfqs.findIndex((r) => r.id === id);
  if (index === -1) return null;
  mockRfqs[index] = {
    ...mockRfqs[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  return mockRfqs[index];
}

export async function deleteRfqRecord(id: string): Promise<boolean> {
  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    try {
      await prisma.rfq.delete({ where: { id } });
      return true;
    } catch {
      // fallback to mock
    }
  }

  const initialLength = mockRfqs.length;
  mockRfqs = mockRfqs.filter((r) => r.id !== id);
  return mockRfqs.length < initialLength;
}

export async function fetchEmails(direction?: string) {
  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    try {
      const whereClause = direction ? { direction: direction as any } : {};
      const emails = await prisma.email.findMany({
        where: whereClause,
        orderBy: { receivedAt: 'desc' },
      });
      return emails;
    } catch (e) {
      console.error(e);
      return [];
    }
  }
  return [];
}
