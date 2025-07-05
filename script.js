let reminders = [];
let chatHistory = []; // Array to store chat messages

let editingMessageId = null; // To keep track of the message being edited
let originalSendButtonFunction; // To store the original function of the send button

// VOICE INPUT VARIABLES
let speechRecognition; // Variable to hold the SpeechRecognition object
let isRecording = false; // Flag to track recording status


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

function processBotResponse(input) {
    let botResponse = "";
    const reminderMatch = input.match(/remind me to take (.+) at (\d{2}:\d{2})(?: on (\d{4}-\d{2}-\d{2}))?/i);

    if (reminderMatch) {
        const medicine = reminderMatch[1].trim();
        const time = reminderMatch[2];
        const dateStr = reminderMatch[3];

        let reminderDate;
        if (dateStr) {
            reminderDate = new Date(dateStr + 'T' + time);
        } else {
            reminderDate = new Date();
            reminderDate.setHours(parseInt(time.substring(0, 2)), parseInt(time.substring(3, 5)), 0, 0);
            if (reminderDate < new Date()) {
                reminderDate.setDate(reminderDate.getDate() + 1);
            }
        }

        if (isNaN(reminderDate.getTime())) {
            botResponse = "❌ Invalid date or time format for reminder. Please use HH:MM and optionally YYYY-MM-DD.";
        } else {
            reminders.push({ medicine, time, date: reminderDate.toLocaleDateString() }); // Basic reminder storage
            botResponse = `✅ Reminder set for ${medicine} at ${time} on ${reminderDate.toLocaleDateString()}.`;
        }
    } else if (input.toLowerCase() === 'help') {
        botResponse = "💬 You can:\n- Ask: I have headache\n- Set: Remind me to take Crocin at 15:00\n- Ask: I have fever";
    } else {
        let found = false;
        for (const symptom in symptoms) {
            if (input.toLowerCase().includes(symptom)) {
                botResponse = `💡 ${symptoms[symptom]}`;
                found = true;
                break;
            }
        }
        if (!found) {
            botResponse = "❓ Sorry, I didn’t understand. Try saying:\n👉 I have stomach pain\n👉 Remind me to take Paracetamol at 15:00";
        }
    }
    addMessage(botResponse, 'bot');
}


function processInput() {
    const input = document.getElementById("userInput").value.trim();
    if (!input) return;

    addMessage(input, 'user');
    document.getElementById("userInput").value = "";
    processBotResponse(input);
}

function addMessage(text, sender) {
    const chatbox = document.getElementById("chatbox");
    const messageDiv = document.createElement("div");
    const messageContentSpan = document.createElement("span"); // New span for content

    messageDiv.className = sender === 'bot' ? 'bot-message' : 'user-message';
    messageContentSpan.className = 'message-content'; // Add class for content
    messageContentSpan.textContent = text;
    messageDiv.appendChild(messageContentSpan); // Append span to message div

    const messageId = Date.now() + '-' + Math.random().toString(36).substring(2, 9); // Unique ID
    messageDiv.setAttribute('data-message-id', messageId); // Store ID on the element

    if (sender === 'user') {
        const messageActionsDiv = document.createElement('div');
        messageActionsDiv.className = 'message-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.innerHTML = '&#9998;'; // Pencil icon
        editBtn.title = 'Edit Message';
        editBtn.onclick = () => startEditMessage(messageId);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '&#128465;'; // Wastebasket icon
        deleteBtn.title = 'Delete Message';
        deleteBtn.onclick = () => deleteMessage(messageId);

        messageActionsDiv.appendChild(editBtn);
        messageActionsDiv.appendChild(deleteBtn);
        messageDiv.appendChild(messageActionsDiv); // Append actions to message div
    }

    chatbox.appendChild(messageDiv);
    chatbox.scrollTop = chatbox.scrollHeight; // Auto-scroll to latest message

    // Store message in chatHistory with its ID
    chatHistory.push({ id: messageId, text, sender, timestamp: new Date().toISOString() });
    updateSidebarHistory(); // Update sidebar history
}

function updateSidebarHistory() {
    const historySectionUl = document.querySelector('.history-section ul');
    historySectionUl.innerHTML = ''; // Clear existing list
    // Display only the last few messages for brevity in sidebar
    const displayCount = 3;
    const recentHistory = chatHistory.slice(-displayCount);

    recentHistory.forEach(msg => {
        const listItem = document.createElement('li');
        // Truncate long messages for display
        const displayText = msg.text.length > 25 ? msg.text.substring(0, 22) + '...' : msg.text;
        listItem.textContent = `${msg.sender}: ${displayText}`;
        historySectionUl.appendChild(listItem);
    });
}

// =========================================================================
// EDIT/DELETE LOGIC
// =========================================================================

function deleteMessage(id) {
    // Remove the message from the DOM
    const messageElement = document.querySelector(`.chatbox div[data-message-id="${id}"]`);
    if (messageElement) {
        messageElement.remove();
    }

    // Remove the message from chatHistory array
    chatHistory = chatHistory.filter(msg => msg.id !== id);

    // If the deleted message was being edited, cancel the edit
    if (editingMessageId === id) {
        cancelEdit();
    }

    updateSidebarHistory(); // Update sidebar after deletion
}

function startEditMessage(id) {
    const messageToEdit = chatHistory.find(msg => msg.id === id);
    if (messageToEdit) {
        document.getElementById('userInput').value = messageToEdit.text;
        editingMessageId = id;

        const sendButton = document.getElementById('sendButton');
        const inputSendContainer = document.querySelector('.input-send-container');

        // Store original function and set new one
        originalSendButtonFunction = sendButton.onclick;
        sendButton.onclick = updateEditedMessage;
        sendButton.innerHTML = '&#10003;'; // Checkmark icon for update

        // Create and add a "Cancel Edit" button
        let cancelEditBtn = document.getElementById('cancelEditBtn');
        if (!cancelEditBtn) {
            cancelEditBtn = document.createElement('button');
            cancelEditBtn.id = 'cancelEditBtn';
            cancelEditBtn.className = 'cancel-edit-btn';
            cancelEditBtn.innerHTML = '&#x2715;'; // 'X' icon
            cancelEditBtn.title = 'Cancel Edit';
            cancelEditBtn.onclick = cancelEdit;
            // Insert it before the send button
            inputSendContainer.insertBefore(cancelEditBtn, sendButton);
        }

        // Disable voice input button temporarily during edit
        const voiceInputBtn = document.getElementById('voiceInputBtn');
        if (voiceInputBtn) {
            voiceInputBtn.disabled = true;
            voiceInputBtn.classList.remove('active'); // Ensure no recording state
            if (isRecording) { // If recording, stop it
                speechRecognition.stop();
            }
        }
    }
}

function updateEditedMessage() {
    if (!editingMessageId) return; // Not in edit mode

    const newText = document.getElementById('userInput').value.trim();
    if (!newText) {
        // If edited to be empty, delete the message
        deleteMessage(editingMessageId);
        cancelEdit(); // Reset state
        return;
    }

    // Update the message in the DOM
    const messageElement = document.querySelector(`.chatbox div[data-message-id="${editingMessageId}"] .message-content`);
    if (messageElement) {
        messageElement.textContent = newText;
    }

    // Update the message in chatHistory
    const messageIndex = chatHistory.findIndex(msg => msg.id === editingMessageId);
    if (messageIndex !== -1) {
        chatHistory[messageIndex].text = newText;
    }

    cancelEdit(); // Reset UI state after update
    processBotResponse(newText); // Get a bot response for the edited message
}

function cancelEdit() {
    document.getElementById('userInput').value = '';
    editingMessageId = null;

    const sendButton = document.getElementById('sendButton');
    // Restore original function and icon
    sendButton.onclick = originalSendButtonFunction;
    sendButton.innerHTML = '&#10148;'; // Original arrow icon

    // Remove "Cancel Edit" button
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    if (cancelEditBtn) {
        cancelEditBtn.remove();
    }

    // Re-enable voice input button
    const voiceInputBtn = document.getElementById('voiceInputBtn');
    if (voiceInputBtn) {
        voiceInputBtn.disabled = false;
    }
}


// =========================================================================
// VOICE INPUT LOGIC (re-integrated)
// =========================================================================

// Function to initialize SpeechRecognition
function initializeSpeechRecognition() {
    // Check if Web Speech API is supported
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.error("Web Speech API is not supported by this browser.");
        alert("Sorry, your browser doesn't support voice input. Please use Chrome, Edge, or a modern browser.");
        // Hide the voice input button if API is not supported
        const voiceInputBtn = document.getElementById('voiceInputBtn');
        if (voiceInputBtn) {
            voiceInputBtn.style.display = 'none';
        }
        return;
    }

    // Use webkitSpeechRecognition for better cross-browser compatibility
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    speechRecognition = new SpeechRecognition();

    speechRecognition.continuous = false; // Don't keep listening after a pause
    speechRecognition.interimResults = false; // Only return final results
    speechRecognition.lang = 'en-US'; // Set language

    // Event handler when a result is received
    speechRecognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById('userInput').value = transcript;
        // Automatically send the message after speech recognition if not editing
        if (!editingMessageId) { // Only process as new input if not editing
            processInput();
        } else {
            // If editing, just populate the field, user will manually update
            // Or you could uncomment processInput() here if you want voice to "update" the current message
            // processInput();
        }
    };

    // Event handler when speech recognition ends (e.g., user stops speaking)
    speechRecognition.onend = () => {
        const voiceInputBtn = document.getElementById('voiceInputBtn');
        if (voiceInputBtn) {
            voiceInputBtn.classList.remove('active'); // Remove active class for styling
        }
        isRecording = false;
        document.getElementById('userInput').placeholder = 'Type your symptoms or reminders...'; // Reset placeholder
        console.log('Speech recognition ended.');
    };

    // Event handler for errors
    speechRecognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        const voiceInputBtn = document.getElementById('voiceInputBtn');
        if (voiceInputBtn) {
            voiceInputBtn.classList.remove('active');
        }
        isRecording = false;
        document.getElementById('userInput').placeholder = 'Type your symptoms or reminders...'; // Reset placeholder
        if (event.error === 'not-allowed') {
            alert('Microphone access denied. Please allow microphone access in your browser settings.');
        } else if (event.error === 'no-speech') {
            console.log('No speech detected.');
        }
    };
}

// Function to toggle voice input
function toggleVoiceInput() {
    // Prevent voice input if currently editing a message
    if (editingMessageId) {
        alert("Please finish or cancel editing the current message before using voice input.");
        return;
    }

    const voiceInputBtn = document.getElementById('voiceInputBtn');
    if (isRecording) {
        speechRecognition.stop(); // Stop recording
    } else {
        try {
            speechRecognition.start(); // Start recording
            if (voiceInputBtn) {
                voiceInputBtn.classList.add('active'); // Add active class for styling
            }
            isRecording = true;
            document.getElementById('userInput').placeholder = 'Listening... Speak now!';
        } catch (error) {
            console.error("Error starting speech recognition:", error);
            alert("Could not start voice input. Please ensure microphone is available and permissions are granted.");
            if (voiceInputBtn) {
                voiceInputBtn.classList.remove('active');
            }
            isRecording = false;
        }
    }
}


// Initial Load Event Listener
document.addEventListener('DOMContentLoaded', () => {
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const voiceInputBtn = document.getElementById('voiceInputBtn'); // Get voice input button

    // Set the initial send button function
    originalSendButtonFunction = processInput;
    sendButton.onclick = originalSendButtonFunction;

    if (userInput) {
        userInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                if (editingMessageId) {
                    updateEditedMessage();
                } else {
                    processInput();
                }
            }
        });
    }

    // Initialize Speech Recognition and attach event listener
    initializeSpeechRecognition();
    if (voiceInputBtn) { // Check if the button exists before adding listener
        voiceInputBtn.addEventListener('click', toggleVoiceInput);
    }

    updateSidebarHistory(); // Load initial sidebar history (if any)

    // Basic modal functionality for Login/Logout (unchanged)
    const loginLogoutBtn = document.getElementById('loginLogoutBtn');
    const loginModal = document.getElementById('loginModal');
    const closeButton = document.querySelector('.close-button');
    const loginForm = document.getElementById('loginForm');
    const loginMessage = document.getElementById('loginMessage');

    let isLoggedIn = false;

    if (loginLogoutBtn) {
        loginLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (isLoggedIn) {
                isLoggedIn = false;
                loginLogoutBtn.textContent = 'Login';
                loginMessage.textContent = 'Logged out successfully.';
                loginMessage.className = 'message success';
                setTimeout(() => { loginMessage.textContent = ''; loginMessage.className = 'message'; }, 3000);
            } else {
                loginModal.style.display = 'flex';
            }
        });
    }

    if (closeButton) {
        closeButton.addEventListener('click', () => {
            loginModal.style.display = 'none';
            loginMessage.textContent = '';
            loginMessage.className = 'message';
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target === loginModal) {
            loginModal.style.display = 'none';
            loginMessage.textContent = '';
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
