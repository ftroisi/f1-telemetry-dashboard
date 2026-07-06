import { lazy } from "react";

/**
 * This method safely retries the import of a module in case of failure.
 * https://logz.io/blog/retry-dynamic-imports-react-lazy
 */
const safeLazyImport: typeof lazy = (importer) => {
  const retryImport = async () => {
    try {
      return await importer();
    } catch (error: any) {
      // This assumes that the error message that the browser exception will contain this specific text.
      // If not, the url will not be able to parse and we'll get an error on that
      if (!error.message.includes("Failed to fetch dynamically imported module:")) {
        throw new Error("safeLazyImport: cannot parse the error message: " + error, {
          cause: error
        });
      }
      // Reload the page to force a fresh load of the module
      window.location.reload();
      // For typing reasons, still need to return a promise
      return new Promise(() => {});
    }
  };
  return lazy(retryImport as any);
};

export default safeLazyImport;
