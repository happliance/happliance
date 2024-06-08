import satisfies from "semver/functions/satisfies";
// import { readPackageJSON } from "pkg-types";
import type { Happliance, HapplianceCompatibility, HapplianceCompatibilityIssues } from "@happliance/schema";
import { useHappliance } from "./context";

export function normalizeSemanticVersion(version: string) {
  return version.replace(/-\d+\.[\da-f]+/, "");
}

/* const builderMap = {
  "@happliance/vite-builder": "vite",
  "@happliance/webpack-builder": "webpack",
}; */

/**
 * Check version constraints and return incompatibility issues as an array
 */
export async function checkHapplianceCompatibility(constraints: HapplianceCompatibility, happliance: Happliance = useHappliance()): Promise<HapplianceCompatibilityIssues> {
  const issues: HapplianceCompatibilityIssues = [];

  if (constraints.happliance) {
    const happlianceVersion = getHapplianceVersion(happliance);
    if (!satisfies(normalizeSemanticVersion(happlianceVersion), constraints.happliance, { includePrerelease: true })) {
      issues.push({
        name: "happliance",
        message: `Happliance version \`${constraints.happliance}\` is required but currently using \`${happlianceVersion}\``,
      });
    }
  }

  await happliance.callHook("pack:compatibility", constraints, issues);
  issues.toString = () => issues.map((issue) => ` - [${issue.name}] ${issue.message}`).join("\n");

  return issues;
}

/**
 * Check version constraints and throw a detailed error if has any, otherwise returns true
 */
export async function assertHapplianceCompatibility(constraints: HapplianceCompatibility, happliance: Happliance = useHappliance()): Promise<true> {
  const issues = await checkHapplianceCompatibility(constraints, happliance);
  if (issues.length > 0) throw new Error("Happliance compatibility issues found:\n" + issues.toString());

  return true;
}

/**
 * Check version constraints and return true if passed, otherwise returns false
 */
export async function hasHapplianceCompatibility(constraints: HapplianceCompatibility, happliance: Happliance = useHappliance()): Promise<boolean> {
  const issues = await checkHapplianceCompatibility(constraints, happliance);
  return issues.length === 0;
}

/**
 * Get happliance version
 */
export function getHapplianceVersion(happliance: Happliance | any = useHappliance()) {
  const rawVersion = happliance?._version || happliance?.version || happliance?.constructor?.version;
  if (!rawVersion) throw new Error("Cannot determine happliance version! Is current instance passed?");

  return rawVersion.replace(/^v/g, "");
}
