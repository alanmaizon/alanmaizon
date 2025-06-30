document.addEventListener("DOMContentLoaded", function () {
  const original = document.querySelector(".icon-carousel");
  const track = document.querySelector(".carousel-track");

  // Clone the original icons
  const clone = original.cloneNode(true);
  clone.classList.add("cloned");

  // Create a gap element
  const gap = document.createElement("div");
  gap.className = "loop-gap";

  // Append original + gap + clone
  track.appendChild(gap);
  track.appendChild(clone);

  let scrollPos = 0;
  const scrollStep = 1;

  function loopScroll() {
    scrollPos += scrollStep;

    const singleWidth = original.scrollWidth + gap.offsetWidth;

    if (scrollPos >= singleWidth) {
      scrollPos = 0;
    }

    track.style.transform = `translateX(-${scrollPos}px)`;
    requestAnimationFrame(loopScroll);
  }

  loopScroll();

  // Hammer swipe support
  const hammer = new Hammer(track);
  hammer.get('swipe').set({ direction: Hammer.DIRECTION_HORIZONTAL });

  hammer.on('swipeleft', () => {
    scrollPos += 100;
  });

  hammer.on('swiperight', () => {
    scrollPos -= 100;
    if (scrollPos < 0) scrollPos = 0;
  });
});
