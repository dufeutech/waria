import { init } from "./factory";

export interface RouteControls {
  next: () => void;
  cancel: () => void;
  redirect: (path: string) => void;
}

export interface RouteInfo {
  path: string;
  query: Record<string, string>;
}

type BeforeHook = (
  from: RouteInfo,
  to: RouteInfo,
  controls: RouteControls
) => void;
type AfterHook = (from: RouteInfo, to: RouteInfo) => void;

interface RouterConfig {
  sync?: boolean;
  base?: string;
  hash?: boolean;
  native?: boolean;
  before?: BeforeHook;
  after?: AfterHook;
  [key: string]: unknown;
}

// Custom event for route changes - components listen to this
export const ROUTE_CHANGE_EVENT = "w-route-change";

export class App {
  static init(): void {
    init();
  }
  static router(props: RouterConfig = {}): void {
    Router.config(props);
  }
  static start(props: RouterConfig = {}): void {
    Router.config(props);
    init();
  }
}

export class Router {
  static settings: Required<Pick<RouterConfig, "sync" | "base" | "hash" | "native">> & {
    before: BeforeHook;
    after: AfterHook;
  } & Record<string, unknown> = {
    base: "/",
    sync: true,
    hash: false,
    native: false,
    before: (_from, _to, { next }) => next(),
    after: () => {},
  };

  private static currentRoute: string = "";
  private static initialized = false;
  private static isRedirecting = false;

  static config(props: RouterConfig = {}): void {
    this.settings = { ...this.settings, ...props };
    this.initListeners();
  }

  // Normalize path - always returns clean path without # prefix (strips query)
  private static normalizePath(path: string): string {
    // Remove # prefix if present
    let normalized = path.startsWith("#") ? path.slice(1) : path;
    // Remove query string for path normalization
    const queryIndex = normalized.indexOf("?");
    if (queryIndex !== -1) {
      normalized = normalized.slice(0, queryIndex);
    }
    // Ensure starts with /
    if (!normalized.startsWith("/")) {
      normalized = "/" + normalized;
    }
    return normalized;
  }

  // Normalize full route (path + query) - keeps query string
  private static normalizeFullRoute(path: string): string {
    // Remove # prefix if present
    let normalized = path.startsWith("#") ? path.slice(1) : path;
    // Ensure starts with /
    if (!normalized.startsWith("/")) {
      normalized = "/" + normalized;
    }
    return normalized;
  }

  // Extract query string from a path
  private static extractQueryString(path: string): string {
    const queryIndex = path.indexOf("?");
    return queryIndex !== -1 ? path.slice(queryIndex) : "";
  }

  // Parse query string into object
  private static parseQuery(search: string): Record<string, string> {
    const query: Record<string, string> = {};
    const searchStr = search.startsWith("?") ? search.slice(1) : search;
    if (!searchStr) return query;

    const params = new URLSearchParams(searchStr);
    params.forEach((value, key) => {
      query[key] = value;
    });
    return query;
  }

  // Create RouteInfo object from full path (with query)
  private static createRouteInfo(fullPath: string): RouteInfo {
    return {
      path: this.normalizePath(fullPath),
      query: this.parseQuery(this.extractQueryString(fullPath)),
    };
  }

  // Get current full route (path + query, without #)
  static getRoute(): string {
    if (this.settings.hash) {
      const hash = window.location.hash || "#/";
      return this.normalizeFullRoute(hash);
    }
    let pathname = window.location.pathname;
    if (this.settings.base && pathname.startsWith(this.settings.base)) {
      pathname = pathname.slice(this.settings.base.length);
    }
    return (pathname || "/") + window.location.search;
  }

  // Get just the path portion of current route (no query)
  static getPath(): string {
    return this.normalizePath(this.getRoute());
  }

  static get current(): string {
    return this.currentRoute;
  }

  // Actually update the browser URL (fullRoute includes query string)
  private static updateBrowserUrl(fullRoute: string): void {
    if (this.settings.hash) {
      window.location.hash = "#" + fullRoute;
    } else {
      const base = this.settings.base === "/" ? "" : this.settings.base;
      const path = this.normalizePath(fullRoute);
      const query = this.extractQueryString(fullRoute);
      const newPath = base + path + query;
      window.history.pushState({}, "", newPath);
    }
  }

  private static goBack(): void {
    this.isRedirecting = true;
    window.history.back();
  }

  // Notify all components of route change
  private static emitRouteChange(from: string, to: string): void {
    window.dispatchEvent(
      new CustomEvent(ROUTE_CHANGE_EVENT, {
        detail: { from, to },
      })
    );
  }

  // Called by navigate() - runs before hook BEFORE changing URL
  private static setRoute(path: string, skipHook = false): void {
    const fullRoute = this.normalizeFullRoute(path);

    // Don't navigate to current route (compare full route including query)
    if (fullRoute === this.currentRoute) return;

    const fromRoute = this.currentRoute;
    const toRoute = fullRoute;
    const fromInfo = this.createRouteInfo(fromRoute);
    const toInfo = this.createRouteInfo(toRoute);

    if (skipHook) {
      // Skip before hook (redirect/cancel) - just update URL and state
      // Update currentRoute BEFORE browser URL to prevent hashchange double-fire
      this.currentRoute = fullRoute;
      this.updateBrowserUrl(fullRoute);
      this.emitRouteChange(this.normalizePath(fromRoute), this.normalizePath(toRoute));
      this.settings.after(fromInfo, toInfo);
      return;
    }

    // Run before hook BEFORE changing URL
    let handled = false;

    const controls: RouteControls = {
      next: () => {
        if (handled) return;
        handled = true;
        // Update currentRoute BEFORE browser URL to prevent hashchange double-fire
        this.currentRoute = toRoute;
        this.updateBrowserUrl(fullRoute);
        this.emitRouteChange(this.normalizePath(fromRoute), this.normalizePath(toRoute));
        this.settings.after(fromInfo, toInfo);
      },
      cancel: () => {
        if (handled) return;
        handled = true;
        // Don't change anything - URL stays the same
      },
      redirect: (redirectPath: string) => {
        if (handled) return;
        handled = true;
        // Navigate to different path, skip its before hook
        this.setRoute(redirectPath, true);
      },
    };

    this.settings.before(fromInfo, toInfo, controls);
  }

  // Called by browser events (hashchange, popstate) - URL already changed
  private static handleBrowserNavigation = (): void => {
    const newRoute = this.getRoute();
    if (newRoute === this.currentRoute) return;

    const fromRoute = this.currentRoute;
    const toRoute = newRoute;
    const fromInfo = this.createRouteInfo(fromRoute);
    const toInfo = this.createRouteInfo(toRoute);

    // For browser navigation (back/forward), URL is already changed
    // Skip before hook during redirect to avoid loops
    if (this.isRedirecting) {
      this.isRedirecting = false;
      this.currentRoute = newRoute;
      this.emitRouteChange(this.normalizePath(fromRoute), this.normalizePath(toRoute));
      this.settings.after(fromInfo, toInfo);
      return;
    }

    // Run before hook - but URL is already changed by browser
    let handled = false;

    const controls: RouteControls = {
      next: () => {
        if (handled) return;
        handled = true;
        this.currentRoute = toRoute;
        this.emitRouteChange(this.normalizePath(fromRoute), this.normalizePath(toRoute));
        this.settings.after(fromInfo, toInfo);
      },
      cancel: () => {
        if (handled) return;
        handled = true;
        // Restore previous URL
        if (fromRoute) {
          this.isRedirecting = true;
          this.updateBrowserUrl(fromRoute);
        } else {
          this.goBack();
        }
      },
      redirect: (redirectPath: string) => {
        if (handled) return;
        handled = true;
        this.isRedirecting = true;
        const fullRedirect = this.normalizeFullRoute(redirectPath);
        // Update currentRoute BEFORE browser URL to prevent hashchange double-fire
        this.currentRoute = fullRedirect;
        this.updateBrowserUrl(fullRedirect);
        const redirectInfo = this.createRouteInfo(fullRedirect);
        this.emitRouteChange(this.normalizePath(fromRoute), this.normalizePath(fullRedirect));
        this.settings.after(fromInfo, redirectInfo);
      },
    };

    this.settings.before(fromInfo, toInfo, controls);
  };

  private static initListeners(): void {
    if (this.initialized) return;
    this.initialized = true;

    window.addEventListener("hashchange", this.handleBrowserNavigation);
    window.addEventListener("popstate", this.handleBrowserNavigation);

    // Run before hook on initial load
    const initialRoute = this.getRoute();
    const fromInfo = this.createRouteInfo("");
    const toInfo = this.createRouteInfo(initialRoute);

    let handled = false;
    const controls: RouteControls = {
      next: () => {
        if (handled) return;
        handled = true;
        this.currentRoute = initialRoute;
        this.emitRouteChange("", this.normalizePath(initialRoute));
        this.settings.after(fromInfo, toInfo);
      },
      cancel: () => {
        if (handled) return;
        handled = true;
        // Can't really cancel initial load, just don't update state
      },
      redirect: (redirectPath: string) => {
        if (handled) return;
        handled = true;
        const fullRedirect = this.normalizeFullRoute(redirectPath);
        this.currentRoute = fullRedirect;
        this.updateBrowserUrl(fullRedirect);
        const redirectInfo = this.createRouteInfo(fullRedirect);
        this.emitRouteChange("", this.normalizePath(fullRedirect));
        this.settings.after(fromInfo, redirectInfo);
      },
    };

    this.settings.before(fromInfo, toInfo, controls);
  }

  static navigate(path: string): void {
    this.setRoute(path);
  }
}
