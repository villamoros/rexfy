import { clerkSetup } from "@clerk/testing/playwright";

// Fetches a Clerk testing token so the sign-ins skip bot protection.
export default async function globalSetup() {
  if (process.env.CLERK_SECRET_KEY && process.env.CLERK_PUBLISHABLE_KEY)
    await clerkSetup();
}
