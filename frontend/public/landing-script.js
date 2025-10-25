// Disclaimer Modal Logic
const disclaimerModal = document.getElementById("disclaimerModal");
const agreeBtn = document.getElementById("agreeBtn");
const readDisclaimerBtn = document.getElementById("readDisclaimerBtn");
const disclaimerURL = "https://chatbotdisclaimer.onrender.com";

// Check if user has already agreed to disclaimer
function checkDisclaimerStatus() {
  const disclaimerAgreed = localStorage.getItem("disclaimerAgreed");
  if (!disclaimerAgreed) {
    // Show disclaimer modal
    disclaimerModal.classList.remove("hidden");
  } else {
    // Hide disclaimer modal
    disclaimerModal.classList.add("hidden");
  }
}

// Handle agree button
agreeBtn.addEventListener("click", () => {
  localStorage.setItem("disclaimerAgreed", "true");
  disclaimerModal.classList.add("hidden");
});

// Handle read disclaimer button
readDisclaimerBtn.addEventListener("click", () => {
  window.open(disclaimerURL, "_blank");
});

// Check disclaimer on page load
window.addEventListener("DOMContentLoaded", checkDisclaimerStatus);

// Chat functionality
const chatInput = document.getElementById("chatInput");
const chatSendBtn = document.getElementById("chatSendBtn");
const chatMessages = document.getElementById("chatMessages");
let currentChatId = null;
const apiBaseUrl = "https://nyansabackb5.onrender.com";

// Clear welcome message on first message
let welcomeCleared = false;

async function sendChatMessage() {
  const message = chatInput.value.trim();
  if (!message) return;

  // Clear welcome message on first message
  if (!welcomeCleared) {
    chatMessages.innerHTML = "";
    welcomeCleared = true;
  }

  // Add user message to chat
  addChatMessage(message, "user");
  chatInput.value = "";
  chatInput.style.height = "auto";

  // Show typing indicator
  showTypingIndicator();

  try {
    // Create chat if needed
    if (!currentChatId) {
      const chatResponse = await fetch(`${apiBaseUrl}/api/chat/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!chatResponse.ok) {
        throw new Error(
          `Failed to create chat: ${chatResponse.status} ${chatResponse.statusText}`
        );
      }

      const chatData = await chatResponse.json();
      console.log("Chat created:", chatData);
      currentChatId = chatData.chat?.id || chatData.id;

      if (!currentChatId) {
        throw new Error("No chat ID returned from server");
      }
    }

    // Send message
    const response = await fetch(
      `${apiBaseUrl}/api/chat/${currentChatId}/message`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to send message: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log("Message response:", data);

    // Remove typing indicator
    removeTypingIndicator();

    // Handle response
    if (data.response) {
      // Handle Humble AI response (array of messages)
      if (Array.isArray(data.response)) {
        const lastMessage = data.response[data.response.length - 1];
        if (lastMessage && lastMessage.content) {
          addChatMessage(lastMessage.content, "assistant");
        }
      } else if (typeof data.response === "object") {
        // Handle object response
        const assistantMessage =
          data.response.assistant_message ||
          data.response.message ||
          data.response.content ||
          JSON.stringify(data.response);
        addChatMessage(assistantMessage, "assistant");
      } else {
        // Handle string response
        addChatMessage(data.response, "assistant");
      }
    } else if (data.error) {
      addChatMessage(`Error: ${data.error}`, "assistant");
    } else {
      console.warn("Unexpected response format:", data);
      addChatMessage(
        "Received response but format was unexpected.",
        "assistant"
      );
    }
  } catch (error) {
    console.error("Error:", error);
    removeTypingIndicator();
    addChatMessage(`Error: ${error.message}`, "assistant");
  }
}

function addChatMessage(content, role) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `chat-message ${role}`;

  const bubbleDiv = document.createElement("div");
  bubbleDiv.className = "message-bubble";

  // Convert content to string if it's an object
  let textContent =
    typeof content === "string" ? content : JSON.stringify(content);

  // Parse URLs and convert them to clickable links
  bubbleDiv.innerHTML = parseAndFormatText(textContent);

  messageDiv.appendChild(bubbleDiv);
  chatMessages.appendChild(messageDiv);

  // Scroll to bottom
  setTimeout(() => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, 0);
}

function parseAndFormatText(text) {
  let formattedText = text;

  // Remove markdown headers (##, ###, #) - just keep the text
  formattedText = formattedText.replace(/^#{1,3}\s+/gm, "");

  // Remove bold markdown (**text**) - just keep the text in blue
  formattedText = formattedText.replace(
    /\*\*(.*?)\*\*/g,
    "<span class='chat-bold'>$1</span>"
  );

  // Handle URLs and convert them to clickable links
  const urlRegex = /(https?:\/\/[^\s<\]]+)/gi;
  formattedText = formattedText.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" class="chat-link">${url}</a>`;
  });

  // Handle markdown links [text](url)
  formattedText = formattedText.replace(
    /\[(.*?)\]\((https?:\/\/[^\)]+)\)/g,
    "<a href='$2' target='_blank' class='chat-link'>$1</a>"
  );

  // Convert bullet points to simple text with indentation
  formattedText = formattedText.replace(/^- /gm, "• ");

  // Replace multiple line breaks with single line break
  formattedText = formattedText.replace(/\n\n+/g, "\n");

  // Replace line breaks with <br> tags
  formattedText = formattedText.replace(/\n/g, "<br>");

  return formattedText;
}

function showTypingIndicator() {
  const messageDiv = document.createElement("div");
  messageDiv.className = "chat-message assistant";
  messageDiv.id = "typing-indicator";

  const typingDiv = document.createElement("div");
  typingDiv.className = "typing-indicator";

  for (let i = 0; i < 3; i++) {
    const dot = document.createElement("div");
    dot.className = "typing-dot";
    typingDiv.appendChild(dot);
  }

  messageDiv.appendChild(typingDiv);
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
  const typingIndicator = document.getElementById("typing-indicator");
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

// Event listeners
chatSendBtn.addEventListener("click", sendChatMessage);
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendChatMessage();
  }
});

// Auto-resize textarea
chatInput.addEventListener("input", function () {
  this.style.height = "auto";
  this.style.height = Math.min(this.scrollHeight, 120) + "px";
});
