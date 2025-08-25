import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql", 
    }),
    baseURL: process.env.NEXTAUTH_URL!,
    socialProviders: { 
        github: { 
           clientId: process.env.GITHUB_CLIENT_ID!, 
           clientSecret: process.env.GITHUB_CLIENT_SECRET!, 
        }, 
    },
    trustedOrigins: [ 
        process.env.NEXTAUTH_URL!,
        process.env.FRONTEND_URL || process.env.NEXTAUTH_URL!
    ],
});
