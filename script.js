const root = document.documentElement;
root.classList.remove("no-js");
root.classList.add("js");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const revealElements = [...document.querySelectorAll("[data-reveal]")];
const siteHeader = document.querySelector(".site-header");
const siteNav = document.querySelector(".site-nav");
const navIndicator = siteNav?.querySelector(".nav-indicator") ?? null;
const navLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];
const sections = [...document.querySelectorAll("main section[id]")];
const mobileToggle = document.querySelector(".mobile-toggle");
const mobilePanel = document.querySelector(".mobile-panel");

let activeSectionId = "";
let previewLink = null;
let refreshFrame = 0;
let mobileMenuOpen = false;

const MOBILE_BREAKPOINT = 768;

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
    { threshold: 0, rootMargin: "0px 0px -10% 0px" },
  );

  revealElements.forEach((element) => revealObserver.observe(element));
};

const isMobileViewport = () => window.innerWidth <= MOBILE_BREAKPOINT;

const setMobileMenu = (open) => {
  if (!mobileToggle || !mobilePanel) {
    return;
  }

  mobileMenuOpen = open;
  mobileToggle.setAttribute("aria-expanded", String(open));
  mobileToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  mobilePanel.classList.toggle("is-open", open);

  if (!open) {
    mobileToggle.focus();
  }

  scheduleRefresh();
};

const closeMobileMenu = () => {
  if (mobileMenuOpen) {
    setMobileMenu(false);
  }
};

const attachMobileMenuEvents = () => {
  if (!mobileToggle || !mobilePanel) {
    return;
  }

  mobileToggle.addEventListener("click", () => {
    setMobileMenu(!mobileMenuOpen);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && mobileMenuOpen) {
      closeMobileMenu();
    }
  });

  document.addEventListener("click", (event) => {
    if (
      mobileMenuOpen &&
      siteHeader &&
      !siteHeader.contains(event.target)
    ) {
      closeMobileMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (!isMobileViewport() && mobileMenuOpen) {
      setMobileMenu(false);
    }
  });
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

      if (isMobileViewport()) {
        closeMobileMenu();
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

initializeReveal();
attachNavEvents();
attachMobileMenuEvents();
attachLayoutEvents();

if (sections[0]?.id) {
  setActiveLink(sections[0].id);
}

refreshUI();
