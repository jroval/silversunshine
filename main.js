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

  /* ---------- Custom select (branded dropdown) ---------- */
  function initCustomSelect() {
    var widgets = $$("[data-custom-select]");
    if (!widgets.length) return;

    widgets.forEach(function (widget) {
      var trigger = $(".custom-select-trigger", widget);
      var list = $("[data-select-list]", widget);
      var valueLabel = $("[data-select-value]", trigger);
      var hiddenSelect = $("select", widget);
      var options = $$("li[role=\"option\"]", list);
      var activeIndex = options.findIndex(function (o) { return o.classList.contains("is-selected"); });

      function close() {
        widget.classList.remove("is-open");
        list.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
      }
      function open() {
        widget.classList.add("is-open");
        list.hidden = false;
        trigger.setAttribute("aria-expanded", "true");
        var current = options[activeIndex] || options[0];
        if (current) current.focus();
      }
      function selectOption(option) {
        options.forEach(function (o) {
          o.classList.remove("is-selected");
          o.setAttribute("aria-selected", "false");
        });
        option.classList.add("is-selected");
        option.setAttribute("aria-selected", "true");
        activeIndex = options.indexOf(option);
        valueLabel.textContent = option.dataset.value;
        if (hiddenSelect) {
          hiddenSelect.value = option.dataset.value;
          hiddenSelect.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }

      options.forEach(function (option, i) {
        option.setAttribute("tabindex", "-1");
        option.addEventListener("click", function () {
          selectOption(option);
          close();
          trigger.focus();
        });
        option.addEventListener("mouseenter", function () { option.classList.add("is-active"); });
        option.addEventListener("mouseleave", function () { option.classList.remove("is-active"); });
        option.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            selectOption(option);
            close();
            trigger.focus();
          } else if (e.key === "Escape") {
            close();
            trigger.focus();
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            var next = options[Math.min(i + 1, options.length - 1)];
            next.focus();
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            var prev = options[Math.max(i - 1, 0)];
            prev.focus();
          }
        });
      });

      trigger.addEventListener("click", function () {
        if (widget.classList.contains("is-open")) close(); else open();
      });
      trigger.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });

      document.addEventListener("click", function (e) {
        if (!widget.contains(e.target)) close();
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
    safe(initCustomSelect, "initCustomSelect");
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
