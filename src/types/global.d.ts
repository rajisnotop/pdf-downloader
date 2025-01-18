interface Window {
  trustedTypes?: {
    createPolicy: (
      name: string,
      rules: {
        createScriptURL?: (input: string) => string;
        createHTML?: (input: string) => string;
        createScript?: (input: string) => string;
      }
    ) => {
      createScriptURL: (input: string) => string;
      createHTML: (input: string) => string;
      createScript: (input: string) => string;
    };
  };
}
