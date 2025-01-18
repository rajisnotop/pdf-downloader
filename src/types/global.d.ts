declare global {
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
    jsPDF: {
      new(orientation?: 'p' | 'portrait' | 'l' | 'landscape',
          unit?: string,
          format?: string,
          compressPdf?: boolean): jsPDFInstance;
    };
  }
}

interface jsPDFInstance {
  addPage: (orientation?: 'p' | 'portrait' | 'l' | 'landscape') => jsPDFInstance;
  addImage: (
    imageData: string,
    format: string,
    x: number,
    y: number,
    width: number,
    height: number,
    alias?: string,
    compression?: 'NONE' | 'FAST',
    rotation?: number
  ) => jsPDFInstance;
  internal: {
    pageSize: {
      getWidth: () => number;
      getHeight: () => number;
    };
  };
  output: (type: 'arraybuffer' | 'blob' | 'datauristring') => ArrayBuffer | Blob | string;
}

export {};
