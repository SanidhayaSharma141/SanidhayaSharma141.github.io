(function () {
  "use strict";

  const header = document.querySelector(".site-header");
  const backToTop = document.querySelector(".back-to-top");
  const navLinks = [...document.querySelectorAll(".nav-link[href^='#']")];
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;

      event.preventDefault();
      const offset = header ? header.offsetHeight + 12 : 0;
      window.scrollTo({
        top: target.offsetTop - offset,
        behavior: "smooth"
      });

      const nav = document.querySelector(".navbar-collapse.show");
      if (nav && window.bootstrap) {
        window.bootstrap.Collapse.getOrCreateInstance(nav).hide();
      }
    });
  });

  const toggleBackToTop = () => {
    if (!backToTop) return;
    backToTop.classList.toggle("active", window.scrollY > 360);
  };

  const setActiveNav = () => {
    const offset = (header ? header.offsetHeight : 0) + 120;
    const current = sections.findLast
      ? sections.findLast((section) => section.offsetTop <= window.scrollY + offset)
      : [...sections].reverse().find((section) => section.offsetTop <= window.scrollY + offset);

    navLinks.forEach((link) => {
      link.classList.toggle("active", current && link.getAttribute("href") === `#${current.id}`);
    });
  };

  window.addEventListener("load", toggleBackToTop);
  window.addEventListener("load", setActiveNav);
  document.addEventListener("scroll", toggleBackToTop);
  document.addEventListener("scroll", setActiveNav);

  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18 });

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("visible"));
  }

  if (window.GLightbox) {
    window.GLightbox({
      selector: ".portfolio-lightbox"
    });
  }
})();
