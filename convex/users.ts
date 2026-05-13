import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import { query, mutation, type MutationCtx, type QueryCtx } from "./_generated/server"

async function requireCurrentUserId(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx)
  if (userId === null) {
    throw new Error("Unauthenticated")
  }
  return userId
}

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) return null
    return await ctx.db.get(userId)
  },
})

export const upsertCurrentUserFromGoogle = mutation({
  args: {
    role: v.optional(v.union(v.literal("doctor"), v.literal("nurse"), v.literal("admin"), v.literal("staff"))),
  },
  handler: async (ctx, args) => {
    const userId = await requireCurrentUserId(ctx)
    const user = await ctx.db.get(userId)
    if (user === null) {
      throw new Error("Authenticated user record not found")
    }

    const identity = await ctx.auth.getUserIdentity()
    const now = Date.now()
    const avatarUrl = user.avatarUrl ?? user.image ?? identity?.pictureUrl
    const googleId = user.googleId ?? identity?.subject

    await ctx.db.patch(userId, {
      name: user.name ?? identity?.name,
      email: user.email ?? identity?.email,
      image: user.image ?? avatarUrl,
      googleId,
      avatarUrl,
      role: user.role ?? args.role ?? "staff",
      createdAt: user.createdAt ?? now,
      updatedAt: now,
    })

    return await ctx.db.get(userId)
  },
})

export const upsertCurrentUser = upsertCurrentUserFromGoogle
