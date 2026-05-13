import { v } from "convex/values"
import { query, type QueryCtx } from "./_generated/server"
import type { Id } from "./_generated/dataModel"
import { requireStaffById } from "./users"

async function requireStaff(ctx: QueryCtx, staffUserId: Id<"users">) {
  return await requireStaffById(ctx, staffUserId)
}

export const getPatientByBpjsId = query({
  args: { staffUserId: v.id("users"), bpjsId: v.string() },
  handler: async (ctx, args) => {
    await requireStaff(ctx, args.staffUserId)
    const bpjsId = args.bpjsId.trim()
    if (!bpjsId) return null

    return await ctx.db
      .query("patients")
      .withIndex("by_bpjs", (q) => q.eq("bpjsId", bpjsId))
      .unique()
  },
})

export const getPatientById = query({
  args: { staffUserId: v.id("users"), patientId: v.id("patients") },
  handler: async (ctx, args) => {
    await requireStaff(ctx, args.staffUserId)
    return await ctx.db.get(args.patientId)
  },
})

export const searchPatientsByBpjsIdOrName = query({
  args: { staffUserId: v.id("users"), search: v.string() },
  handler: async (ctx, args) => {
    await requireStaff(ctx, args.staffUserId)
    const search = args.search.trim()
    if (!search) return []

    const byBpjs = await ctx.db
      .query("patients")
      .withIndex("by_bpjs", (q) => q.eq("bpjsId", search))
      .unique()
    if (byBpjs) return [byBpjs]

    const byMrn = await ctx.db
      .query("patients")
      .withIndex("by_mrn", (q) => q.eq("medicalRecordNumber", search))
      .unique()
    if (byMrn) return [byMrn]

    const lowerSearch = search.toLowerCase()
    const patients = await ctx.db.query("patients").withIndex("by_name").take(50)
    return patients.filter((patient) =>
      [patient.name, patient.bpjsId, patient.medicalRecordNumber]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(lowerSearch))
    )
  },
})

export const searchPatients = searchPatientsByBpjsIdOrName
