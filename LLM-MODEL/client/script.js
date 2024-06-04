const botImageUrl = '../client/assets/Astra.png';
const userImageUrl = '../client/assets/user.svg';

// Select form and chat container elements
const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');
const newInterface = document.querySelector('.clear');
let loadInterval;
let isTyping = false; // Track if a response is being typed

// Random questions to display initially
const RandomQuestions = [
    'give me 3 business brand ideas?',
    'give me 3 innovative business ideas?',
    'can i start a business with 2 dollars?',
];

// Insert random questions into the chat container
RandomQuestions.forEach((que) => {
    const html = `
    <div class="random-message-container">
        <div class="random-message">
            <h3 class="text">${que}</h3>
        </div>
    </div>`;
    chatContainer.insertAdjacentHTML('afterend', html);
});

// Function to hide initial random questions and AI icon
const clearInterface = () => {
    document.querySelectorAll('.random-message-container').forEach((e) => e.classList.add('hide'));
    document.querySelector('.ai-icon').classList.add('hide');
};

// Function to reset the chat interface for a new conversation
const createNewChat = () => {
    document.querySelectorAll('.random-message-container').forEach((e) => e.classList.remove('hide'));
    document.querySelector('.ai-icon').classList.remove('hide');
    chatContainer.innerHTML = '';
};

// Add event listener to reset chat interface on click
newInterface.addEventListener('click', createNewChat);

// Function to show loading animation
const loader = (element) => {
    element.textContent = '';
    loadInterval = setInterval(() => {
        element.textContent += '.';
        if (element.textContent === '....') {
            element.textContent = '';
        }
    }, 300);
};

// Function to generate a unique ID for each message
const generateUniqueId = () => `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;

// Function to create chat message HTML
const chatStripe = (isAi, value, uniqueId) => `
    <div class="wrapper ${isAi ? 'ai' : ''}">
        <div class="chat">
            <div class="profile">
                <img src="${isAi ? botImageUrl : userImageUrl}" alt="${isAi ? 'bot' : 'user'}" />
            </div>
            <div class="message" id="${uniqueId}">${value}</div>
            ${isAi ? '<button class="copy-btn" onclick="copyToClipboard(\'' + uniqueId + '\')">Copy</button>' : ''}
        </div>
    </div>`;

// Function to copy text to clipboard
const copyToClipboard = (id) => {
    const text = document.getElementById(id).textContent;
    navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard');
    }).catch((err) => {
        console.error('Failed to copy: ', err);
    });
};

// Function to handle form submission and send user prompt to the server
const handleSubmit = async (event) => {
    event.preventDefault();

    // Clear initial interface elements
    clearInterface();

    // Get user prompt from the form
    const data = new FormData(form);
    const userPrompt = data.get('prompt');
    
    // Add user message to chat container
    chatContainer.innerHTML += chatStripe(false, userPrompt);
    form.reset();

    // Generate unique ID for the bot's response
    const uniqueId = generateUniqueId();
    chatContainer.innerHTML += chatStripe(true, ' ', uniqueId);

    // Scroll to the new message smoothly
    document.getElementById(uniqueId).scrollIntoView({ behavior: 'smooth' });

    const messageDiv = document.getElementById(uniqueId);
    loader(messageDiv);
    isTyping = true; // Mark that the bot is typing

    try {
        // Send user prompt to the server
        const response = await fetch('http://localhost:3000/gemini/send-response', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: userPrompt })
        });

        clearInterval(loadInterval);
        messageDiv.innerHTML = ' ';
        isTyping = false; // Mark that the bot has finished typing

        if (response.ok) {
            // Display the bot's response
            const responseData = await response.json();
            const botResponseText = responseData.parts[0].text.trim();
            typeText(messageDiv, botResponseText);
        } else {
            // Handle server error
            const errorText = await response.text();
            messageDiv.innerHTML = 'Something went wrong';
            alert(errorText);
        }
    } catch (error) {
        // Handle network or other errors
        clearInterval(loadInterval);
        messageDiv.innerHTML = 'Something went wrong';
        alert('An error occurred while processing your request.');
        console.error('Error:', error);
    }
};

const typeText = (element, text) => {
    let index = 0;
    const interval = setInterval(() => {
        if (index < text.length) {
            element.innerHTML += text.charAt(index);
            index++;
            chatContainer.scrollTo({
                top: chatContainer.scrollHeight,
                behavior: 'smooth' // Scroll smoothly to the bottom
            });
        } else {
            clearInterval(interval);
        }
    }, 10);
};

// Function to check if an element is in view
const isElementInViewport = (element) => {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
};

// Function to scroll to the bottom of the chat container
const scrollToBottom = () => {
    chatContainer.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: 'smooth' // Scroll smoothly to the bottom
    });
};

// Function to automatically scroll to the bottom if the user scrolls away
const checkScrollPosition = () => {
    const shouldScroll = chatContainer.scrollTop + chatContainer.clientHeight < chatContainer.scrollHeight - 50;
    if (isTyping && shouldScroll) {
        scrollToBottom();
    }
};

// Add event listener to check scroll position
chatContainer.addEventListener('scroll', () => {
    clearTimeout(chatContainer.scrollTimeout);
    chatContainer.scrollTimeout = setTimeout(checkScrollPosition, 100);
});

document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const promptInput = chatForm.querySelector('textarea');

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const messageText = promptInput.value.trim();
        if (messageText) {
            const messageElement = document.createElement('div');
            messageElement.classList.add('message');
            chatContainer.appendChild(messageElement);
            typeText(messageElement, messageText);
            promptInput.value = '';
        }
    });

    // Add logic for dynamically expanding input field
    const adjustHeight = () => {
        promptInput.style.height = 'auto'; // Reset height to auto to shrink if needed
        promptInput.style.height = Math.min(promptInput.scrollHeight, 168) + 'px'; // 168px = 7 rows * 24px (assuming 24px line height)
    };

    promptInput.addEventListener('input', adjustHeight);
    window.addEventListener('load', adjustHeight); // Adjust height on page load
});

// Add event listener to handle form submission
form.addEventListener('submit', handleSubmit);

// Add event listener to handle Enter key press for form submission
form.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSubmit(e);
    }
});

// Function to display selected question in the form's input field
const showQuestion = () => {
    const clickQuestions = document.querySelectorAll('.random-message');
    clickQuestions.forEach((questionElement) => {
        questionElement.addEventListener('click', (e) => {
            const selectedQuestion = e.target.innerText;
            const inputField = form.querySelector('textarea[name="prompt"]');
            inputField.value = selectedQuestion;
        });
    });
};

// Initialize the click event listener for the suggested questions
showQuestion();
