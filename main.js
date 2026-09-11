(function () {
  "use strict";

  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "]", e); }
  }

  /* ---------- Mobile nav ---------- */
  function initNav() {
    var toggle = $("[data-nav-toggle]");
    var menu = $("[data-mobile-menu]");
    if (!toggle || !menu) return;

    function close() {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
    function open() {
      menu.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
    }
    toggle.addEventListener("click", function () {
      if (menu.classList.contains("is-open")) close(); else open();
    });
    $$("[data-nav-close]", menu).forEach(function (a) {
      a.addEventListener("click", close);
    });

    var nav = $(".nav");
    var lastY = window.scrollY;
    window.addEventListener("scroll", function () {
      var y = window.scrollY;
      if (nav) nav.style.boxShadow = y > 8 ? "0 8px 24px rgba(11,32,54,0.08)" : "none";
      lastY = y;
    }, { passive: true });
  }

  /* ---------- Smooth anchor scroll (native) ---------- */
  function initSmoothAnchors() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      var navOffset = 76;
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - navOffset,
        behavior: reduced ? "auto" : "smooth"
      });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveals() {
    var targets = $$(".reveal");
    if (!targets.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -2% 0px" });

    targets.forEach(function (el) { io.observe(el); });

    setTimeout(function () {
      $$(".reveal:not(.is-visible)").forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add("is-visible");
        }
      });
    }, 6000);
  }

  /* ---------- FAQ accordion ---------- */
  function initFaq() {
    var items = $$("[data-faq] .faq-item");
    if (!items.length) return;
    items.forEach(function (item) {
      var q = $(".faq-q", item);
      var a = $(".faq-a", item);
      if (!q || !a) return;
      q.addEventListener("click", function () {
        var isOpen = item.classList.contains("is-open");
        items.forEach(function (other) {
          other.classList.remove("is-open");
          $(".faq-q", other).setAttribute("aria-expanded", "false");
        });
        if (!isOpen) {
          item.classList.add("is-open");
          q.setAttribute("aria-expanded", "true");
        }
      });
    });
  }

  /* ---------- Card tilt (subtle, fine pointers only) ---------- */
  function initTilt() {
    if (!fineHover) return;
    var cards = $$(".product-card, .audience-card, .sustain-card, .about-pillar");
    cards.forEach(function (card) {
      var raf = null;
      card.addEventListener("mousemove", function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          var rect = card.getBoundingClientRect();
          var px = (e.clientX - rect.left) / rect.width - 0.5;
          var py = (e.clientY - rect.top) / rect.height - 0.5;
          card.style.transform = "translateY(-4px) rotateX(" + (py * -3.5) + "deg) rotateY(" + (px * 3.5) + "deg)";
          raf = null;
        });
      });
      card.addEventListener("mouseout", function (e) {
        if (card.contains(e.relatedTarget)) return;
        card.style.transform = "";
      });
    });
  }

  /* ---------- Contact form ---------- */
  function initContactForm() {
    var form = $("[data-contact-form]");
    if (!form) return;
    var success = $("[data-form-success]");
    form.addEventListener("submit", function () {
      if (success) success.classList.add("is-visible");
    });
  }

  /* ---------- WhatsApp links from brand data ---------- */
  function initWhatsapp() {
    var brand = window.__BRAND__;
    if (!brand || !brand.contact || !brand.contact.whatsapp) return;
    var digits = brand.contact.whatsapp.replace(/[^0-9]/g, "");
    $$("[data-whatsapp-link]").forEach(function (a) {
      a.setAttribute("href", "https://wa.me/" + digits);
    });
  }

  /* ---------- Boot ---------- */
  function boot() {
    safe(initNav, "initNav");
    safe(initSmoothAnchors, "initSmoothAnchors");
    safe(initReveals, "initReveals");
    safe(initFaq, "initFaq");
    safe(initTilt, "initTilt");
    safe(initContactForm, "initContactForm");
    safe(initWhatsapp, "initWhatsapp");

    if (window.gsap && window.ScrollTrigger) {
      try { gsap.registerPlugin(ScrollTrigger); } catch (_) {}
    }

    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
