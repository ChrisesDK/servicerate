const isMobileKiosk =
  /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
  navigator.userAgentData?.mobile === true;

document.documentElement.classList.toggle("is-mobile-kiosk", isMobileKiosk);

const syncMobileOrientation = () => {
  const screenIsLandscape = screen.orientation?.type?.startsWith("landscape") ?? false;
  const viewportIsLandscape = window.innerWidth > window.innerHeight;

  document.documentElement.classList.toggle(
    "is-mobile-landscape",
    isMobileKiosk && (screenIsLandscape || viewportIsLandscape),
  );
};

syncMobileOrientation();
window.addEventListener("resize", syncMobileOrientation);
screen.orientation?.addEventListener?.("change", syncMobileOrientation);

const ratingButtons = [...document.querySelectorAll("[data-rating]")];
const ratingReactions = document.querySelector("#rating-reactions");
const victimNumber = document.querySelector("#victim-number");
const ticketCaption = document.querySelector("#ticket-caption");
const menuButton = document.querySelector("#menu-button");
const menuModal = document.querySelector("#menu-modal");
const closeMenuButton = document.querySelector("#close-menu");
const menuHome = document.querySelector("#menu-home");
const qrView = document.querySelector("#qr-view");
const qrName = document.querySelector("#qr-name");
const qrHandle = document.querySelector("#qr-handle");
const qrHeading = document.querySelector("#qr-heading");
const qrArt = document.querySelector("#qr-art");
const qrImage = document.querySelector("#qr-image");
const qrCanvas = document.querySelector("#qr-canvas");
const qrButtons = [...document.querySelectorAll("[data-qr-name]")];
const statRows = [...document.querySelectorAll("[data-stat]")];
const statsTotal = document.querySelector("#stats-total");

let servingNumber = 1;
let selectionResetTimer;
let emphasisResetTimer;
let reactionResetTimer;
let qrAnimationFrame;
let qrAnimationToken = 0;
let activeQrMask = "";
let activeQrSeed = 0;

const sessionRatings = {
  awful: 0,
  meh: 0,
  good: 0,
  great: 0,
};

const reactionSets = {
  awful: [
    ...Array(9).fill("🧄"),
    ...Array(3).fill("💀"),
  ],
  meh: [
    ...Array(8).fill("🥀"),
    ...Array(4).fill("🩸"),
  ],
  good: Array(12).fill("🦇"),
  great: [
    ...Array(12).fill("🦇"),
    ...Array(3).fill("❤️"),
  ],
};

const tryEnterFullscreen = () => {
  const isCompactDevice =
    isMobileKiosk || window.matchMedia("(max-width: 900px), (max-height: 500px)").matches;

  if (!isCompactDevice || document.fullscreenElement || !document.documentElement.requestFullscreen) return;

  document.documentElement
    .requestFullscreen({ navigationUI: "hide" })
    .then(() => document.removeEventListener("pointerdown", tryEnterFullscreen, true))
    .catch(() => {
      // Fullscreen availability varies by browser; a later tap may try again.
    });
};

const formatVictimNumber = (number) => `V-${String(number).padStart(3, "0")}`;

const showServingNumber = (caption = "Now serving") => {
  ticketCaption.textContent = caption;
  victimNumber.textContent = formatVictimNumber(servingNumber);
};

const renderStats = () => {
  const counts = Object.values(sessionRatings);
  const total = counts.reduce((sum, count) => sum + count, 0);
  const largestCount = Math.max(1, ...counts);

  statsTotal.textContent = `${total} ${total === 1 ? "vote" : "votes"}`;

  statRows.forEach((row) => {
    const count = sessionRatings[row.dataset.stat];
    row.style.setProperty("--bar-width", `${(count / largestCount) * 100}%`);
    row.querySelector("strong").textContent = String(count);
  });
};

const shuffle = (items) => {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
};

const releaseReaction = (rating) => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  window.clearTimeout(reactionResetTimer);
  ratingReactions.replaceChildren();

  shuffle(reactionSets[rating]).forEach((emoji) => {
    const particle = document.createElement("span");
    particle.className = `reaction-particle reaction-particle--${rating}`;
    particle.textContent = emoji;
    particle.style.setProperty("--start-y", `${5 + Math.random() * 64}%`);
    particle.style.setProperty("--size", `${1.15 + Math.random() * 1.9}rem`);
    particle.style.setProperty("--duration", `${2 + Math.random() * 1.35}s`);
    particle.style.setProperty("--delay", `${Math.random() * 0.55}s`);
    particle.style.setProperty("--wobble", `${-18 + Math.random() * 36}deg`);
    ratingReactions.append(particle);
  });

  reactionResetTimer = window.setTimeout(() => ratingReactions.replaceChildren(), 4400);
};

const chooseRating = (button) => {
  const selectedRating = button.dataset.rating;

  servingNumber += 1;
  sessionRatings[selectedRating] += 1;
  showServingNumber("Next fanged customer");
  renderStats();

  ratingButtons.forEach((item) => {
    const isSelected = item === button;
    item.classList.toggle("is-selected", isSelected);
    item.classList.toggle("is-dimmed", !isSelected);
    item.setAttribute("aria-pressed", String(isSelected));
  });

  window.clearTimeout(emphasisResetTimer);
  emphasisResetTimer = window.setTimeout(() => {
    ratingButtons.forEach((item) => item.classList.remove("is-dimmed"));
  }, 250);

  window.clearTimeout(selectionResetTimer);
  selectionResetTimer = window.setTimeout(resetRating, 1100);

  releaseReaction(selectedRating);
};

const resetRating = () => {
  ratingButtons.forEach((button) => {
    button.classList.remove("is-selected", "is-dimmed");
    button.setAttribute("aria-pressed", "false");
  });
  showServingNumber();
};

const stopQrAnimation = () => {
  qrAnimationToken += 1;
  window.cancelAnimationFrame(qrAnimationFrame);
  qrAnimationFrame = undefined;
  qrArt.classList.remove("is-animated");
  qrCanvas.width = qrCanvas.width;
};

const loadQrMask = (source) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });

const startQrAnimation = async (maskSource, seed) => {
  stopQrAnimation();

  if (!maskSource || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const token = qrAnimationToken;

  try {
    const mask = await loadQrMask(maskSource);
    if (token !== qrAnimationToken || qrView.hidden) return;

    const renderWidth = Math.min(640, mask.naturalWidth);
    const renderHeight = Math.round(renderWidth * (mask.naturalHeight / mask.naturalWidth));
    const paintCanvas = document.createElement("canvas");
    const paintContext = paintCanvas.getContext("2d");
    const context = qrCanvas.getContext("2d", { alpha: false });

    if (!paintContext || !context) return;

    qrCanvas.width = renderWidth;
    qrCanvas.height = renderHeight;
    paintCanvas.width = renderWidth;
    paintCanvas.height = renderHeight;

    const blobs = [
      { anchorX: 0.16, drift: 0.14, span: 0.46, radius: 0.34, period: 8200, phase: 0.4 + seed, color: "232, 59, 83" },
      { anchorX: 0.76, drift: 0.13, span: 0.43, radius: 0.31, period: 9400, phase: 2.2 + seed, color: "139, 4, 39" },
      { anchorX: 0.46, drift: 0.16, span: 0.4, radius: 0.38, period: 10400, phase: 4.5 + seed, color: "232, 59, 83" },
      { anchorX: 0.82, drift: 0.1, span: 0.45, radius: 0.32, period: 8800, phase: 5.7 + seed, color: "111, 0, 27" },
      { anchorX: 0.24, drift: 0.12, span: 0.42, radius: 0.29, period: 9900, phase: 3.3 + seed, color: "200, 25, 58" },
    ];
    const fullTurn = Math.PI * 2;
    let previousFrameTime;
    let motionTime = 0;

    const drawFrame = (time) => {
      if (token !== qrAnimationToken || qrView.hidden) return;

      // Advance on every display frame. Capping a delayed frame prevents a
      // visible jump when the tab or installed app returns from the background.
      const elapsed = previousFrameTime === undefined ? 0 : Math.min(time - previousFrameTime, 34);
      previousFrameTime = time;
      motionTime += elapsed;

      paintContext.globalCompositeOperation = "source-over";
      paintContext.clearRect(0, 0, renderWidth, renderHeight);

      const base = paintContext.createLinearGradient(0, 0, renderWidth, renderHeight);
      base.addColorStop(0, "#26040c");
      base.addColorStop(0.52, "#590014");
      base.addColorStop(1, "#31050e");
      paintContext.fillStyle = base;
      paintContext.fillRect(0, 0, renderWidth, renderHeight);

      // Soft, overlapping ellipses use different loop lengths and curved paths.
      // Screen blending makes neighboring blobs flow together like a lava lamp.
      paintContext.globalCompositeOperation = "screen";
      blobs.forEach((blob) => {
        const angle = (motionTime / blob.period) * fullTurn + blob.phase;
        const wobble = Math.sin(angle * 2 + blob.phase) * blob.drift * 0.34;
        const x = (blob.anchorX + Math.sin(angle) * blob.drift + wobble) * renderWidth;
        const y = (0.5 + Math.cos(angle) * blob.span) * renderHeight;
        const pulse = Math.sin(angle * 2.1 + blob.phase);
        const radius = blob.radius * Math.min(renderWidth, renderHeight);
        const width = radius * (0.82 - pulse * 0.07);
        const height = radius * (1.18 + pulse * 0.13);
        const rotation = Math.sin(angle + blob.phase) * 0.2;

        paintContext.save();
        paintContext.translate(x, y);
        paintContext.rotate(rotation);
        paintContext.scale(width, height);
        const glow = paintContext.createRadialGradient(0, 0, 0, 0, 0, 1);
        glow.addColorStop(0, `rgba(${blob.color}, 1)`);
        glow.addColorStop(0.42, `rgba(${blob.color}, 0.96)`);
        glow.addColorStop(0.76, `rgba(${blob.color}, 0.62)`);
        glow.addColorStop(1, `rgba(${blob.color}, 0)`);
        paintContext.fillStyle = glow;
        paintContext.beginPath();
        paintContext.arc(0, 0, 1, 0, fullTurn);
        paintContext.fill();
        paintContext.restore();
      });
      paintContext.globalCompositeOperation = "source-over";

      // The moving color field is clipped by the original QR ink. The mask is
      // never transformed, faded, or animated, so the scannable geometry stays fixed.
      paintContext.globalCompositeOperation = "destination-in";
      paintContext.drawImage(mask, 0, 0, renderWidth, renderHeight);
      paintContext.globalCompositeOperation = "source-over";

      context.fillStyle = "#fff9ed";
      context.fillRect(0, 0, renderWidth, renderHeight);
      context.drawImage(paintCanvas, 0, 0);

      qrArt.classList.add("is-animated");
      qrAnimationFrame = window.requestAnimationFrame(drawFrame);
    };

    qrAnimationFrame = window.requestAnimationFrame(drawFrame);
  } catch {
    // The static QR image remains visible if canvas or mask loading fails.
  }
};

const showMenuHome = () => {
  stopQrAnimation();
  activeQrMask = "";
  menuHome.hidden = false;
  qrView.hidden = true;
  qrImage.removeAttribute("src");
  qrImage.alt = "";
};

const openMenu = () => {
  showMenuHome();
  menuModal.hidden = false;
  document.body.style.overflow = "hidden";
  closeMenuButton.focus();
};

const closeMenu = () => {
  stopQrAnimation();
  activeQrMask = "";
  menuModal.hidden = true;
  document.body.style.overflow = "";
  menuButton.focus();
};

const showQrCode = (button) => {
  const name = button.dataset.qrName;

  qrName.textContent = name;
  qrHandle.textContent = button.dataset.qrHandle;
  qrImage.src = button.dataset.qrSrc;
  qrImage.alt = `${name}'s Instagram QR code`;
  activeQrMask = button.dataset.qrMask;
  activeQrSeed = name.length * 0.37;
  menuHome.hidden = true;
  qrView.hidden = false;
  startQrAnimation(activeQrMask, activeQrSeed);
  qrHeading.focus({ preventScroll: true });
};

ratingButtons.forEach((button) => {
  button.setAttribute("aria-pressed", "false");
  button.addEventListener("click", () => chooseRating(button));
});

menuButton.addEventListener("click", openMenu);
closeMenuButton.addEventListener("click", closeMenu);
qrButtons.forEach((button) => button.addEventListener("click", () => showQrCode(button)));
menuModal.addEventListener("click", (event) => {
  if (event.target === menuModal) closeMenu();
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || menuModal.hidden) return;

  if (!qrView.hidden) showMenuHome();
  else closeMenu();
});
document.addEventListener("pointerdown", tryEnterFullscreen, true);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopQrAnimation();
  else if (!qrView.hidden && activeQrMask) startQrAnimation(activeQrMask, activeQrSeed);
});

showServingNumber();
renderStats();
