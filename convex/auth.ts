import Google from "@auth/core/providers/google"
import { convexAuth } from "@convex-dev/auth/server"

type GoogleProfile = {
  sub?: string
  id?: string
  name?: string
  email?: string
  picture?: string
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Google({
      profile(profile) {
        const googleProfile = profile as GoogleProfile
        const googleId = googleProfile.sub ?? googleProfile.id ?? ""
        const now = Date.now()

        return {
          id: googleId,
          name: googleProfile.name,
          email: googleProfile.email,
          image: googleProfile.picture,
          googleId,
          avatarUrl: googleProfile.picture,
          role: "staff",
          createdAt: now,
          updatedAt: now,
        }
      },
    }),
  ],
})
