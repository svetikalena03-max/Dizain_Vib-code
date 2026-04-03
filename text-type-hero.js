/**
 * Эффект набора текста для главного заголовка (адаптация TextType + GSAP).
 * Настройки — объект HERO_TEXT_TYPE ниже.
 * Локальный GSAP: npm install gsap и подключите dist/gsap.min.js вместо CDN.
 */
(function () {
  var CONFIG = {
    texts: [
      "Я делаю сайты, интерфейсы и digital-проекты, которые выглядят как вайб, а работают как система",
      "Собираю digital-опыт, который хочется листать и запоминать.",
      "От первого вайба до готовой страницы — быстро, стильно, со смыслом.",
    ],
    typingSpeed: 28,
    deletingSpeed: 22,
    pauseDuration: 2200,
    loop: true,
    initialDelay: 900,
    showCursor: true,
    cursorCharacter: "_",
    hideCursorWhileTyping: false,
    cursorBlinkDuration: 0.5,
    reverseMode: false,
  };

  var selector = "[data-text-type-hero]";

  function initCursorBlink(cursorEl, duration) {
    if (!cursorEl) return null;
    if (typeof gsap !== "undefined") {
      gsap.set(cursorEl, { opacity: 1 });
      return gsap.to(cursorEl, {
        opacity: 0,
        duration: duration,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut",
      });
    }
    cursorEl.classList.add("text-type__cursor--css");
    return null;
  }

  function runTyping(root, options) {
    var textArray = options.texts.filter(Boolean);
    if (!textArray.length) return;

    var contentEl = root.querySelector(".text-type__content");
    var cursorEl = root.querySelector(".text-type__cursor");
    if (!contentEl) return;

    var typingSpeed = options.typingSpeed;
    var deletingSpeed = options.deletingSpeed;
    var pauseDuration = options.pauseDuration;
    var loop = options.loop;
    var initialDelay = options.initialDelay;
    var showCursor = options.showCursor;
    var hideCursorWhileTyping = options.hideCursorWhileTyping;
    var reverseMode = options.reverseMode;

    if (showCursor && cursorEl) {
      cursorEl.textContent = options.cursorCharacter;
      cursorEl.hidden = false;
      initCursorBlink(cursorEl, options.cursorBlinkDuration);
    } else if (cursorEl) {
      cursorEl.hidden = true;
    }

    var displayedText = "";
    var currentCharIndex = 0;
    var isDeleting = false;
    var currentTextIndex = 0;
    var timeoutId = null;

    function updateCursorVisibility() {
      if (!cursorEl || !hideCursorWhileTyping) return;
      var full = textArray[currentTextIndex] || "";
      var hide = currentCharIndex < full.length || isDeleting;
      cursorEl.classList.toggle("text-type__cursor--hidden", hide);
    }

    function clearTimer() {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    }

    function schedule(fn, ms) {
      clearTimer();
      timeoutId = setTimeout(fn, ms);
    }

    function step() {
      var raw = textArray[currentTextIndex] || "";
      var currentText = reverseMode ? raw.split("").reverse().join("") : raw;

      if (isDeleting) {
        if (displayedText.length === 0) {
          isDeleting = false;
          if (!loop && currentTextIndex === textArray.length - 1) {
            updateCursorVisibility();
            return;
          }
          currentTextIndex = (currentTextIndex + 1) % textArray.length;
          currentCharIndex = 0;
          updateCursorVisibility();
          schedule(step, pauseDuration);
          return;
        }
        displayedText = displayedText.slice(0, -1);
        contentEl.textContent = displayedText;
        updateCursorVisibility();
        schedule(step, deletingSpeed);
        return;
      }

      if (currentCharIndex < currentText.length) {
        displayedText += currentText.charAt(currentCharIndex);
        currentCharIndex++;
        contentEl.textContent = displayedText;
        updateCursorVisibility();
        schedule(step, typingSpeed);
        return;
      }

      if (!loop && currentTextIndex === textArray.length - 1) {
        updateCursorVisibility();
        return;
      }

      schedule(function () {
        isDeleting = true;
        step();
      }, pauseDuration);
    }

    schedule(step, initialDelay);
  }

  function onReady() {
    var root = document.querySelector(selector);
    if (!root) return;

    var texts = CONFIG.texts;
    if (root.dataset.texts) {
      try {
        var parsed = JSON.parse(root.dataset.texts);
        if (Array.isArray(parsed) && parsed.length) texts = parsed;
      } catch (e) {}
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      var contentEl = root.querySelector(".text-type__content");
      var cursorEl = root.querySelector(".text-type__cursor");
      if (contentEl) contentEl.textContent = texts[0] || "";
      if (cursorEl) cursorEl.hidden = true;
      return;
    }

    runTyping(root, {
      texts: texts,
      typingSpeed: Number(root.dataset.typingSpeed) || CONFIG.typingSpeed,
      deletingSpeed: Number(root.dataset.deletingSpeed) || CONFIG.deletingSpeed,
      pauseDuration: Number(root.dataset.pauseDuration) || CONFIG.pauseDuration,
      loop: root.dataset.loop !== "false" && CONFIG.loop,
      initialDelay: Number(root.dataset.initialDelay) || CONFIG.initialDelay,
      showCursor: root.dataset.showCursor !== "false" && CONFIG.showCursor,
      cursorCharacter: root.dataset.cursorCharacter || CONFIG.cursorCharacter,
      hideCursorWhileTyping:
        root.dataset.hideCursorWhileTyping === "true" || CONFIG.hideCursorWhileTyping,
      cursorBlinkDuration:
        Number(root.dataset.cursorBlinkDuration) || CONFIG.cursorBlinkDuration,
      reverseMode: root.dataset.reverseMode === "true" || CONFIG.reverseMode,
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onReady);
  } else {
    onReady();
  }
})();
