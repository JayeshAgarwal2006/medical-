let reminders = [];
let chatHistory = []; // Array to store chat messages

// 🩺 Symptom-diagnosis suggestions
const symptoms = {
    "headache": "You can take Paracetamol or Crocin. Stay hydrated and rest.",
    "fever": "Take Paracetamol (Dolo 650). Drink fluids. See a doctor if high fever persists.",
    "cold": "Use steam inhalation and try Cetirizine, Sinarest, or nasal drops.",
    "cough": "Benadryl, Honitus, or syrup like Ascoril may help. Drink warm water.",
    "sore throat": "Try warm salt water gargle and lozenges like Strepsils or Betadine gargle.",
    "stomach pain": "Take Meftal Spas. Eat light and avoid spicy food.",
    "vomiting": "Try Ondem or Domstal. Keep hydrated. See a doctor if frequent.",
    "diarrhea": "Take ORS solution, eat bananas/rice, and try Loperamide or Enterogermina.",
    "constipation": "You can take Isabgol, Dulcolax, or drink warm water in the morning.",
    "acidity": "Try Eno, Digene, or Pantoprazole. Avoid oily/spicy food.",
    "gas": "Use Gasex, Simethicone drops or ajwain with warm water.",
    "back pain": "Apply pain balm or take muscle relaxants like Flexon or Combiflam.",
    "eye pain": "Rest your eyes. Use lubricating drops like Refresh Tears or iTone.",
    "burning urination": "Drink water, use Cital syrup, and consult a doctor if painful.",
    "fatigue": "Try multivitamins like Revital or Neurobion. Sleep well and stay hydrated.",
    "weakness": "Iron and vitamin supplements like Livogen, Fefol, or Becosules help.",
    "dizziness": "Sit down and rest. Take ORS or sugar water. If frequent, get checked.",
    "iron deficiency": "Take iron tablets like Livogen, Fefol, or Ferrous Sulfate.",
    "infection": "Usually requires antibiotics like Amoxicillin. Don't self-medicate. See a doctor.",
    "allergy": "Cetirizine or Allegra may help. Avoid known allergens.",
    "menstrual pain": "Try Meftal Spas, use a hot water bag, and get rest.",
    "acne": "Keep your skin clean. Apply Clindamycin gel. Drink plenty of water.",
    "skin rash": "Use anti-allergy cream like Candid or Caladryl. Avoid scratching.",
    "toothache": "Take painkillers like Ibuprofen. Visit a dentist if severe.",
    "sleep problems": "Try meditation, avoid caffeine at night, or consult a doctor for melatonin."
};

// Moved bot processing logic into a separate function for reusability
function processBotResponse(input, userMessageIndex) {
    let botResponse = "";

    // 📌 Reminder pattern: "remind me to take <medicine> at <time>"
    const reminderMatch = input.match(/remind me to take (.+) at (\d{2}:\d{2})/i);
    if (reminderMatch) {
        const medicine = reminderMatch[1].trim();
        const time = reminderMatch[2];
        reminders.push({ medicine, time }); // You might want to update or remove old reminders if edited
        botResponse = `✅ Reminder set for ${medicine} at ${time}.`;
    } else if (input.toLowerCase() === 'help') {
        botResponse = "💬 You can:\n- Ask: I have headache\n- Set: Remind me to take Crocin at 15:00\n- Ask: I have fever";
    } else {
        // 📌 Check for symptoms in message
        let found = false;
        for (const symptom in symptoms) {
            if (input.toLowerCase().includes(symptom)) {
                botResponse = `💡 ${symptoms[symptom]}`;
                found = true;
                break; // Found a symptom, no need to check others
            }
        }
        if (!found) {
            botResponse = "❓ Sorry, I didn’t understand. Try saying:\n👉 I have stomach pain\n👉 Remind me to take Paracetamol at 15:00";
        }
    }
    // Now, insert or update the bot's response right after the user's message
    // If there's an existing bot response, update it. Otherwise, add a new one.
    // This requires a bit more complex chat history management to link user-bot pairs.

    // For simplicity, let's just add the bot response.
    // If you want to update previous bot messages related to the user's edited message,
    // you'd need to establish a relationship (e.g., user message index -> bot response index).
    // For now, we'll assume a new bot message is generated and added after the edited user message.

    // Find the next message in chatHistory to see if it's a bot's response to the user's message
    // This is a simplified approach and might not be robust for complex conversations.
    // A better approach for linking user-bot messages would be to store them as pairs
    // or add a 'replyTo' field in the message object.
    let botResponseIndex = -1;
    if (userMessageIndex !== -1 && chatHistory.length > userMessageIndex + 1) {
        const nextMessage = chatHistory[userMessageIndex + 1];
        if (nextMessage.sender === 'bot' && nextMessage.originalUserIndex === userMessageIndex) {
            botResponseIndex = userMessageIndex + 1;
        }
    }

    addMessage(botResponse, 'bot', botResponseIndex, userMessageIndex); // Pass original user index
}

function processInput() {
    const input = document.getElementById("userInput").value.trim();
    if (!input) return;

    // Add user message to chat and process it
    // When adding a new user message, we don't know its final index yet,
    // so we'll add it and then get its index for the bot response.
    addMessage(input, 'user');
    document.getElementById("userInput").value = "";

    // After adding the user message, its index will be chatHistory.length - 1
    const newUserMessageIndex = chatHistory.length - 1;
    processBotResponse(input, newUserMessageIndex);
}

// 🧾 Show message in chat and save to history
// index: position in chatHistory array (-1 for new message)
// originalUserIndex: the index of the user message this bot message is responding to (optional)
function addMessage(text, sender, index = -1, originalUserIndex = -1) {
    const chatbox = document.getElementById("chatbox");
    let messageDiv;
    let messageTextSpan;

    if (index !== -1 && chatbox.children[index]) { // If updating an existing message
        messageDiv = chatbox.children[index];
        messageTextSpan = messageDiv.querySelector('.message-text');
        messageTextSpan.innerText = text;
        // Ensure actions are present if it's a user message being re-rendered
        if (sender === 'user' && !messageDiv.querySelector('.message-actions')) {
            // Re-add buttons if they somehow got lost (e.g., during full re-render after delete)
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'message-actions';

            const editButton = document.createElement('button');
            editButton.className = 'edit-button';
            editButton.innerHTML = '&#9998;'; // Pencil icon
            editButton.title = 'Edit message';
            editButton.onclick = () => editMessage(messageDiv, index);

            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-button';
            deleteButton.innerHTML = '&#128465;'; // Trash can icon
            deleteButton.title = 'Delete message';
            deleteButton.onclick = () => deleteMessage(messageDiv, index);

            actionsDiv.appendChild(editButton);
            actionsDiv.appendChild(deleteButton);
            messageDiv.appendChild(actionsDiv);
        }
    } else { // If adding a new message
        messageDiv = document.createElement("div");
        messageDiv.className = sender === 'bot' ? 'bot-message' : 'user-message';

        messageTextSpan = document.createElement('span');
        messageTextSpan.className = 'message-text';
        messageTextSpan.innerText = text;
        messageDiv.appendChild(messageTextSpan);

        // Add edit/delete buttons only for new user messages
        if (sender === 'user') {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'message-actions';

            const editButton = document.createElement('button');
            editButton.className = 'edit-button';
            editButton.innerHTML = '&#9998;'; // Pencil icon
            editButton.title = 'Edit message';
            // Index will be determined after push, so pass a function to update later
            // Or re-render the whole chat for simplicity after edit (current approach)
            editButton.onclick = () => {
                const currentMessageIndex = Array.from(chatbox.children).indexOf(messageDiv);
                editMessage(messageDiv, currentMessageIndex);
            };

            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-button';
            deleteButton.innerHTML = '&#128465;'; // Trash can icon
            deleteButton.title = 'Delete message';
            deleteButton.onclick = () => {
                const currentMessageIndex = Array.from(chatbox.children).indexOf(messageDiv);
                deleteMessage(messageDiv, currentMessageIndex);
            };

            actionsDiv.appendChild(editButton);
            actionsDiv.appendChild(deleteButton);
            messageDiv.appendChild(actionsDiv);
        }
        chatbox.appendChild(messageDiv);
    }

    chatbox.scrollTop = chatbox.scrollHeight; // Scroll to the bottom

    // Update chat history array and local storage
    if (index === -1) { // New message
        chatHistory.push({ text, sender, timestamp: new Date().toISOString(), originalUserIndex });
    } else { // Update existing message
        chatHistory[index] = { text, sender, timestamp: new Date().toISOString(), originalUserIndex };
    }
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));

    // Update sidebar history
    updateSidebarHistory();
}

// Function to load chat history from local storage and display it
function loadChatHistory() {
    const storedHistory = localStorage.getItem('chatHistory');
    if (storedHistory) {
        chatHistory = JSON.parse(storedHistory);
        const chatbox = document.getElementById("chatbox");
        chatbox.innerHTML = ''; // Clear existing messages
        chatHistory.forEach((msg, index) => { // Pass index for re-rendering
            // When loading, pass the stored originalUserIndex for bot messages
            addMessage(msg.text, msg.sender, index, msg.originalUserIndex);
        });
        chatbox.scrollTop = chatbox.scrollHeight; // Scroll to the bottom
    }
    updateSidebarHistory(); // Populate sidebar history on load
}

// Function to update the sidebar history display (no change here)
function updateSidebarHistory() {
    const historySectionUl = document.querySelector('.history-section ul');
    historySectionUl.innerHTML = ''; // Clear previous history items

    // Display only the last few messages in the sidebar for brevity
    const displayCount = 5; // You can adjust this number
    const recentHistory = chatHistory.slice(-displayCount);

    recentHistory.forEach(msg => {
        const listItem = document.createElement('li');
        // Truncate long messages for sidebar display
        const display_text = msg.text.length > 30 ? msg.text.substring(0, 27) + '...' : msg.text;
        listItem.textContent = `${msg.sender}: ${display_text}`;
        historySectionUl.appendChild(listItem);
    });

    // Add an option to clear history
    if (chatHistory.length > 0) {
        const clearHistoryItem = document.createElement('li');
        clearHistoryItem.textContent = 'Clear History';
        clearHistoryItem.style.cursor = 'pointer';
        clearHistoryItem.style.fontWeight = 'bold';
        clearHistoryItem.style.marginTop = '10px';
        clearHistoryItem.addEventListener('click', clearChatHistory);
        historySectionUl.appendChild(clearHistoryItem);
    }
}

// Function to clear chat history (no change here)
function clearChatHistory() {
    if (confirm("Are you sure you want to clear all chat history?")) {
        localStorage.removeItem('chatHistory');
        chatHistory = []; // Clear the array
        document.getElementById("chatbox").innerHTML = ''; // Clear chatbox
        updateSidebarHistory(); // Update sidebar (should show empty)
        addMessage("Chat history cleared.", 'bot'); // Confirm in chat
    }
}

// NEW: Function to edit a message
function editMessage(messageDiv, index) {
    const messageTextSpan = messageDiv.querySelector('.message-text');
    const currentText = messageTextSpan.innerText;

    // Create an input field for editing
    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.className = 'edit-message-input';
    editInput.value = currentText;

    // Replace the text span with the input field
    messageDiv.replaceChild(editInput, messageTextSpan);

    // Hide actions while editing
    const actionsDiv = messageDiv.querySelector('.message-actions');
    if (actionsDiv) actionsDiv.style.display = 'none';


    editInput.focus(); // Focus on the input field
    editInput.select(); // Select all text in the input field

    // Handle saving the edit
    const saveEdit = () => {
        const newText = editInput.value.trim();
        if (newText && newText !== currentText) { // Only save if text changed
            // Update the chatHistory array for the user message
            chatHistory[index].text = newText;
            localStorage.setItem('chatHistory', JSON.stringify(chatHistory));

            // Replace the input field back with the updated text span
            messageTextSpan.innerText = newText;
            messageDiv.replaceChild(messageTextSpan, editInput);

            // Re-process the bot's response based on the new user input
            processBotResponse(newText, index); // Pass the index of the user message

            updateSidebarHistory(); // Update sidebar after edit
        } else if (newText === "") {
            // If the user clears the text, treat it as a delete
            deleteMessage(messageDiv, index);
        } else { // No change or cancelled, just revert input to text
            messageDiv.replaceChild(messageTextSpan, editInput);
        }
        if (actionsDiv) actionsDiv.style.display = 'flex'; // Show actions again
    };

    editInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveEdit();
        }
    });

    // If focus is lost (user clicks away), save the edit
    editInput.addEventListener('blur', () => {
        saveEdit();
    });
}

// NEW: Function to delete a message
function deleteMessage(messageDiv, index) {
    if (confirm("Are you sure you want to delete this message and its associated bot response?")) {
        // Remove the user message
        chatHistory.splice(index, 1);

        // Find and remove the immediate bot response if it exists and was a response to this user message
        // This relies on the 'originalUserIndex' property we're now adding.
        let botResponseRemoved = false;
        if (index < chatHistory.length) { // Check if there's a message after the deleted user message
            if (chatHistory[index].sender === 'bot' && chatHistory[index].originalUserIndex === index) {
                // The bot message immediately after was a response to the deleted user message
                chatHistory.splice(index, 1); // Remove the bot message
                botResponseRemoved = true;
            } else if (index > 0 && chatHistory[index - 1].sender === 'user') { // Check if the previous message was a user message
                // This is a more complex case if the bot response wasn't immediately after.
                // For simplicity, we're only handling immediately following responses.
            }
        }
        // After deletion, re-index any subsequent bot messages whose originalUserIndex needs adjustment
        // This is crucial to maintain correct linking between user and bot messages.
        for (let i = index; i < chatHistory.length; i++) {
            if (chatHistory[i].originalUserIndex !== undefined && chatHistory[i].originalUserIndex >= index) {
                chatHistory[i].originalUserIndex--; // Decrement index if it was pointing to a message after the deleted one
            }
        }


        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));

        // Reload history to re-render with correct indices (important after deletion)
        loadChatHistory();
    }
}

// ⏰ Every minute check for reminders (no change here)
setInterval(() => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // format HH:MM

    reminders.forEach((reminder, index) => { // Added index to safely remove
        if (reminder.time === currentTime) {
            addMessage(`⏰ Reminder: It's time to take your medicine: ${reminder.medicine}`, 'bot');
            alert(`⏰ Medicine time! Take: ${reminder.medicine}`);
            // Optionally, remove the reminder after it's triggered once
            // reminders.splice(index, 1);
        }
    });
}, 60000); // 60000 milliseconds = 1 minute

// Event listener for Enter key on the input field (no change here)
document.addEventListener('DOMContentLoaded', () => {
    const userInput = document.getElementById('userInput');
    if (userInput) {
        userInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                processInput();
            }
        });
    }
    loadChatHistory(); // Load history when the DOM is fully loaded
});

// Basic modal functionality for Login/Logout (from previous context - no change here)
document.addEventListener('DOMContentLoaded', () => {
    const loginLogoutBtn = document.getElementById('loginLogoutBtn');
    const loginModal = document.getElementById('loginModal');
    const closeButton = document.querySelector('.close-button');
    const loginForm = document.getElementById('loginForm');
    const loginMessage = document.getElementById('loginMessage');

    let isLoggedIn = false; // Simple login state

    if (loginLogoutBtn) {
        loginLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (isLoggedIn) {
                // Logout logic
                isLoggedIn = false;
                loginLogoutBtn.textContent = 'Login';
                loginMessage.textContent = 'Logged out successfully.';
                loginMessage.className = 'message success';
                setTimeout(() => { loginMessage.textContent = ''; loginMessage.className = 'message'; }, 3000);
            } else {
                loginModal.style.display = 'flex'; // Show modal
            }
        });
    }

    if (closeButton) {
        closeButton.addEventListener('click', () => {
            loginModal.style.display = 'none'; // Hide modal
            loginMessage.textContent = ''; // Clear message on close
            loginMessage.className = 'message';
        });
    }

    // Close modal if user clicks outside of it
    window.addEventListener('click', (event) => {
        if (event.target === loginModal) {
            loginModal.style.display = 'none';
            loginMessage.textContent = ''; // Clear message on close
            loginMessage.className = 'message';
        }
    });

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = loginForm.username.value;
            const password = loginForm.password.value;

            // Simple validation (replace with actual authentication)
            if (username === 'user' && password === 'pass') { // Example credentials
                loginMessage.textContent = 'Login successful!';
                loginMessage.className = 'message success';
                isLoggedIn = true;
                loginLogoutBtn.textContent = 'Logout';
                setTimeout(() => {
                    loginModal.style.display = 'none';
                    loginMessage.textContent = '';
                    loginMessage.className = 'message';
                }, 1500);
            } else {
                loginMessage.textContent = 'Invalid username or password.';
                loginMessage.className = 'message'; // Default error color (red)
            }
        });
    }
});