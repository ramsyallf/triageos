import { authTables } from "@convex-dev/auth/server"
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

const vitalSigns = v.object({
  systolicBloodPressure: v.optional(v.number()),
  diastolicBloodPressure: v.optional(v.number()),
  heartRate: v.optional(v.number()),
  spo2: v.optional(v.number()),
  temperature: v.optional(v.number()),
  respiratoryRate: v.optional(v.number()),
  gcs: v.optional(v.number()),
  painScore: v.optional(v.number()),
})

const generatedTriageNote = v.object({
  chiefComplaint: v.string(),
  onset: v.string(),
  symptoms: v.array(v.string()),
  riskLevel: v.union(v.literal("High"), v.literal("Medium"), v.literal("Low")),
  esiLevel: v.union(v.literal(1), v.literal(2), v.literal(3), v.literal(4), v.literal(5)),
  suggestedAction: v.string(),
  clinicalSummary: v.string(),
  confidenceScore: v.optional(v.number()),
})

const staffRole = v.union(v.literal("doctor"), v.literal("nurse"), v.literal("admin"), v.literal("staff"))

const triageSessionStatus = v.union(v.literal("draft"), v.literal("generated"), v.literal("completed"))

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    googleId: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    passwordHash: v.optional(v.string()),
    role: v.optional(staffRole),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"])
    .index("googleId", ["googleId"]),
  patients: defineTable({
    bpjsId: v.string(),
    bpjsClass: v.optional(v.string()),
    nik: v.optional(v.string()),
    name: v.string(),
    medicalRecordNumber: v.optional(v.string()),
    gender: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    age: v.optional(v.number()),
    phoneNumber: v.optional(v.string()),
    address: v.optional(v.string()),
    createdByUserId: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_bpjs", ["bpjsId"])
    .index("by_mrn", ["medicalRecordNumber"])
    .index("by_name", ["name"]),
  triageSessions: defineTable({
    patientId: v.id("patients"),
    createdByUserId: v.id("users"),
    anamnesisText: v.string(),
    uploadedPhotoStorageIds: v.array(v.id("_storage")),
    vitalSigns,
    generatedTriageNote: v.optional(generatedTriageNote),
    status: v.optional(triageSessionStatus),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_patient", ["patientId"])
    .index("by_created_by", ["createdByUserId"])
    .index("by_created_by_updated", ["createdByUserId", "updatedAt"]),
  uploadedImages: defineTable({
    storageId: v.id("_storage"),
    uploadedByUserId: v.id("users"),
    patientId: v.optional(v.id("patients")),
    triageSessionId: v.optional(v.id("triageSessions")),
    fileName: v.optional(v.string()),
    contentType: v.optional(v.string()),
    size: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_uploaded_by", ["uploadedByUserId"])
    .index("by_session", ["triageSessionId"]),
})
