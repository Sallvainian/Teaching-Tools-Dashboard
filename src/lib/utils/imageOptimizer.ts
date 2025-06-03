// src/lib/utils/imageOptimizer.ts
import { errorService, ErrorSeverity, ErrorSource } from '$lib/services/errorService';

/**
 * Image format options
 */
export enum ImageFormat {
  WEBP = 'webp',
  JPEG = 'jpeg',
  PNG = 'png',
  AVIF = 'avif',
  ORIGINAL = 'original'
}

/**
 * Image quality options (1-100)
 */
export type ImageQuality = number;

/**
 * Image size options
 */
export interface ImageSize {
  width: number;
  height?: number;
}

/**
 * Responsive image breakpoints
 */
export interface ResponsiveBreakpoint {
  maxWidth: number;
  size: ImageSize;
}

/**
 * Image optimization options
 */
export interface ImageOptimizationOptions {
  /** Target format for the image */
  format?: ImageFormat;
  /** Quality of the image (1-100) */
  quality?: ImageQuality;
  /** Size of the image */
  size?: ImageSize;
  /** Responsive breakpoints */
  breakpoints?: ResponsiveBreakpoint[];
  /** Whether to lazy load the image */
  lazyLoad?: boolean;
  /** Whether to use native lazy loading */
  nativeLazyLoad?: boolean;
  /** Base URL for the image optimization service */
  baseUrl?: string;
  /** Additional parameters for the image optimization service */
  params?: Record<string, string>;
}

/**
 * Default image optimization options
 */
const DEFAULT_IMAGE_OPTIONS: ImageOptimizationOptions = {
  format: ImageFormat.WEBP,
  quality: 80,
  lazyLoad: true,
  nativeLazyLoad: true,
  baseUrl: '/api/images',
  params: {}
};

/**
 * Default responsive breakpoints
 */
export const DEFAULT_BREAKPOINTS: ResponsiveBreakpoint[] = [
  { maxWidth: 640, size: { width: 320 } },
  { maxWidth: 768, size: { width: 640 } },
  { maxWidth: 1024, size: { width: 768 } },
  { maxWidth: 1280, size: { width: 1024 } },
  { maxWidth: 1536, size: { width: 1280 } },
  { maxWidth: Infinity, size: { width: 1536 } }
];

/**
 * Check if the browser supports a specific image format
 * @param format Image format to check
 * @returns Promise that resolves to true if the format is supported
 */
export async function isFormatSupported(format: ImageFormat): Promise<boolean> {
  if (typeof window === 'undefined') {
    // Server-side rendering, assume support for common formats
    return format === ImageFormat.WEBP || 
           format === ImageFormat.JPEG || 
           format === ImageFormat.PNG;
  }
  
  if (format === ImageFormat.ORIGINAL) {
    return true;
  }
  
  // Check for WebP support
  if (format === ImageFormat.WEBP) {
    const canvas = document.createElement('canvas');
    if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
      return true;
    }
  }
  
  // Check for AVIF support
  if (format === ImageFormat.AVIF) {
    return 'HTMLImageElement' in window && 'decode' in HTMLImageElement.prototype;
  }
  
  // JPEG and PNG are universally supported
  return format === ImageFormat.JPEG || format === ImageFormat.PNG;
}

/**
 * Get the best supported image format
 * @returns Promise that resolves to the best supported format
 */
export async function getBestSupportedFormat(): Promise<ImageFormat> {
  // Check AVIF support first (best compression)
  if (await isFormatSupported(ImageFormat.AVIF)) {
    return ImageFormat.AVIF;
  }
  
  // Then check WebP support
  if (await isFormatSupported(ImageFormat.WEBP)) {
    return ImageFormat.WEBP;
  }
  
  // Fall back to JPEG
  return ImageFormat.JPEG;
}

/**
 * Generate a URL for an optimized image
 * @param src Original image URL
 * @param options Image optimization options
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(
  src: string,
  options: ImageOptimizationOptions = {}
): string {
  const opts = { ...DEFAULT_IMAGE_OPTIONS, ...options };
  
  // If using original format, return the original URL
  if (opts.format === ImageFormat.ORIGINAL) {
    return src;
  }
  
  try {
    // Parse the URL
    const url = new URL(src, window.location.origin);
    
    // If using a base URL for optimization service
    if (opts.baseUrl) {
      const optimizerUrl = new URL(opts.baseUrl, window.location.origin);
      
      // Add the original URL as a parameter
      optimizerUrl.searchParams.set('url', encodeURIComponent(src));
      
      // Add format parameter
      if (opts.format) {
        optimizerUrl.searchParams.set('format', opts.format);
      }
      
      // Add quality parameter
      if (opts.quality) {
        optimizerUrl.searchParams.set('quality', opts.quality.toString());
      }
      
      // Add size parameters
      if (opts.size) {
        if (opts.size.width) {
          optimizerUrl.searchParams.set('width', opts.size.width.toString());
        }
        if (opts.size.height) {
          optimizerUrl.searchParams.set('height', opts.size.height.toString());
        }
      }
      
      // Add additional parameters
      if (opts.params) {
        Object.entries(opts.params).forEach(([key, value]) => {
          optimizerUrl.searchParams.set(key, value);
        });
      }
      
      return optimizerUrl.toString();
    }
    
    // Otherwise, add parameters to the original URL
    if (opts.format) {
      url.searchParams.set('format', opts.format);
    }
    
    if (opts.quality) {
      url.searchParams.set('quality', opts.quality.toString());
    }
    
    if (opts.size) {
      if (opts.size.width) {
        url.searchParams.set('width', opts.size.width.toString());
      }
      if (opts.size.height) {
        url.searchParams.set('height', opts.size.height.toString());
      }
    }
    
    // Add additional parameters
    if (opts.params) {
      Object.entries(opts.params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }
    
    return url.toString();
  } catch (error) {
    errorService.logError({
      message: 'Failed to generate optimized image URL',
      severity: ErrorSeverity.WARNING,
      source: ErrorSource.UI,
      originalError: error,
      retryable: false
    });
    
    // Return the original URL if there's an error
    return src;
  }
}

/**
 * Generate srcset attribute for responsive images
 * @param src Original image URL
 * @param breakpoints Responsive breakpoints
 * @param options Image optimization options
 * @returns srcset attribute value
 */
export function generateSrcSet(
  src: string,
  breakpoints: ResponsiveBreakpoint[] = DEFAULT_BREAKPOINTS,
  options: ImageOptimizationOptions = {}
): string {
  return breakpoints
    .map(breakpoint => {
      const url = getOptimizedImageUrl(src, {
        ...options,
        size: breakpoint.size
      });
      return `${url} ${breakpoint.size.width}w`;
    })
    .join(', ');
}

/**
 * Generate sizes attribute for responsive images
 * @param breakpoints Responsive breakpoints
 * @returns sizes attribute value
 */
export function generateSizes(
  breakpoints: ResponsiveBreakpoint[] = DEFAULT_BREAKPOINTS
): string {
  return breakpoints
    .map(breakpoint => {
      if (breakpoint.maxWidth === Infinity) {
        return `${breakpoint.size.width}px`;
      }
      return `(max-width: ${breakpoint.maxWidth}px) ${breakpoint.size.width}px`;
    })
    .join(', ');
}

/**
 * Get props for an optimized image
 * @param src Original image URL
 * @param alt Alt text for the image
 * @param options Image optimization options
 * @returns Props for the image element
 */
export function getOptimizedImageProps(
  src: string,
  alt: string,
  options: ImageOptimizationOptions = {}
): Record<string, string> {
  const opts = { ...DEFAULT_IMAGE_OPTIONS, ...options };
  
  const props: Record<string, string> = {
    src: getOptimizedImageUrl(src, opts),
    alt
  };
  
  // Add responsive image attributes if breakpoints are provided
  if (opts.breakpoints && opts.breakpoints.length > 0) {
    props.srcset = generateSrcSet(src, opts.breakpoints, opts);
    props.sizes = generateSizes(opts.breakpoints);
  }
  
  // Add lazy loading attribute if enabled
  if (opts.lazyLoad && opts.nativeLazyLoad) {
    props.loading = 'lazy';
  }
  
  // Add decoding attribute for better performance
  props.decoding = 'async';
  
  return props;
}

/**
 * Preload critical images
 * @param urls Array of image URLs to preload
 * @param options Image optimization options
 */
export function preloadCriticalImages(
  urls: string[],
  options: ImageOptimizationOptions = {}
): void {
  if (typeof document === 'undefined') {
    return;
  }
  
  urls.forEach(url => {
    const optimizedUrl = getOptimizedImageUrl(url, options);
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = optimizedUrl;
    
    document.head.appendChild(link);
  });
}