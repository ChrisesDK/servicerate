const ratingButtons = [...document.querySelectorAll("[data-rating]")];
const feedback = document.querySelector("#feedback");
const feedbackTitle = document.querySelector("#feedback-title");
const feedbackCopy = document.querySelector("#feedback-copy");
const rateAgainButton = document.querySelector("#rate-again");
const batSwarm = document.querySelector("#bat-swarm");
const victimNumber = document.querySelector("#victim-number");
const garlicButton = document.querySelector("#garlic-button");
const garlicAlert = document.querySelector("#garlic-alert");
const dismissGarlic = document.querySelector("#dismiss-garlic");

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
    copy: "You've earned 100 imaginary O-positive loyalty points.",
  },
};

const setVictimNumber = () => {
  let number = sessionStorage.getItem("vfs-victim-number");

  if (!number) {
    number = String(Math.floor(Math.random() * 900) + 100);
    sessionStorage.setItem("vfs-victim-number", number);
  }

  victimNumber.textContent = `V-${number}`;
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

  ratingButtons.forEach((item) => {
    const isSelected = item === button;
    item.classList.toggle("is-selected", isSelected);
    item.setAttribute("aria-pressed", String(isSelected));
  });

  feedbackTitle.textContent = response.title;
  feedbackCopy.textContent = response.copy;
  feedback.dataset.rating = selectedRating;
  rateAgainButton.hidden = false;

  if (selectedRating === "good" || selectedRating === "great") {
    releaseBats();
  }
};

const resetRating = () => {
  ratingButtons.forEach((button) => {
    button.classList.remove("is-selected");
    button.setAttribute("aria-pressed", "false");
  });
  feedbackTitle.textContent = "Your opinion matters";
  feedbackCopy.textContent = "All ratings are anonymous. Blood type is not.";
  delete feedback.dataset.rating;
  rateAgainButton.hidden = true;
  ratingButtons[0].focus();
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

rateAgainButton.addEventListener("click", resetRating);
garlicButton.addEventListener("click", openGarlicAlert);
dismissGarlic.addEventListener("click", closeGarlicAlert);
garlicAlert.addEventListener("click", (event) => {
  if (event.target === garlicAlert) closeGarlicAlert();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !garlicAlert.hidden) closeGarlicAlert();
});

setVictimNumber();
