import { createApiClient } from '@neondatabase/api-client';

interface NeonBranchConfig {
  projectId: string;
  apiKey: string;
}

interface BranchResult {
  branchId: string;
  branchName: string;
  connectionString: string;
}

/**
 * Manages Neon database branches for E2E testing.
 * Creates isolated branches for test runs to avoid data pollution.
 */
export class NeonTestBranchManager {
  private client: ReturnType<typeof createApiClient>;
  private projectId: string;
  private createdBranches: string[] = [];

  constructor(config: NeonBranchConfig) {
    this.client = createApiClient({
      apiKey: config.apiKey,
    });
    this.projectId = config.projectId;
  }

  /**
   * Create a new test branch from main
   */
  async createTestBranch(suiteName: string): Promise<BranchResult> {
    const timestamp = Date.now();
    const branchName = `e2e-${suiteName}-${timestamp}`;

    console.log(`Creating Neon test branch: ${branchName}`);

    // Create branch from main
    const response = await this.client.createProjectBranch(this.projectId, {
      branch: {
        name: branchName,
      },
      endpoints: [
        {
          type: 'read_write',
        },
      ],
    });

    const branch = response.data.branch;
    const endpoint = response.data.endpoints?.[0];
    const role = response.data.roles?.[0];
    const database = response.data.databases?.[0];

    if (!endpoint) {
      throw new Error('No endpoint created for branch');
    }

    this.createdBranches.push(branch.id);

    // Get the password for the role
    const passwordResponse = await this.client.getProjectBranchRolePassword(
      this.projectId,
      branch.id,
      role?.name || 'neondb_owner'
    );

    const password = passwordResponse.data.password;
    const host = endpoint.host;
    const dbName = database?.name || 'neondb';
    const roleName = role?.name || 'neondb_owner';

    // Construct connection string
    const connectionString = `postgresql://${roleName}:${password}@${host}/${dbName}?sslmode=require`;

    console.log(`Test branch created: ${branch.id} (${branchName})`);

    return {
      branchId: branch.id,
      branchName: branch.name,
      connectionString,
    };
  }

  /**
   * Delete a branch by ID
   */
  async deleteBranch(branchId: string): Promise<void> {
    console.log(`Deleting Neon test branch: ${branchId}`);

    try {
      await this.client.deleteProjectBranch(this.projectId, branchId);
      this.createdBranches = this.createdBranches.filter((id) => id !== branchId);
      console.log(`Test branch deleted: ${branchId}`);
    } catch (error) {
      console.error(`Failed to delete branch ${branchId}:`, error);
      throw error;
    }
  }

  /**
   * Clean up all branches created by this manager
   */
  async cleanupAllBranches(): Promise<void> {
    console.log(`Cleaning up ${this.createdBranches.length} test branches`);

    const results = await Promise.allSettled(
      this.createdBranches.map((id) => this.deleteBranch(id))
    );

    const failures = results.filter((r) => r.status === 'rejected');
    if (failures.length > 0) {
      console.warn(`Failed to delete ${failures.length} branches`);
    }
  }

  /**
   * List all e2e branches (for manual cleanup)
   */
  async listE2EBranches(): Promise<Array<{ id: string; name: string; createdAt: string }>> {
    const response = await this.client.listProjectBranches(this.projectId);

    return response.data.branches
      .filter((b) => b.name.startsWith('e2e-'))
      .map((b) => ({
        id: b.id,
        name: b.name,
        createdAt: b.created_at,
      }));
  }

  /**
   * Clean up old e2e branches (older than specified hours)
   */
  async cleanupOldBranches(olderThanHours: number = 24): Promise<number> {
    const branches = await this.listE2EBranches();
    const cutoff = Date.now() - olderThanHours * 60 * 60 * 1000;

    const oldBranches = branches.filter((b) => new Date(b.createdAt).getTime() < cutoff);

    console.log(`Found ${oldBranches.length} old e2e branches to clean up`);

    for (const branch of oldBranches) {
      try {
        await this.deleteBranch(branch.id);
      } catch (error) {
        console.warn(`Failed to delete old branch ${branch.name}:`, error);
      }
    }

    return oldBranches.length;
  }
}

/**
 * Create a branch manager from environment variables
 */
export function createBranchManager(): NeonTestBranchManager | null {
  const apiKey = process.env.NEON_API_KEY;
  const projectId = process.env.NEON_PROJECT_ID;

  if (!apiKey || !projectId) {
    console.warn('NEON_API_KEY or NEON_PROJECT_ID not set - skipping Neon branch management');
    return null;
  }

  return new NeonTestBranchManager({ apiKey, projectId });
}
