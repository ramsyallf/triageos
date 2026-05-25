import { v } from "convex/values"
import { mutation, type MutationCtx } from "./_generated/server"
import type { Id } from "./_generated/dataModel"
import { requireStaffById } from "./users"

async function requireStaffId(ctx: MutationCtx, staffUserId: Id<"users">) {
  await requireStaffById(ctx, staffUserId)
  return staffUserId
}

export const generateUploadUrl = mutation({
  args: { staffUserId: v.id("users") },
  handler: async (ctx, args) => {
    await requireStaffId(ctx, args.staffUserId)
    return await ctx.storage.generateUploadUrl()
  },
})

export const saveUploadedImageMetadata = mutation({
  args: {
    staffUserId: v.id("users"),
    storageId: v.id("_storage"),
    patientId: v.optional(v.id("patients")),
    triageSessionId: v.optional(v.id("triageSessions")),
    fileName: v.optional(v.string()),
    contentType: v.optional(v.string()),
    size: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireStaffId(ctx, args.staffUserId)
    return await ctx.db.insert("uploadedImages", {
      storageId: args.storageId,
      patientId: args.patientId,
      triageSessionId: args.triageSessionId,
      fileName: args.fileName,
      contentType: args.contentType,
      size: args.size,
      uploadedByUserId: userId,
      createdAt: Date.now(),
    })
  },
})

export const saveUploadedImageToTriageSession = mutation({
  args: {
    staffUserId: v.id("users"),
    storageId: v.id("_storage"),
    triageSessionId: v.id("triageSessions"),
    fileName: v.optional(v.string()),
    contentType: v.optional(v.string()),
    size: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireStaffId(ctx, args.staffUserId)
    const session = await ctx.db.get(args.triageSessionId)
    if (session === null || session.createdByUserId !== userId) {
      throw new Error("Triage session not found")
    }

    await ctx.db.patch(args.triageSessionId, {
      uploadedPhotoStorageIds: [...session.uploadedPhotoStorageIds, args.storageId],
      updatedAt: Date.now(),
    })

    return await ctx.db.insert("uploadedImages", {
      storageId: args.storageId,
      uploadedByUserId: userId,
      patientId: session.patientId,
      triageSessionId: args.triageSessionId,
      fileName: args.fileName,
      contentType: args.contentType,
      size: args.size,
      createdAt: Date.now(),
    })
  },
})

export const linkUploadedImagesToTriageSession = mutation({
  args: {
    staffUserId: v.id("users"),
    triageSessionId: v.id("triageSessions"),
    storageIds: v.array(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await requireStaffId(ctx, args.staffUserId)
    const session = await ctx.db.get(args.triageSessionId)
    if (session === null || session.createdByUserId !== userId) {
      throw new Error("Triage session not found")
    }

    const storageIds = Array.from(new Set(args.storageIds))
    if (storageIds.length === 0) return []

    await ctx.db.patch(args.triageSessionId, {
      uploadedPhotoStorageIds: Array.from(new Set([...session.uploadedPhotoStorageIds, ...storageIds])),
      updatedAt: Date.now(),
    })

    const linkedMetadataIds = await Promise.all(
      storageIds.map(async (storageId) => {
        const existingMetadata = await ctx.db
          .query("uploadedImages")
          .withIndex("by_uploaded_by", (q) => q.eq("uploadedByUserId", userId))
          .filter((q) => q.eq(q.field("storageId"), storageId))
          .first()

        if (existingMetadata) {
          await ctx.db.patch(existingMetadata._id, {
            patientId: session.patientId,
            triageSessionId: args.triageSessionId,
          })
          return existingMetadata._id
        }

        return await ctx.db.insert("uploadedImages", {
          storageId,
          uploadedByUserId: userId,
          patientId: session.patientId,
          triageSessionId: args.triageSessionId,
          createdAt: Date.now(),
        })
      })
    )

    return linkedMetadataIds
  },
})
