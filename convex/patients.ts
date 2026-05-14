import { v } from "convex/values"
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server"
import type { Id } from "./_generated/dataModel"
import { requireStaffById } from "./users"

async function requireStaff(ctx: QueryCtx | MutationCtx, staffUserId: Id<"users">) {
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

export const updatePatientProfile = mutation({
  args: {
    staffUserId: v.id("users"),
    patientId: v.id("patients"),
    name: v.string(),
    bpjsId: v.string(),
    bpjsClass: v.optional(v.string()),
    nik: v.optional(v.string()),
    medicalRecordNumber: v.optional(v.string()),
    gender: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    age: v.optional(v.number()),
    phoneNumber: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx, args.staffUserId)
    const patient = await ctx.db.get(args.patientId)
    if (!patient) throw new Error("Patient not found")

    const name = args.name.trim()
    const bpjsId = args.bpjsId.trim()
    if (!name || !bpjsId) throw new Error("Nama dan ID BPJS wajib diisi")

    await ctx.db.patch(args.patientId, {
      name,
      bpjsId,
      bpjsClass: args.bpjsClass?.trim() || undefined,
      nik: args.nik?.trim() || undefined,
      medicalRecordNumber: args.medicalRecordNumber?.trim() || undefined,
      gender: args.gender?.trim() || undefined,
      dateOfBirth: args.dateOfBirth?.trim() || undefined,
      age: args.age,
      phoneNumber: args.phoneNumber?.trim() || undefined,
      address: args.address?.trim() || undefined,
      updatedAt: Date.now(),
    })

    return await ctx.db.get(args.patientId)
  },
})

export const searchPatients = searchPatientsByBpjsIdOrName
