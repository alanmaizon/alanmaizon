const root = document.documentElement;
root.classList.remove("no-js");
root.classList.add("js");

const THEME_STORAGE_KEY = "alanmaizon-theme-choice";
const THEME_COLORS = {
  light: "#f3efe8",
  dark: "#0f151c",
};

const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const themeMeta = document.querySelector('meta[name="theme-color"]');
const themeButtons = [...document.querySelectorAll(".theme-option")];
const revealElements = [...document.querySelectorAll("[data-reveal]")];
const siteHeader = document.querySelector(".site-header");
const siteNav = document.querySelector(".site-nav");
const navIndicator = siteNav?.querySelector(".nav-indicator") ?? null;
const navLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];
const sections = [...document.querySelectorAll("main section[id]")];

let activeSectionId = "";
let previewLink = null;
let refreshFrame = 0;

const isThemeChoice = (value) => value === "system" || value === "light" || value === "dark";

const readStoredThemeChoice = () => {
  try {
    const storedChoice = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeChoice(storedChoice) ? storedChoice : "system";
  } catch (error) {
    return "system";
  }
};

const getResolvedTheme = (themeChoice) =>
  themeChoice === "system" ? (prefersDarkScheme.matches ? "dark" : "light") : themeChoice;

const syncThemeButtons = (themeChoice) => {
  themeButtons.forEach((button) => {
    const isPressed = button.dataset.themeChoice === themeChoice;
    button.setAttribute("aria-pressed", String(isPressed));
  });
};

const applyTheme = (themeChoice, { persist = false } = {}) => {
  const resolvedTheme = getResolvedTheme(themeChoice);

  root.dataset.themeChoice = themeChoice;
  root.dataset.theme = resolvedTheme;
  syncThemeButtons(themeChoice);

  if (themeMeta) {
    themeMeta.setAttribute("content", THEME_COLORS[resolvedTheme]);
  }

  if (persist) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeChoice);
    } catch (error) {
      // Ignore storage failures and keep the in-memory theme state.
    }
  }

  scheduleRefresh();
};

const getLiveHeaderOffset = () => {
  if (!siteHeader) {
    return 0;
  }

  const headerTop = parseFloat(window.getComputedStyle(siteHeader).top) || 0;
  return Math.ceil(siteHeader.getBoundingClientRect().height + headerTop + 12);
};

const syncHeaderOffset = () => {
  root.style.setProperty("--header-offset", `${getLiveHeaderOffset()}px`);
};

const setActiveLink = (sectionId) => {
  activeSectionId = sectionId || "";

  navLinks.forEach((link) => {
    const targetId = link.getAttribute("href")?.slice(1) ?? "";
    const isActive = targetId === activeSectionId;

    link.classList.toggle("is-active", isActive);

    if (isActive) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  });
};

const getCurrentSectionId = () => {
  if (!sections.length) {
    return "";
  }

  const headerOffset = getLiveHeaderOffset();
  const anchor = headerOffset + Math.min(window.innerHeight * 0.16, 120);

  for (let index = sections.length - 1; index >= 0; index -= 1) {
    const section = sections[index];
    const rect = section.getBoundingClientRect();

    if (rect.top <= anchor && rect.bottom >= anchor) {
      return section.id;
    }
  }

  let nearestSectionId = sections[0].id;
  let nearestDistance = Number.POSITIVE_INFINITY;

  sections.forEach((section) => {
    const distance = Math.abs(section.getBoundingClientRect().top - anchor);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestSectionId = section.id;
    }
  });

  return nearestSectionId;
};

const moveIndicatorToLink = (link) => {
  if (!siteNav || !navIndicator || !link) {
    if (navIndicator) {
      navIndicator.style.opacity = "0";
      navIndicator.style.width = "0px";
    }
    return;
  }

  const navRect = siteNav.getBoundingClientRect();
  const linkRect = link.getBoundingClientRect();
  const x = linkRect.left - navRect.left;
  const y = linkRect.top - navRect.top + linkRect.height - navIndicator.offsetHeight;

  navIndicator.style.width = `${linkRect.width}px`;
  navIndicator.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
  navIndicator.style.opacity = "1";
};

const refreshIndicator = () => {
  if (!navIndicator) {
    return;
  }

  const fallbackLink = navLinks.find((link) => link.classList.contains("is-active")) ?? null;
  moveIndicatorToLink(previewLink ?? fallbackLink);
};

const refreshActiveSection = () => {
  const currentSectionId = getCurrentSectionId();

  if (currentSectionId && currentSectionId !== activeSectionId) {
    setActiveLink(currentSectionId);
  }
};

const refreshUI = () => {
  syncHeaderOffset();
  refreshActiveSection();
  refreshIndicator();
};

const scheduleRefresh = () => {
  if (refreshFrame) {
    return;
  }

  refreshFrame = window.requestAnimationFrame(() => {
    refreshFrame = 0;
    refreshUI();
  });
};

const initializeReveal = () => {
  if (!revealElements.length) {
    return;
  }

  if (prefersReducedMotion) {
    revealElements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -10% 0px" },
  );

  revealElements.forEach((element) => revealObserver.observe(element));
};

const attachThemeEvents = () => {
  themeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextChoice = button.dataset.themeChoice;

      if (!isThemeChoice(nextChoice)) {
        return;
      }

      applyTheme(nextChoice, { persist: true });
    });
  });

  const handleSchemeChange = () => {
    if ((root.dataset.themeChoice || "system") === "system") {
      applyTheme("system");
    }
  };

  if (typeof prefersDarkScheme.addEventListener === "function") {
    prefersDarkScheme.addEventListener("change", handleSchemeChange);
  } else if (typeof prefersDarkScheme.addListener === "function") {
    prefersDarkScheme.addListener(handleSchemeChange);
  }
};

const attachNavEvents = () => {
  if (!siteNav || !navLinks.length) {
    return;
  }

  navLinks.forEach((link) => {
    link.addEventListener("mouseenter", () => {
      previewLink = link;
      scheduleRefresh();
    });

    link.addEventListener("focus", () => {
      previewLink = link;
      scheduleRefresh();
    });

    link.addEventListener("click", () => {
      const targetId = link.getAttribute("href")?.slice(1) ?? "";

      if (targetId) {
        setActiveLink(targetId);
        scheduleRefresh();
      }
    });
  });

  siteNav.addEventListener("mouseleave", () => {
    previewLink = null;
    scheduleRefresh();
  });

  siteNav.addEventListener("focusout", () => {
    window.requestAnimationFrame(() => {
      if (siteNav.contains(document.activeElement)) {
        return;
      }

      previewLink = null;
      scheduleRefresh();
    });
  });
};

const attachLayoutEvents = () => {
  window.addEventListener("scroll", scheduleRefresh, { passive: true });
  window.addEventListener("resize", scheduleRefresh);
  window.addEventListener("orientationchange", scheduleRefresh);
  window.addEventListener("hashchange", scheduleRefresh);
  window.addEventListener("load", scheduleRefresh);

  if ("ResizeObserver" in window && siteHeader) {
    const resizeObserver = new ResizeObserver(() => {
      scheduleRefresh();
    });

    resizeObserver.observe(siteHeader);

    if (siteNav) {
      resizeObserver.observe(siteNav);
    }
  }

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      scheduleRefresh();
    });
  }
};

applyTheme(readStoredThemeChoice());
initializeReveal();
attachThemeEvents();
attachNavEvents();
attachLayoutEvents();

if (sections[0]?.id) {
  setActiveLink(sections[0].id);
}

refreshUI();
