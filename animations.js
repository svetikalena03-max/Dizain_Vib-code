(function () {
  var sections = document.querySelectorAll(".reveal-section");
  if (!sections.length) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    sections.forEach(function (el) {
      el.classList.add("is-revealed");
    });
    return;
  }

  function markVisible(el) {
    el.classList.add("is-revealed");
  }

  function inViewport(el) {
    var r = el.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var top = vh * 0.88;
    var bottom = vh * 0.05;
    return r.top < top && r.bottom > bottom;
  }

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          markVisible(entry.target);
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -6% 0px" }
  );

  sections.forEach(function (el) {
    if (inViewport(el)) {
      markVisible(el);
    } else {
      io.observe(el);
    }
  });
})();
