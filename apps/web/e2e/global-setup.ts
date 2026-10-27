import { clerkSetup } from "@clerk/testing/playwright";

// Fetches a Clerk testing token so the sign-ins skip bot protection.
export default async function globalSetup() {
  await clerkSetup();
}
