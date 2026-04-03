/**
 * MagicBento — vanilla + GSAP (порт @react-bits).
 * Контейнер: [data-magic-bento], сетка: [data-magic-bento-grid], карточки: .magic-bento-card
 */
(function () {
  "use strict";

  var MOBILE_BREAKPOINT = 768;

  function readBool(el, name, fallback) {
    var v = el.getAttribute(name);
    if (v === null || v === "") return fallback;
    return v === "true" || v === "1";
  }

  function readNum(el, name, fallback) {
    var n = parseFloat(el.getAttribute(name) || "");
    return isNaN(n) ? fallback : n;
  }

  function readStr(el, name, fallback) {
    var v = el.getAttribute(name);
    return v === null || v === "" ? fallback : v;
  }

  function calculateSpotlightValues(radius) {
    return {
      proximity: radius * 0.5,
      fadeDistance: radius * 0.75,
    };
  }

  function updateCardGlowProperties(card, mouseX, mouseY, glow, radius) {
    var rect = card.getBoundingClientRect();
    var relativeX = ((mouseX - rect.left) / rect.width) * 100;
    var relativeY = ((mouseY - rect.top) / rect.height) * 100;
    card.style.setProperty("--glow-x", relativeX + "%");
    card.style.setProperty("--glow-y", relativeY + "%");
    card.style.setProperty("--glow-intensity", String(glow));
    card.style.setProperty("--glow-radius", radius + "px");
  }

  function createParticleElement(x, y, color) {
    var el = document.createElement("div");
    el.className = "particle";
    el.style.cssText =
      "position:absolute;width:4px;height:4px;border-radius:50%;background:rgba(" +
      color +
      ",1);box-shadow:0 0 6px rgba(" +
      color +
      ",0.6);pointer-events:none;z-index:100;left:" +
      x +
      "px;top:" +
      y +
      "px;";
    return el;
  }

  function isMobile() {
    return window.innerWidth <= MOBILE_BREAKPOINT;
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function initParticleCard(element, config) {
    if (typeof gsap === "undefined") return function () {};

    var particleCount = config.particleCount;
    var glowColor = config.glowColor;
    var enableTilt = config.enableTilt;
    var enableMagnetism = config.enableMagnetism;
    var clickEffect = config.clickEffect;
    var disableAnimations = config.disableAnimations;

    var timeouts = [];
    var particles = [];
    var isHovered = false;
    var memoizedParticles = [];
    var particlesInitialized = false;
    var magnetismTween = null;

    function clearAllParticles() {
      timeouts.forEach(function (id) {
        clearTimeout(id);
      });
      timeouts = [];
      if (magnetismTween) magnetismTween.kill();

      particles.forEach(function (particle) {
        gsap.to(particle, {
          scale: 0,
          opacity: 0,
          duration: 0.3,
          ease: "back.in(1.7)",
          onComplete: function () {
            if (particle.parentNode) particle.parentNode.removeChild(particle);
          },
        });
      });
      particles = [];
    }

    function initializeParticles() {
      if (particlesInitialized || !element) return;
      var rect = element.getBoundingClientRect();
      var w = rect.width || 200;
      var h = rect.height || 200;
      memoizedParticles = [];
      for (var i = 0; i < particleCount; i++) {
        memoizedParticles.push(createParticleElement(Math.random() * w, Math.random() * h, glowColor));
      }
      particlesInitialized = true;
    }

    function animateParticles() {
      if (!element || !isHovered) return;
      if (!particlesInitialized) initializeParticles();

      memoizedParticles.forEach(function (particle, index) {
        var timeoutId = setTimeout(function () {
          if (!isHovered || !element) return;
          var clone = particle.cloneNode(true);
          element.appendChild(clone);
          particles.push(clone);

          gsap.fromTo(clone, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.7)" });

          gsap.to(clone, {
            x: (Math.random() - 0.5) * 100,
            y: (Math.random() - 0.5) * 100,
            rotation: Math.random() * 360,
            duration: 2 + Math.random() * 2,
            ease: "none",
            repeat: -1,
            yoyo: true,
          });

          gsap.to(clone, {
            opacity: 0.3,
            duration: 1.5,
            ease: "power2.inOut",
            repeat: -1,
            yoyo: true,
          });
        }, index * 100);
        timeouts.push(timeoutId);
      });
    }

    function handleMouseEnter() {
      if (disableAnimations) return;
      isHovered = true;
      animateParticles();
      if (enableTilt) {
        gsap.to(element, {
          rotateX: 5,
          rotateY: 5,
          duration: 0.3,
          ease: "power2.out",
          transformPerspective: 1000,
        });
      }
    }

    function handleMouseLeave() {
      isHovered = false;
      clearAllParticles();
      if (disableAnimations) return;
      if (enableTilt) {
        gsap.to(element, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.3,
          ease: "power2.out",
        });
      }
      if (enableMagnetism) {
        gsap.to(element, { x: 0, y: 0, duration: 0.3, ease: "power2.out" });
      }
    }

    function handleMouseMove(e) {
      if (disableAnimations || (!enableTilt && !enableMagnetism)) return;
      var rect = element.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      var centerX = rect.width / 2;
      var centerY = rect.height / 2;

      if (enableTilt) {
        var rotateX = ((y - centerY) / centerY) * -10;
        var rotateY = ((x - centerX) / centerX) * 10;
        gsap.to(element, {
          rotateX: rotateX,
          rotateY: rotateY,
          duration: 0.1,
          ease: "power2.out",
          transformPerspective: 1000,
        });
      }

      if (enableMagnetism) {
        var magnetX = (x - centerX) * 0.05;
        var magnetY = (y - centerY) * 0.05;
        magnetismTween = gsap.to(element, {
          x: magnetX,
          y: magnetY,
          duration: 0.3,
          ease: "power2.out",
        });
      }
    }

    function handleClick(e) {
      if (!clickEffect || disableAnimations) return;
      var rect = element.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      var maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height)
      );

      var ripple = document.createElement("div");
      ripple.style.cssText =
        "position:absolute;width:" +
        maxDistance * 2 +
        "px;height:" +
        maxDistance * 2 +
        "px;border-radius:50%;background:radial-gradient(circle,rgba(" +
        glowColor +
        ",0.4) 0%,rgba(" +
        glowColor +
        ",0.2) 30%,transparent 70%);left:" +
        (x - maxDistance) +
        "px;top:" +
        (y - maxDistance) +
        "px;pointer-events:none;z-index:1000;";
      element.appendChild(ripple);

      gsap.fromTo(
        ripple,
        { scale: 0, opacity: 1 },
        {
          scale: 1,
          opacity: 0,
          duration: 0.8,
          ease: "power2.out",
          onComplete: function () {
            ripple.remove();
          },
        }
      );
    }

    element.addEventListener("mouseenter", handleMouseEnter);
    element.addEventListener("mouseleave", handleMouseLeave);
    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("click", handleClick);

    return function destroy() {
      isHovered = false;
      element.removeEventListener("mouseenter", handleMouseEnter);
      element.removeEventListener("mouseleave", handleMouseLeave);
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("click", handleClick);
      clearAllParticles();
    };
  }

  function initCardNoStars(el, config) {
    if (typeof gsap === "undefined") return function () {};
    var enableTilt = config.enableTilt;
    var enableMagnetism = config.enableMagnetism;
    var clickEffect = config.clickEffect;
    var glowColor = config.glowColor;
    var disableAnimations = config.disableAnimations;

    function handleMouseMove(e) {
      if (disableAnimations) return;
      var rect = el.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      var centerX = rect.width / 2;
      var centerY = rect.height / 2;

      if (enableTilt) {
        var rotateX = ((y - centerY) / centerY) * -10;
        var rotateY = ((x - centerX) / centerX) * 10;
        gsap.to(el, {
          rotateX: rotateX,
          rotateY: rotateY,
          duration: 0.1,
          ease: "power2.out",
          transformPerspective: 1000,
        });
      }
      if (enableMagnetism) {
        gsap.to(el, {
          x: (x - centerX) * 0.05,
          y: (y - centerY) * 0.05,
          duration: 0.3,
          ease: "power2.out",
        });
      }
    }

    function handleMouseLeave() {
      if (disableAnimations) return;
      if (enableTilt) {
        gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.3, ease: "power2.out" });
      }
      if (enableMagnetism) {
        gsap.to(el, { x: 0, y: 0, duration: 0.3, ease: "power2.out" });
      }
    }

    function handleClick(e) {
      if (!clickEffect || disableAnimations) return;
      var rect = el.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      var maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height)
      );
      var ripple = document.createElement("div");
      ripple.style.cssText =
        "position:absolute;width:" +
        maxDistance * 2 +
        "px;height:" +
        maxDistance * 2 +
        "px;border-radius:50%;background:radial-gradient(circle,rgba(" +
        glowColor +
        ",0.4) 0%,rgba(" +
        glowColor +
        ",0.2) 30%,transparent 70%);left:" +
        (x - maxDistance) +
        "px;top:" +
        (y - maxDistance) +
        "px;pointer-events:none;z-index:1000;";
      el.appendChild(ripple);
      gsap.fromTo(
        ripple,
        { scale: 0, opacity: 1 },
        {
          scale: 1,
          opacity: 0,
          duration: 0.8,
          ease: "power2.out",
          onComplete: function () {
            ripple.remove();
          },
        }
      );
    }

    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);
    el.addEventListener("click", handleClick);

    return function () {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
      el.removeEventListener("click", handleClick);
    };
  }

  function initGlobalSpotlight(gridEl, options) {
    if (typeof gsap === "undefined") return function () {};

    var spotlightRadius = options.spotlightRadius;
    var glowColor = options.glowColor;
    var disableAnimations = options.disableAnimations;

    var spotlight = document.createElement("div");
    spotlight.className = "global-spotlight";
    spotlight.style.cssText =
      "position:fixed;width:800px;height:800px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,rgba(" +
      glowColor +
      ",0.15) 0%,rgba(" +
      glowColor +
      ",0.08) 15%,rgba(" +
      glowColor +
      ",0.04) 25%,rgba(" +
      glowColor +
      ",0.02) 40%,rgba(" +
      glowColor +
      ",0.01) 65%,transparent 70%);z-index:95;opacity:0;transform:translate(-50%,-50%);mix-blend-mode:screen;left:0;top:0;";
    document.body.appendChild(spotlight);

    function handleMouseMove(e) {
      if (!spotlight || !gridEl) return;
      var section = gridEl.closest(".bento-section");
      var rect = section ? section.getBoundingClientRect() : null;
      var mouseInside =
        rect &&
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      var cards = gridEl.querySelectorAll(".magic-bento-card");

      if (!mouseInside) {
        gsap.to(spotlight, { opacity: 0, duration: 0.3, ease: "power2.out" });
        cards.forEach(function (card) {
          card.style.setProperty("--glow-intensity", "0");
        });
        return;
      }

      var sv = calculateSpotlightValues(spotlightRadius);
      var proximity = sv.proximity;
      var fadeDistance = sv.fadeDistance;
      var minDistance = Infinity;

      cards.forEach(function (cardElement) {
        var cardRect = cardElement.getBoundingClientRect();
        var centerX = cardRect.left + cardRect.width / 2;
        var centerY = cardRect.top + cardRect.height / 2;
        var distance =
          Math.hypot(e.clientX - centerX, e.clientY - centerY) - Math.max(cardRect.width, cardRect.height) / 2;
        var effectiveDistance = Math.max(0, distance);
        minDistance = Math.min(minDistance, effectiveDistance);

        var glowIntensity = 0;
        if (effectiveDistance <= proximity) {
          glowIntensity = 1;
        } else if (effectiveDistance <= fadeDistance) {
          glowIntensity = (fadeDistance - effectiveDistance) / (fadeDistance - proximity);
        }
        updateCardGlowProperties(cardElement, e.clientX, e.clientY, glowIntensity, spotlightRadius);
      });

      gsap.to(spotlight, {
        left: e.clientX,
        top: e.clientY,
        duration: 0.1,
        ease: "power2.out",
      });

      var targetOpacity =
        minDistance <= proximity
          ? 0.8
          : minDistance <= fadeDistance
            ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8
            : 0;

      gsap.to(spotlight, {
        opacity: targetOpacity,
        duration: targetOpacity > 0 ? 0.2 : 0.5,
        ease: "power2.out",
      });
    }

    function handleMouseLeaveDoc() {
      gridEl.querySelectorAll(".magic-bento-card").forEach(function (card) {
        card.style.setProperty("--glow-intensity", "0");
      });
      if (spotlight) {
        gsap.to(spotlight, { opacity: 0, duration: 0.3, ease: "power2.out" });
      }
    }

    if (!disableAnimations) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseleave", handleMouseLeaveDoc);
    }

    return function () {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeaveDoc);
      if (spotlight && spotlight.parentNode) spotlight.parentNode.removeChild(spotlight);
    };
  }

  function initRoot(root) {
    var gridEl = root.querySelector("[data-magic-bento-grid]");
    if (!gridEl) return;

    var glowColor = readStr(root, "data-glow-color", "201, 184, 255");
    root.style.setProperty("--magic-glow-rgb", glowColor);

    var disableAnimations =
      readBool(root, "data-disable-animations", false) || prefersReducedMotion() || isMobile();

    var enableStars = readBool(root, "data-enable-stars", true);
    var enableSpotlight = readBool(root, "data-enable-spotlight", true);
    var enableTilt = readBool(root, "data-enable-tilt", false);
    var enableMagnetism = readBool(root, "data-enable-magnetism", false);
    var clickEffect = readBool(root, "data-click-effect", true);
    var particleCount = Math.round(readNum(root, "data-particle-count", 12));
    var spotlightRadius = readNum(root, "data-spotlight-radius", 400);

    var textAutoHide = readBool(root, "data-text-auto-hide", true);
    var enableBorderGlow = readBool(root, "data-enable-border-glow", true);

    var cards = gridEl.querySelectorAll(".magic-bento-card");
    cards.forEach(function (card) {
      card.style.setProperty("--magic-glow-rgb", glowColor);
      if (textAutoHide) card.classList.add("magic-bento-card--text-autohide");
      else card.classList.remove("magic-bento-card--text-autohide");
      if (enableBorderGlow) card.classList.add("magic-bento-card--border-glow");
      else card.classList.remove("magic-bento-card--border-glow");
      if (enableStars) card.classList.add("particle-container");
      else card.classList.remove("particle-container");
    });

    var cleanups = [];

    if (enableSpotlight && !disableAnimations) {
      cleanups.push(
        initGlobalSpotlight(gridEl, {
          spotlightRadius: spotlightRadius,
          glowColor: glowColor,
          disableAnimations: disableAnimations,
        })
      );
    }

    var cardConfig = {
      particleCount: particleCount,
      glowColor: glowColor,
      enableTilt: enableTilt,
      clickEffect: clickEffect,
      enableMagnetism: enableMagnetism,
      disableAnimations: disableAnimations,
    };

    cards.forEach(function (card) {
      if (disableAnimations) return;
      if (enableStars) {
        cleanups.push(initParticleCard(card, cardConfig));
      } else {
        cleanups.push(initCardNoStars(card, cardConfig));
      }
    });

    root._magicBentoCleanup = function () {
      cleanups.forEach(function (fn) {
        if (typeof fn === "function") fn();
      });
    };
  }

  function boot() {
    document.querySelectorAll("[data-magic-bento]").forEach(initRoot);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
