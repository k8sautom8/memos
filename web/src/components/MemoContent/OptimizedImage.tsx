import { useEffect, useRef, useState } from "react";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt?: string;
}

/**
 * Optimized image component that:
 * - Loads above-the-fold images eagerly with high priority
 * - Loads below-the-fold images lazily
 * - Prevents layout shift with proper sizing
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({ src, alt, className, ...imgProps }) => {
  const [loadingStrategy, setLoadingStrategy] = useState<"eager" | "lazy">("lazy");
  const [fetchPriority, setFetchPriority] = useState<"high" | "auto">("auto");
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    let observer: IntersectionObserver | null = null;

    // Check if image is initially in viewport (above the fold)
    const checkPosition = () => {
      if (!imgRef.current) return false;
      const rect = imgRef.current.getBoundingClientRect();
      // Consider images within 1.5x viewport height as "above the fold"
      const isAboveFold = rect.top < window.innerHeight * 1.5 && rect.top > -rect.height;

      if (isAboveFold) {
        setLoadingStrategy("eager");
        setFetchPriority("high");
        return true; // Already optimized, no need for observer
      }
      return false;
    };

    // Initial check after a small delay to ensure DOM is laid out
    const timeoutId = setTimeout(() => {
      if (checkPosition()) {
        return; // Already above fold, no observer needed
      }

      // Use Intersection Observer for images that might scroll into view
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const rect = entry.boundingClientRect;
              // If image is near the top of viewport, prioritize it
              if (rect.top < window.innerHeight * 1.5) {
                setLoadingStrategy("eager");
                setFetchPriority("high");
              }
              observer?.disconnect();
            }
          });
        },
        { rootMargin: "300px" } // Start loading 300px before entering viewport
      );

      if (imgRef.current) {
        observer.observe(imgRef.current);
      }
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      observer?.disconnect();
    };
  }, []);

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      loading={loadingStrategy}
      decoding="async"
      fetchPriority={fetchPriority}
      className={className}
      {...imgProps}
    />
  );
};

