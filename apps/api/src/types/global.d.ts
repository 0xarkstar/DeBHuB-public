/**
 * Global type declarations for DeBHuB API
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
