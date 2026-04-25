/**
 * Forward classes from a host element to an inner target element.
 *
 * Useful for wrapper components (e.g. w-link, w-label) where the host is a
 * shapeless container and the inner element is what the user actually wants
 * to style. Classes that already exist on the target are preserved; only
 * forwarded classes are tracked for removal when they leave the host.
 *
 * @returns Cleanup function to disconnect the observer.
 */
export function forwardClasses(host: HTMLElement, target: HTMLElement): () => void {
  let forwarded = new Set<string>();

  const sync = (): void => {
    const hostClasses = new Set(host.classList);
    for (const cls of forwarded) {
      if (!hostClasses.has(cls)) target.classList.remove(cls);
    }
    for (const cls of hostClasses) target.classList.add(cls);
    forwarded = hostClasses;
  };

  sync();

  const observer = new MutationObserver(sync);
  observer.observe(host, { attributes: true, attributeFilter: ['class'] });

  return () => observer.disconnect();
}
