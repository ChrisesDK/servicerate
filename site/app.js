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
const qrImage = document.querySelector("#qr-image");
const backToMenu = document.querySelector("#back-to-menu");
const qrButtons = [...document.querySelectorAll("[data-qr-name]")];
const statRows = [...document.querySelectorAll("[data-stat]")];
const statsTotal = document.querySelector("#stats-total");

let servingNumber = 1;
let selectionResetTimer;
let emphasisResetTimer;
let reactionResetTimer;

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

const showMenuHome = () => {
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
  menuModal.hidden = true;
  document.body.style.overflow = "";
  menuButton.focus();
};

const showQrCode = (button) => {
  const name = button.dataset.qrName;

  qrName.textContent = name;
  qrImage.src = button.dataset.qrSrc;
  qrImage.alt = `${name}'s Instagram QR code`;
  menuHome.hidden = true;
  qrView.hidden = false;
  backToMenu.focus();
};

ratingButtons.forEach((button) => {
  button.setAttribute("aria-pressed", "false");
  button.addEventListener("click", () => chooseRating(button));
});

menuButton.addEventListener("click", openMenu);
closeMenuButton.addEventListener("click", closeMenu);
backToMenu.addEventListener("click", showMenuHome);
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

showServingNumber();
renderStats();
