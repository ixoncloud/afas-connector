export function createResizeObserver(
  rootEl: HTMLDivElement,
  onResize: (height: number) => void
): ResizeObserver {
  const resizeObserver = new ResizeObserver((entries) => {
    entries.forEach((entry) => {
      onResize(entry.contentRect.height);
    });
  });
  resizeObserver.observe(rootEl);

  return resizeObserver;
}
