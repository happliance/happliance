export interface HapplianceCompatibility {
  /**
   * Required happliance version in semver format.
   */
  happliance?: string;
}

export interface HapplianceCompatibilityIssue {
  name: string;
  message: string;
}

export interface HapplianceCompatibilityIssues extends Array<HapplianceCompatibilityIssue> {
  /**
   * Return formatted error message.
   */
  toString(): string;
}
