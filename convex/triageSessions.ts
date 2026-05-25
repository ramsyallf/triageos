import { v } from "convex/values"
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server"
import type { Id } from "./_generated/dataModel"
import { requireStaffById } from "./users"

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

const triageSessionStatus = v.union(v.literal("draft"), v.literal("generated"), v.literal("completed"))

async function requireStaffId(ctx: QueryCtx | MutationCtx, staffUserId: Id<"users">): Promise<Id<"users">> {
  await requireStaffById(ctx, staffUserId)
  return staffUserId
}

async function requireExistingPatient(ctx: QueryCtx | MutationCtx, patientId: Id<"patients">) {
  const patient = await ctx.db.get(patientId)
  if (patient === null) {
    throw new Error("Patient not found")
  }
  return patient
}

async function requireOwnSession(ctx: QueryCtx | MutationCtx, staffUserId: Id<"users">, sessionId: Id<"triageSessions">) {
  const userId = await requireStaffId(ctx, staffUserId)
  const session = await ctx.db.get(sessionId)
  if (session === null || session.createdByUserId !== userId) {
    throw new Error("Triage session not found")
  }
  return { userId, session }
}

async function resolveSessionImageUrls(
  ctx: QueryCtx,
  sessionId: Id<"triageSessions">,
  uploadedPhotoStorageIds: Id<"_storage">[]
) {
  const uploadedImages = await ctx.db
    .query("uploadedImages")
    .withIndex("by_session", (q) => q.eq("triageSessionId", sessionId))
    .collect()

  const storageIds = Array.from(
    new Set([
      ...uploadedPhotoStorageIds,
      ...uploadedImages.map((image) => image.storageId),
    ])
  )

  const urls = await Promise.all(storageIds.map((storageId) => ctx.storage.getUrl(storageId)))
  return urls.filter((url): url is string => url !== null)
}

export const createTriageSessionForPatient = mutation({
  args: {
    staffUserId: v.id("users"),
    patientId: v.id("patients"),
    anamnesisText: v.string(),
    uploadedPhotoStorageIds: v.array(v.id("_storage")),
    vitalSigns,
    generatedTriageNote: v.optional(generatedTriageNote),
    status: v.optional(triageSessionStatus),
  },
  handler: async (ctx, args) => {
    const userId = await requireStaffId(ctx, args.staffUserId)
    await requireExistingPatient(ctx, args.patientId)
    const now = Date.now()

    return await ctx.db.insert("triageSessions", {
      patientId: args.patientId,
      anamnesisText: args.anamnesisText,
      uploadedPhotoStorageIds: args.uploadedPhotoStorageIds,
      vitalSigns: args.vitalSigns,
      generatedTriageNote: args.generatedTriageNote,
      createdByUserId: userId,
      status: args.status ?? (args.generatedTriageNote ? "generated" : "draft"),
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const createTriageSession = createTriageSessionForPatient

export const updateTriageSession = mutation({
  args: {
    staffUserId: v.id("users"),
    triageSessionId: v.id("triageSessions"),
    anamnesisText: v.optional(v.string()),
    uploadedPhotoStorageIds: v.optional(v.array(v.id("_storage"))),
    vitalSigns: v.optional(vitalSigns),
    generatedTriageNote: v.optional(generatedTriageNote),
    status: v.optional(triageSessionStatus),
  },
  handler: async (ctx, args) => {
    const { staffUserId, triageSessionId, ...patch } = args
    await requireOwnSession(ctx, staffUserId, triageSessionId)
    await ctx.db.patch(triageSessionId, { ...patch, updatedAt: Date.now() })
    return triageSessionId
  },
})

export const getTriageSessionById = query({
  args: { staffUserId: v.id("users"), triageSessionId: v.id("triageSessions") },
  handler: async (ctx, args) => {
    const { session } = await requireOwnSession(ctx, args.staffUserId, args.triageSessionId)
    const patient = await ctx.db.get(session.patientId)
    const imageUrls = await resolveSessionImageUrls(ctx, session._id, session.uploadedPhotoStorageIds)
    console.log("[triageSessions:getTriageSessionById] image resolution", {
      sessionId: session._id,
      storageIdCount: session.uploadedPhotoStorageIds.length,
      imageUrlCount: imageUrls.length,
    })

    return { ...session, patient, imageUrls, uploadedPhotoUrls: imageUrls }
  },
})

export const listTriageSessionsByPatient = query({
  args: { staffUserId: v.id("users"), patientId: v.id("patients") },
  handler: async (ctx, args) => {
    await requireStaffId(ctx, args.staffUserId)
    await requireExistingPatient(ctx, args.patientId)
    return await ctx.db
      .query("triageSessions")
      .withIndex("by_patient", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .take(50)
  },
})

export const listMyRecentTriageSessions = query({
  args: { staffUserId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await requireStaffId(ctx, args.staffUserId)
    const sessions = await ctx.db
      .query("triageSessions")
      .withIndex("by_created_by_updated", (q) => q.eq("createdByUserId", userId))
      .order("desc")
      .take(args.limit ?? 25)

    return await Promise.all(
      sessions.map(async (session) => {
        const imageUrls = await resolveSessionImageUrls(ctx, session._id, session.uploadedPhotoStorageIds)

        return {
          ...session,
          patient: await ctx.db.get(session.patientId),
          imageUrls,
          uploadedPhotoUrls: imageUrls,
        }
      })
    )
  },
})

export const listRecentTriageSessionsForCurrentDoctor = listMyRecentTriageSessions
