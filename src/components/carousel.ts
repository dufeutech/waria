import { defineComponent } from "../factory";
import { setAriaLabel, ensureId, announcePolite } from "../aria";
import { SLOT, ARIA, KEY } from "../constants";

interface CarouselElement extends HTMLElement {
  label: string;
  current: number;
  autoplay: boolean;
  interval: number;
  loop: boolean;
}

defineComponent({
  tag: "w-carousel",

  props: [
    { name: "label", type: String, default: "Carousel" },
    { name: "current", type: Number, default: 0 },
    { name: "autoplay", type: Boolean, default: false },
    { name: "interval", type: Number, default: 5000 },
    { name: "loop", type: Boolean, default: true },
  ],

  children: {
    content: SLOT.content,
    items: { selector: SLOT.item, multiple: true },
    prev: SLOT.prev,
    next: SLOT.next,
    indicators: SLOT.indicators,
  },

  events: {
    click: [
      {
        selector: SLOT.prev,
        handler: "handlePrevClick",
      },
      {
        selector: SLOT.next,
        handler: "handleNextClick",
      },
      {
        selector: "[data-indicator]",
        handler: "handleIndicatorClick",
      },
    ],
    keydown: {
      handler: "handleKeyDown",
    },
  },

  aria: {
    role: "group",
  },

  setup(ctx) {
    const el = ctx.element as unknown as CarouselElement;

    let autoplayTimer: ReturnType<typeof setInterval> | null = null;
    let isPaused = false;

    const getItems = (): HTMLElement[] => {
      return Array.from(ctx.element.querySelectorAll<HTMLElement>(SLOT.item));
    };

    const getIndicators = (): HTMLElement | null =>
      ctx.query<HTMLElement>(SLOT.indicators);
    const getPrev = (): HTMLElement | null => ctx.query<HTMLElement>(SLOT.prev);
    const getNext = (): HTMLElement | null => ctx.query<HTMLElement>(SLOT.next);

    const updateAria = (): void => {
      setAriaLabel(ctx.element, el.label);
      ctx.element.setAttribute(ARIA.roledescription, "carousel");

      const items = getItems();
      const prev = getPrev();
      const next = getNext();

      // Update items
      items.forEach((item, index) => {
        item.setAttribute("role", "group");
        item.setAttribute(ARIA.roledescription, "slide");
        item.setAttribute(
          ARIA.label,
          item.getAttribute(ARIA.label) ||
            `Slide ${index + 1} of ${items.length}`
        );
        ensureId(item, "w-carousel-item");

        // Show/hide slides
        const isActive = index === el.current;
        item.hidden = !isActive;
        item.setAttribute(ARIA.hidden, String(!isActive));

        if (isActive) {
          item.setAttribute("tabindex", "0");
        } else {
          item.removeAttribute("tabindex");
        }
      });

      // Update navigation buttons
      if (prev) {
        prev.setAttribute(ARIA.label, "Previous slide");
        if (!el.loop && el.current === 0) {
          prev.setAttribute("disabled", "");
          prev.setAttribute(ARIA.disabled, "true");
        } else {
          prev.removeAttribute("disabled");
          prev.removeAttribute(ARIA.disabled);
        }
      }

      if (next) {
        next.setAttribute(ARIA.label, "Next slide");
        if (!el.loop && el.current === items.length - 1) {
          next.setAttribute("disabled", "");
          next.setAttribute(ARIA.disabled, "true");
        } else {
          next.removeAttribute("disabled");
          next.removeAttribute(ARIA.disabled);
        }
      }

      // Update indicators
      updateIndicators();
    };

    const updateIndicators = (): void => {
      const indicatorsContainer = getIndicators();
      const items = getItems();

      if (!indicatorsContainer) return;

      indicatorsContainer.setAttribute("role", "tablist");
      indicatorsContainer.setAttribute(ARIA.label, "Slide controls");

      // Create or update indicator buttons
      let indicators = Array.from(
        indicatorsContainer.querySelectorAll<HTMLElement>("[data-indicator]")
      );

      // Create indicators if they don't exist
      if (indicators.length === 0) {
        items.forEach((_item, index) => {
          const indicator = document.createElement("button");
          indicator.setAttribute("data-indicator", String(index));
          indicator.setAttribute("type", "button");
          indicatorsContainer.appendChild(indicator);
        });
        indicators = Array.from(
          indicatorsContainer.querySelectorAll<HTMLElement>("[data-indicator]")
        );
      }

      // Update indicator state
      indicators.forEach((indicator, index) => {
        const isActive = index === el.current;
        indicator.setAttribute("role", "tab");
        indicator.setAttribute(ARIA.label, `Go to slide ${index + 1}`);
        indicator.setAttribute(ARIA.selected, String(isActive));
        indicator.setAttribute("tabindex", isActive ? "0" : "-1");

        if (isActive) {
          indicator.classList.add("active");
        } else {
          indicator.classList.remove("active");
        }
      });
    };

    const goToSlide = (index: number, announce = true): void => {
      const items = getItems();
      let newIndex = index;

      if (el.loop) {
        if (newIndex < 0) newIndex = items.length - 1;
        if (newIndex >= items.length) newIndex = 0;
      } else {
        newIndex = Math.max(0, Math.min(newIndex, items.length - 1));
      }

      if (newIndex === el.current) return;

      const oldIndex = el.current;
      el.current = newIndex;
      updateAria();

      ctx.emit("change", {
        current: newIndex,
        previous: oldIndex,
        slide: items[newIndex],
      });

      if (announce) {
        announcePolite(`Slide ${newIndex + 1} of ${items.length}`);
      }
    };

    const next = (): void => {
      goToSlide(el.current + 1);
    };

    const prev = (): void => {
      goToSlide(el.current - 1);
    };

    const startAutoplay = (): void => {
      if (autoplayTimer || !el.autoplay) return;

      autoplayTimer = setInterval(() => {
        if (!isPaused) {
          next();
        }
      }, el.interval);
    };

    const stopAutoplay = (): void => {
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    };

    const pause = (): void => {
      isPaused = true;
      ctx.element.setAttribute(ARIA.live, "polite");
    };

    const resume = (): void => {
      isPaused = false;
      if (el.autoplay) {
        ctx.element.setAttribute(ARIA.live, "off");
      }
    };

    // Initial setup
    updateAria();

    if (el.autoplay) {
      ctx.element.setAttribute(ARIA.live, "off");
      startAutoplay();
    } else {
      ctx.element.setAttribute(ARIA.live, "polite");
    }

    Object.assign(ctx.element, {
      handlePrevClick(): void {
        prev();
      },

      handleNextClick(): void {
        next();
      },

      handleIndicatorClick(_e: Event, target: HTMLElement): void {
        const index = parseInt(
          target.getAttribute("data-indicator") ?? "0",
          10
        );
        goToSlide(index);
      },

      handleKeyDown(e: KeyboardEvent): void {
        switch (e.key) {
          case KEY.ArrowLeft:
            e.preventDefault();
            prev();
            break;

          case KEY.ArrowRight:
            e.preventDefault();
            next();
            break;

          case KEY.Home:
            e.preventDefault();
            goToSlide(0);
            break;

          case KEY.End:
            e.preventDefault();
            goToSlide(getItems().length - 1);
            break;
        }
      },

      // Public API
      next(): void {
        next();
      },

      prev(): void {
        prev();
      },

      goTo(index: number): void {
        goToSlide(index);
      },

      play(): void {
        el.autoplay = true;
        startAutoplay();
      },

      stop(): void {
        el.autoplay = false;
        stopAutoplay();
      },

      pause(): void {
        pause();
      },

      resume(): void {
        resume();
      },
    });

    // Pause on hover/focus
    ctx.element.addEventListener("mouseenter", pause);
    ctx.element.addEventListener("mouseleave", resume);
    ctx.element.addEventListener("focusin", pause);
    ctx.element.addEventListener("focusout", resume);

    ctx.onCleanup(() => {
      stopAutoplay();
      ctx.element.removeEventListener("mouseenter", pause);
      ctx.element.removeEventListener("mouseleave", resume);
      ctx.element.removeEventListener("focusin", pause);
      ctx.element.removeEventListener("focusout", resume);
    });

    // Watch for attribute changes
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          ["label", "current", "loop"].includes(mutation.attributeName ?? "")
        ) {
          updateAria();
        }
        if (mutation.attributeName === "autoplay") {
          if (el.autoplay) {
            startAutoplay();
          } else {
            stopAutoplay();
          }
        }
        if (mutation.attributeName === "interval") {
          stopAutoplay();
          startAutoplay();
        }
      }
    });

    observer.observe(ctx.element, { attributes: true });

    // Watch for child changes
    const childObserver = new MutationObserver(() => {
      updateAria();
    });

    childObserver.observe(ctx.element, { childList: true, subtree: true });

    ctx.onCleanup(() => {
      observer.disconnect();
      childObserver.disconnect();
    });
  },
});

export {};
