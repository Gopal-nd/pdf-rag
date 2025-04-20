import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";

export const auth = betterAuth({
    
    database: prismaAdapter(prisma, {
        provider: "postgresql", 
    }),
    baseURL: process.env.BACKEND_URL as string,
    socialProviders: { 
        github: { 
           clientId: process.env.GITHUB_CLIENT_ID as string, 
           clientSecret: process.env.GITHUB_CLIENT_SECRET as string, 
        }, 
    
    },
    
    redirectTo: "http://localhost:3000/dashboard",
    
    trustedOrigins: [ "http://localhost:3000", "http://localhost:5000" ],
    
});

