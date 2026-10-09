import { securityRateLimit } from "./security-rate-limit";
export async function checkRsvpRateLimit(ip: string, maxAttempts = 10, windowMs = 60000): Promise<boolean> {
 return (await securityRateLimit(`rsvp:${ip}`,maxAttempts,windowMs)).allowed;
}
