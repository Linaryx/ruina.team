export type GuideLightboxImage = { src: string; alt: string };

export interface GuideLightboxApi {
  register(src: string, alt: string): number;
  open(index: number): void;
}
