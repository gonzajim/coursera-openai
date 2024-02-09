// chatbot.js
document.getElementById('sendButton').addEventListener('click', async () => {
    const userInput = document.getElementById('userInput').value;
    const messagesDiv = document.getElementById('messages');

    // Add user message to chat
    messagesDiv.innerHTML += `<p>User: ${userInput}</p>`;

    // Clear input
    document.getElementById('userInput').value = '';

    // Send a request to your server with the user input
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: userInput })
    });
    const data = await response.json();

    // Add the response to the chat
    messagesDiv.innerHTML += `<p>Bot: ${data.response}</p>`;
});