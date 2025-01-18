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
  jsPDF: any;
}

declare module 'jspdf' {
  export interface jsPDF {
    new(orientation?: 'p' | 'portrait' | 'l' | 'landscape',
        unit?: string,
        format?: string,
        compressPdf?: boolean): jsPDF;
    addImage: (imageData: string | HTMLImageElement | HTMLCanvasElement,
              format: string,
              x: number,
              y: number,
              width: number,
              height: number,
              alias?: string,
              compression?: 'NONE' | 'FAST' | 'MEDIUM' | 'SLOW',
              rotation?: number) => jsPDF;
    save: (filename?: string) => jsPDF;
    output: (type: string, options?: any) => string | Uint8Array;
  }
  const jsPDF: {
    new(orientation?: 'p' | 'portrait' | 'l' | 'landscape',
        unit?: string,
        format?: string,
        compressPdf?: boolean): jsPDF;
  };
  export default jsPDF;
}
