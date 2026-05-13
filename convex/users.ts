import { v } from "convex/values"
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server"
import type { Doc, Id } from "./_generated/dataModel"
import { md5 } from "./md5"

const staffRole = v.union(v.literal("doctor"), v.literal("nurse"), v.literal("admin"), v.literal("staff"))

function cleanEmail(email: string) {
  return email.trim().toLowerCase()
}

function publicStaff(user: Doc<"users">) {
  return {
    _id: user._id,
    _creationTime: user._creationTime,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    image: user.image,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

export async function requireStaffById(ctx: QueryCtx | MutationCtx, staffUserId: Id<"users">) {
  const user = await ctx.db.get(staffUserId)
  if (user === null || !user.email || !user.passwordHash) {
    throw new Error("Unauthenticated")
  }
  return user
}

export const getCurrentUser = query({
  args: { staffUserId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    if (!args.staffUserId) return null
    const user = await ctx.db.get(args.staffUserId)
    return user ? publicStaff(user) : null
  },
})

export const loginWithEmailPassword = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const email = cleanEmail(args.email)
    const passwordHash = md5(args.password)
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique()

    if (!user || user.passwordHash !== passwordHash) {
      throw new Error("Email atau password salah.")
    }

    await ctx.db.patch(user._id, { updatedAt: Date.now() })
    return publicStaff(user)
  },
})

export const createStaffWithEmailPassword = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
    role: v.optional(staffRole),
  },
  handler: async (ctx, args) => {
    const email = cleanEmail(args.email)
    const existing = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique()

    if (existing) {
      throw new Error("Email sudah terdaftar.")
    }

    const now = Date.now()
    const userId = await ctx.db.insert("users", {
      name: args.name.trim(),
      email,
      passwordHash: md5(args.password),
      role: args.role ?? "staff",
      createdAt: now,
      updatedAt: now,
    })

    const user = await ctx.db.get(userId)
    if (!user) throw new Error("Gagal membuat akun staf.")
    return publicStaff(user)
  },
})
