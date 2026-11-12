import { useEffect, useState } from "react";
import { handleImageError, resolveAssetUrl } from "@/utils/image-url";

export default function ProductGallery({
  product,
  images: imagesProp,
  variantImage = null,
}) {
  const images =
    Array.isArray(imagesProp) && imagesProp.length > 0
      ? imagesProp
      : Array.isArray(product?.images)
        ? product.images
        : [];

  const [activeIndex, setActiveIndex] = useState(0);
  const [displayedImage, setDisplayedImage] = useState(
    () => variantImage || images[0] || ""
  );
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState("50% 50%");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const productSlug = product?.slug || "";
  const firstImage = images[0] || "";

  useEffect(() => {
    setActiveIndex(0);
    setIsZoomed(false);
    setZoomOrigin("50% 50%");
    setIsLightboxOpen(false);
  }, [productSlug]);

  useEffect(() => {
    if (typeof variantImage === "string" && variantImage.trim().length > 0) {
      setDisplayedImage(variantImage.trim());
    } else {
      setActiveIndex(0);
      setDisplayedImage(firstImage);
    }
  }, [productSlug, variantImage, firstImage]);

  useEffect(() => {
    if (!isLightboxOpen) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsLightboxOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLightboxOpen]);

  const activeImage = displayedImage || images[activeIndex] || firstImage;
  const productName = product?.name || "Ürün görseli";

  function updateZoomFromMouse(event) {
    const rect = event.currentTarget?.getBoundingClientRect?.();
    if (rect && rect.width > 0 && rect.height > 0) {
      const x = Math.max(
        0,
        Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)
      );
      const y = Math.max(
        0,
        Math.min(100, ((event.clientY - rect.top) / rect.height) * 100)
      );
      setZoomOrigin(`${x}% ${y}%`);
    }
  }

  function handleStageMouseEnter(event) {
    setIsZoomed(true);
    updateZoomFromMouse(event);
  }

  function handleStageMouseMove(event) {
    setIsZoomed(true);
    updateZoomFromMouse(event);
  }

  function handleStageMouseLeave() {
    setIsZoomed(false);
  }

  function handleSelectThumb(index) {
    setActiveIndex(index);
    setDisplayedImage(images[index] || firstImage);
  }

  function handlePrevLightboxImage() {
    if (images.length <= 1) return;
    const prevIndex = (activeIndex - 1 + images.length) % images.length;
    setActiveIndex(prevIndex);
    setDisplayedImage(images[prevIndex] || firstImage);
  }

  function handleNextLightboxImage() {
    if (images.length <= 1) return;
    const nextIndex = (activeIndex + 1) % images.length;
    setActiveIndex(nextIndex);
    setDisplayedImage(images[nextIndex] || firstImage);
  }

  return (
    <div className="space-y-4">
      <div
        data-testid="gallery-main-stage"
        onMouseEnter={handleStageMouseEnter}
        onMouseMove={handleStageMouseMove}
        onMouseLeave={handleStageMouseLeave}
        className="relative aspect-square w-full overflow-hidden rounded-lg border border-stone-200 bg-stone-100"
      >
        <img
          data-testid="gallery-main-image"
          data-zoomed={isZoomed ? "true" : "false"}
          src={resolveAssetUrl(activeImage)}
          alt={productName}
          onError={handleImageError}
          onClick={() => setIsLightboxOpen(true)}
          style={{
            transformOrigin: zoomOrigin,
            transform: isZoomed ? "scale(1.6)" : "scale(1)",
          }}
          className="h-full w-full cursor-zoom-in object-cover transition-transform duration-150"
        />

        <button
          type="button"
          data-testid="gallery-lightbox-open"
          onClick={() => setIsLightboxOpen(true)}
          className="absolute right-3 bottom-3 rounded-md bg-white/90 px-3 py-1.5 text-xs font-medium text-stone-800 shadow-xs backdrop-blur-xs transition hover:bg-white"
        >
          Büyütmek için tıklayın
        </button>
      </div>

      {images.length > 0 ? (
        <div className="flex flex-wrap gap-2.5">
          {images.map((imgPath, index) => {
            const isSelected = index === activeIndex;
            return (
              <button
                key={`${imgPath}-${index}`}
                type="button"
                data-testid={`gallery-thumb-${index}`}
                aria-label={`${productName} görsel ${index + 1}`}
                aria-pressed={isSelected}
                onClick={() => handleSelectThumb(index)}
                className={`h-16 w-16 overflow-hidden rounded-md border-2 transition ${
                  isSelected
                    ? "border-stone-900 ring-1 ring-stone-900"
                    : "border-stone-200 opacity-75 hover:opacity-100"
                }`}
              >
                <img
                  src={resolveAssetUrl(imgPath)}
                  alt=""
                  onError={handleImageError}
                  className="h-full w-full object-cover"
                />
              </button>
            );
          })}
        </div>
      ) : null}

      {isLightboxOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Ürün görseli tam ekran"
          data-testid="gallery-lightbox"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            data-testid="lightbox-backdrop"
            onClick={() => setIsLightboxOpen(false)}
            className="fixed inset-0 bg-stone-950/80 backdrop-blur-xs"
          />

          <div className="relative z-10 flex max-h-[90vh] max-w-4xl items-center justify-center">
            <button
              type="button"
              data-testid="lightbox-close"
              aria-label="Tam ekranı kapat"
              onClick={() => setIsLightboxOpen(false)}
              className="absolute -top-10 right-0 rounded-md bg-white/90 px-3 py-1 text-sm font-medium text-stone-900 shadow-xs hover:bg-white"
            >
              ✕
            </button>

            {images.length > 1 ? (
              <button
                type="button"
                data-testid="lightbox-prev"
                aria-label="Önceki görsel"
                onClick={handlePrevLightboxImage}
                className="mr-3 rounded-full bg-white/90 p-2.5 text-stone-900 shadow-md hover:bg-white"
              >
                ‹
              </button>
            ) : null}

            <img
              data-testid="lightbox-image"
              src={resolveAssetUrl(activeImage)}
              alt={productName}
              onError={handleImageError}
              className="max-h-[82vh] max-w-full rounded-lg object-contain shadow-2xl"
            />

            {images.length > 1 ? (
              <button
                type="button"
                data-testid="lightbox-next"
                aria-label="Sonraki görsel"
                onClick={handleNextLightboxImage}
                className="ml-3 rounded-full bg-white/90 p-2.5 text-stone-900 shadow-md hover:bg-white"
              >
                ›
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
