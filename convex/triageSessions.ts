import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server"
import type { Id } from "./_generated/dataModel"

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

async function requireUserId(ctx: QueryCtx | MutationCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx)
  if (userId === null) throw new Error("Unauthenticated")
  return userId
}

async function requireExistingPatient(ctx: QueryCtx | MutationCtx, patientId: Id<"patients">) {
  const patient = await ctx.db.get(patientId)
  if (patient === null) {
    throw new Error("Patient not found")
  }
  return patient
}

async function requireOwnSession(ctx: QueryCtx | MutationCtx, sessionId: Id<"triageSessions">) {
  const userId = await requireUserId(ctx)
  const session = await ctx.db.get(sessionId)
  if (session === null || session.createdByUserId !== userId) {
    throw new Error("Triage session not found")
  }
  return { userId, session }
}

export const createTriageSessionForPatient = mutation({
  args: {
    patientId: v.id("patients"),
    anamnesisText: v.string(),
    uploadedPhotoStorageIds: v.array(v.id("_storage")),
    vitalSigns,
    generatedTriageNote: v.optional(generatedTriageNote),
    status: v.optional(triageSessionStatus),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    await requireExistingPatient(ctx, args.patientId)
    const now = Date.now()

    return await ctx.db.insert("triageSessions", {
      ...args,
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
    triageSessionId: v.id("triageSessions"),
    anamnesisText: v.optional(v.string()),
    uploadedPhotoStorageIds: v.optional(v.array(v.id("_storage"))),
    vitalSigns: v.optional(vitalSigns),
    generatedTriageNote: v.optional(generatedTriageNote),
    status: v.optional(triageSessionStatus),
  },
  handler: async (ctx, args) => {
    const { triageSessionId, ...patch } = args
    await requireOwnSession(ctx, triageSessionId)
    await ctx.db.patch(triageSessionId, { ...patch, updatedAt: Date.now() })
    return triageSessionId
  },
})

export const getTriageSessionById = query({
  args: { triageSessionId: v.id("triageSessions") },
  handler: async (ctx, args) => {
    const { session } = await requireOwnSession(ctx, args.triageSessionId)
    const patient = await ctx.db.get(session.patientId)
    return { ...session, patient }
  },
})

export const listTriageSessionsByPatient = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    await requireUserId(ctx)
    await requireExistingPatient(ctx, args.patientId)
    return await ctx.db
      .query("triageSessions")
      .withIndex("by_patient", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .take(50)
  },
})

export const listMyRecentTriageSessions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const sessions = await ctx.db
      .query("triageSessions")
      .withIndex("by_created_by_updated", (q) => q.eq("createdByUserId", userId))
      .order("desc")
      .take(args.limit ?? 25)

    return await Promise.all(
      sessions.map(async (session) => ({
        ...session,
        patient: await ctx.db.get(session.patientId),
      }))
    )
  },
})

export const listRecentTriageSessionsForCurrentDoctor = listMyRecentTriageSessions
