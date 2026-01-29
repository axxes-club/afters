import { prisma } from "./prisma";
import { FeatureType } from "@prisma/client";

/**
 * Get system statuses relevant to a specific feature
 */
export async function getStatusesForFeature(featureType: FeatureType) {
  try {
    const statuses = await prisma.systemStatus.findMany({
      where: {
        featureType,
        status: {
          not: "OPERATIONAL" // Only return non-operational statuses
        }
      },
      orderBy: { updatedAt: "desc" }
    });
    
    return statuses;
  } catch (error) {
    console.error(`Error fetching statuses for feature ${featureType}:`, error);
    return [];
  }
}

/**
 * Get all system statuses
 */
export async function getAllStatuses() {
  try {
    const statuses = await prisma.systemStatus.findMany({
      orderBy: { feature: "asc" }
    });
    
    return statuses;
  } catch (error) {
    console.error("Error fetching all statuses:", error);
    return [];
  }
}

/**
 * Get the overall system status based on all features
 */
export async function getOverallStatus() {
  try {
    const statuses = await getAllStatuses();
    
    // If any feature is down, the overall status is not operational
    const hasDownFeatures = statuses.some(status => status.status === "DOWN");
    if (hasDownFeatures) {
      return "Some features are currently down. We're working on it.";
    }
    
    // If any feature is in maintenance, construction, or deploying
    const hasIssues = statuses.some(status => 
      status.status === "MAINTENANCE" || 
      status.status === "CONSTRUCTION" || 
      status.status === "DEPLOYING"
    );
    
    if (hasIssues) {
      return "Some features are experiencing issues. We're working on it.";
    }
    
    // If all features are operational
    return "All systems go. See you on the floor.";
  } catch (error) {
    console.error("Error getting overall status:", error);
    return "Unable to determine system status.";
  }
}