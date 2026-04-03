/**
 * Скролл-стек отзывов (аналог ContainerScroll + CardTransformed).
 */
(function () {
  "use strict";

  var root = document.querySelector("[data-testimonials]");
  if (!root) return;

  var scroller = root.querySelector(".testimonials-scroller");
  var stack = root.querySelector(".testimonials-stack");
  var cards = stack ? stack.querySelectorAll(".testimonial-card") : [];

  if (!scroller || !stack || !cards.length) return;

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function updateStack() {
    if (root.classList.contains("testimonials--static")) return;

    var rect = scroller.getBoundingClientRect();
    var range = scroller.offsetHeight - window.innerHeight;
    if (range <= 0) return;

    var progress = clamp(-rect.top / range, 0, 1);
    var n = cards.length;
    var i;

    /*
     * Плавающий индекс «центра» стопки: 0 → первая карточка по центру, 1 → вторая, …
     * Карточки смещены по Y пропорционально (i - floatIdx), поэтому всегда видно
     * текущую и соседние (сверху ушедшие + снизу следующие).
     */
    var floatIdx = n <= 1 ? 0 : progress * (n - 1);
    var stepY = 78;

    for (i = 0; i < n; i++) {
      var card = cards[i];
      var offset = i - floatIdx;
      var absOff = Math.abs(offset);
      var translateY = offset * stepY;
      var scale = clamp(1 - absOff * 0.055, 0.86, 1);
      var opacity = clamp(1 - absOff * 0.24, 0.32, 1);
      if (absOff <= 0.35) opacity = 1;
      else if (absOff <= 1.05) opacity = clamp(0.88 - (absOff - 0.35) * 0.2, 0.55, 0.95);
      var rotZ = offset * 2.2;
      var z = 80 - Math.round(absOff * 22);

      card.style.zIndex = String(z);
      card.style.opacity = String(opacity);
      card.style.transform =
        "translate(-50%, -50%) translateY(" +
        translateY +
        "px) rotateZ(" +
        rotZ +
        "deg) scale(" +
        scale +
        ")";
    }
  }

  function onScroll() {
    window.requestAnimationFrame(updateStack);
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    root.classList.add("testimonials--static");
    return;
  }

  updateStack();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
})();
