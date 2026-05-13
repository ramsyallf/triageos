import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import { mutation, type MutationCtx } from "./_generated/server"

async function requireUserId(ctx: MutationCtx) {
  const userId = await getAuthUserId(ctx)
  if (userId === null) throw new Error("Unauthenticated")
  return userId
}

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUserId(ctx)
    return await ctx.storage.generateUploadUrl()
  },
})

export const saveUploadedImageMetadata = mutation({
  args: {
    storageId: v.id("_storage"),
    patientId: v.optional(v.id("patients")),
    triageSessionId: v.optional(v.id("triageSessions")),
    fileName: v.optional(v.string()),
    contentType: v.optional(v.string()),
    size: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    return await ctx.db.insert("uploadedImages", {
      ...args,
      uploadedByUserId: userId,
      createdAt: Date.now(),
    })
  },
})

export const saveUploadedImageToTriageSession = mutation({
  args: {
    storageId: v.id("_storage"),
    triageSessionId: v.id("triageSessions"),
    fileName: v.optional(v.string()),
    contentType: v.optional(v.string()),
    size: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
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
