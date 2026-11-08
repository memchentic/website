type ZoomableShotProps = {
  src: string;
  alt: string;
  caption: string;
  width?: number;
  height?: number;
  onZoom: () => void;
};

/** Product screenshot that opens a lightbox on click. */
export function ZoomableShot({
  src,
  alt,
  caption,
  width = 1440,
  height = 900,
  onZoom,
}: ZoomableShotProps) {
  return (
    <figure>
      <button
        type="button"
        className="shot-zoom"
        onClick={onZoom}
        aria-label={`Enlarge: ${caption}`}
      >
        <span className="shot-frame">
          <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            loading="lazy"
            decoding="async"
          />
        </span>
        <span className="shot-zoom-hint" aria-hidden="true">
          Click to enlarge
        </span>
      </button>
      <figcaption className="shot-caption">{caption}</figcaption>
    </figure>
  );
}
