/**
 * Global type declarations for IrysBase API
 */

declare global {
  var authChallenges:
    | Map<
        string,
        {
          challenge: string;
          expiresAt: Date;
        }
      >
    | undefined;
}

export {};
