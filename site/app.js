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
const garlicButton = document.querySelector("#garlic-button");
const garlicAlert = document.querySelector("#garlic-alert");
const dismissGarlic = document.querySelector("#dismiss-garlic");

let servingNumber = 1;
let selectionResetTimer;
let emphasisResetTimer;
let reactionResetTimer;

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
  showServingNumber("Next fanged customer");

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

const openGarlicAlert = () => {
  garlicAlert.hidden = false;
  document.body.style.overflow = "hidden";
  dismissGarlic.focus();
};

const closeGarlicAlert = () => {
  garlicAlert.hidden = true;
  document.body.style.overflow = "";
  garlicButton.focus();
};

ratingButtons.forEach((button) => {
  button.setAttribute("aria-pressed", "false");
  button.addEventListener("click", () => chooseRating(button));
});

garlicButton.addEventListener("click", openGarlicAlert);
dismissGarlic.addEventListener("click", closeGarlicAlert);
garlicAlert.addEventListener("click", (event) => {
  if (event.target === garlicAlert) closeGarlicAlert();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !garlicAlert.hidden) closeGarlicAlert();
});
document.addEventListener("pointerdown", tryEnterFullscreen, true);

showServingNumber();
