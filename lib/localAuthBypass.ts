import type { User } from "firebase/auth";

export const localAuthBypassEnabled = process.env.NODE_ENV !== "production";

export const localDevUser: User | null = localAuthBypassEnabled
  ? ({
      uid: "local-dev-user",
      email: "local@dev.test",
      emailVerified: true,
      displayName: "Local Dev",
      phoneNumber: null,
      photoURL: null,
      isAnonymous: false,
      providerData: [],
      providerId: "firebase",
      refreshToken: "",
      tenantId: null,
      metadata: { creationTime: "", lastSignInTime: "" } as any,
      // Stubbed methods to satisfy the Firebase User interface for local usage.
      delete: async () => {},
      getIdToken: async () => "",
      getIdTokenResult: async () =>
        ({
          token: "",
          claims: {},
          authTime: "",
          issuedAtTime: "",
          expirationTime: "",
          signInProvider: null,
          signInSecondFactor: null,
          isValid: false
        }) as any,
      reload: async () => {},
      toJSON: () => ({})
    } as unknown as User)
  : null;
