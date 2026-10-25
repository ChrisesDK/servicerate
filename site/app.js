const ratingButtons = [...document.querySelectorAll("[data-rating]")];
const feedback = document.querySelector("#feedback");
const feedbackKicker = document.querySelector("#feedback-kicker");
const feedbackTitle = document.querySelector("#feedback-title");
const feedbackCopy = document.querySelector("#feedback-copy");
const batSwarm = document.querySelector("#bat-swarm");
const victimNumber = document.querySelector("#victim-number");
const ticketCaption = document.querySelector("#ticket-caption");
const garlicButton = document.querySelector("#garlic-button");
const garlicAlert = document.querySelector("#garlic-alert");
const dismissGarlic = document.querySelector("#dismiss-garlic");

const counterKey = "vfs-serving-count-v2";
let servingNumber = Number.parseInt(sessionStorage.getItem(counterKey) ?? "1", 10);
let feedbackResetTimer;

if (!Number.isFinite(servingNumber) || servingNumber < 1) {
  servingNumber = 1;
}

const responses = {
  awful: {
    title: "That really bites.",
    copy: "A manager will rise from their coffin shortly.",
  },
  meh: {
    title: "Thanks for the honest feed-back.",
    copy: "We'll sharpen our fangs before your next visit.",
  },
  good: {
    title: "Bloody good!",
    copy: "Almost worth writing home to Transylvania about.",
  },
  great: {
    title: "Fang-tastic!",
    copy: "100 imaginary O-positive points are yours.",
  },
};

const formatVictimNumber = (number) => `V-${String(number).padStart(3, "0")}`;

const showServingNumber = (caption = "Now serving") => {
  ticketCaption.textContent = caption;
  victimNumber.textContent = formatVictimNumber(servingNumber);
};

const releaseBats = () => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  batSwarm.replaceChildren();

  for (let index = 0; index < 9; index += 1) {
    const bat = document.createElement("span");
    bat.className = "bat";
    bat.textContent = "🦇";
    bat.style.setProperty("--start-y", `${6 + Math.random() * 58}%`);
    bat.style.setProperty("--size", `${1.1 + Math.random() * 1.8}rem`);
    bat.style.setProperty("--duration", `${2.1 + Math.random() * 1.4}s`);
    bat.style.setProperty("--delay", `${Math.random() * 0.6}s`);
    batSwarm.append(bat);
  }

  window.setTimeout(() => batSwarm.replaceChildren(), 4500);
};

const chooseRating = (button) => {
  const selectedRating = button.dataset.rating;
  const response = responses[selectedRating];
  const ratedNumber = servingNumber;

  servingNumber += 1;
  sessionStorage.setItem(counterKey, String(servingNumber));
  feedbackKicker.textContent = `${formatVictimNumber(ratedNumber)} logged`;
  showServingNumber("Next fanged customer");

  ratingButtons.forEach((item) => {
    const isSelected = item === button;
    item.classList.toggle("is-selected", isSelected);
    item.setAttribute("aria-pressed", String(isSelected));
  });

  feedbackTitle.textContent = response.title;
  feedbackCopy.textContent = response.copy;
  feedback.dataset.rating = selectedRating;

  window.clearTimeout(feedbackResetTimer);
  feedbackResetTimer = window.setTimeout(resetRating, 1800);

  if (selectedRating === "good" || selectedRating === "great") {
    releaseBats();
  }
};

const resetRating = () => {
  ratingButtons.forEach((button) => {
    button.classList.remove("is-selected");
    button.setAttribute("aria-pressed", "false");
  });
  feedbackKicker.textContent = "Feed-back desk";
  feedbackTitle.textContent = "Awaiting your verdict";
  feedbackCopy.textContent = "Choose carefully. The night shift is listening.";
  delete feedback.dataset.rating;
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

showServingNumber();
