const container = document.querySelector(".container");
const chatsContainer = document.querySelector(".chats-container");
const promptForm = document.querySelector(".prompt-form");
const promptInput = promptForm.querySelector(".prompt-input");
const fileInput = promptForm.querySelector("#file-input");
const fileUploadWrapper = promptForm.querySelector(".file-upload-wrapper");
const themeToggleBtn = document.querySelector("#theme-toggle-btn");

let controller, typingInterval;
const chatHistory = [];
const userData = { message: "", file: {} };

// Theme
const isLightTheme = localStorage.getItem("themeColor") === "light_mode";
document.body.classList.toggle("light-theme", isLightTheme);
themeToggleBtn.textContent = isLightTheme ? "dark_mode" : "light_mode";

// Helpers
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

const scrollToBottom = () => {
  container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
};

const typingEffect = (text, el, botDiv) => {
  el.textContent = "";
  const words = text.split(" ");
  let i = 0;

  typingInterval = setInterval(() => {
    if (i < words.length) {
      el.textContent += (i ? " " : "") + words[i++];
      scrollToBottom();
    } else {
      clearInterval(typingInterval);
      botDiv.classList.remove("loading");
      document.body.classList.remove("bot-responding");
    }
  }, 40);
};

// --------------------
// API call via backend
// --------------------
async function generateResponse(botMsgDiv) {
  const textElement = botMsgDiv.querySelector(".message-text");
  controller = new AbortController();

  chatHistory.push({
    role: "user",
    parts: [{ text: userData.message }]
  });

  try {
    // Call backend endpoint
    const res = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatHistory }),
      signal: controller.signal
    });

    const data = await res.json();
    console.log("Backend response:", data); // optional: check structure

    // Safely extract reply
    let reply = "";
    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      reply = data.candidates[0].content.parts[0].text.trim();
    } else if (data?.error?.message) {
      reply = `Error: ${data.error.message}`;
    } else {
      reply = "Sorry, no response received.";
    }

    typingEffect(reply, textElement, botMsgDiv);

    chatHistory.push({
      role: "model",
      parts: [{ text: reply }]
    });

  } catch (err) {
    textElement.textContent = err.message;
    textElement.style.color = "red";
    botMsgDiv.classList.remove("loading");
    document.body.classList.remove("bot-responding");
  }
}

// Submit
promptForm.addEventListener("submit", e => {
  e.preventDefault();
  if (document.body.classList.contains("bot-responding")) return;

  userData.message = promptInput.value.trim();
  promptInput.value = "";

  const userHTML = `<p class="message-text">${userData.message}</p>`;
  chatsContainer.appendChild(createMessageElement(userHTML, "user-message"));
  scrollToBottom();

  setTimeout(() => {
    const botHTML = `
      <img src="gemini.svg" class="avatar" />
      <p class="message-text">Thinking...</p>`;
    const botDiv = createMessageElement(botHTML, "bot-message", "loading");
    chatsContainer.appendChild(botDiv);
    scrollToBottom();
    generateResponse(botDiv);
  }, 500);

  document.body.classList.add("bot-responding");
});

// Theme toggle
themeToggleBtn.onclick = () => {
  const light = document.body.classList.toggle("light-theme");
  localStorage.setItem("themeColor", light ? "light_mode" : "dark_mode");
  themeToggleBtn.textContent = light ? "dark_mode" : "light_mode";
};
