// Removed ResolverManifest import

/**
 * Manifest describing the assets to be loaded by the application.
 * This structure is used by PixiJS Assets to manage loading.
 */
export const assetManifest = {
  bundles: [
    {
      /** Bundle containing essential assets needed globally or early on. */
      name: "essential",
      assets: {
        /** Path to the main texture atlas JSON file relative to the public folder. */
        mainAtlas: "assets.json",
      },
    },
  ],
};
