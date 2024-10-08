const GEMINI_API_KEY = 'AIzaSyAv6A_UNe0dpGz6LReLLQMgcK7I1kw3Cvs';  // Replace with your actual Gemini API key
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

// Function to fetch the best comment from Gemini API
async function getCommentFromGemini(postDescription) {
    const inputText = `Write a professional comment for a LinkedIn post with this description: "${postDescription}".`;

    try {
        const response = await fetch(GEMINI_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: inputText
                    }]
                }]
            })
        });

        const result = await response.json();
        console.log("Gemini API response:", result);

        if (response.ok && result && result.candidates && result.candidates[0].content.parts.length > 0) {
            return result.candidates[0].content.parts[0].text || "No comment generated.";
        } else {
            return "Unexpected response format. Please check the API documentation.";
        }
    } catch (error) {
        console.error("Error fetching from Gemini API:", error);
        return "Error generating comment.";
    }
}

// Function to insert the comment into the LinkedIn comment box
function insertCommentIntoField(comment) {
    const commentBox = document.querySelector('div.ql-editor[contenteditable="true"]');
    
    if (commentBox) {
        // Clear any placeholder content
        commentBox.innerHTML = '';

        // Create a new paragraph element for the comment
        const commentParagraph = document.createElement('p');
        commentParagraph.innerText = comment;

        // Insert the comment into the div
        commentBox.appendChild(commentParagraph);

        // Trigger the input event to ensure LinkedIn detects the change
        const inputEvent = new Event('input', { bubbles: true });
        commentBox.dispatchEvent(inputEvent);

        console.log('Comment inserted into the field:', comment);

        // Call the function to click the comment button after the comment is inserted
        clickCommentButton();
    } else {
        console.log('Unable to find the comment box');
    }
}

// Function to simulate clicking the "Comment" button
function clickCommentButton() {
    // Find the "Comment" button using its class and text
    const commentButton = Array.from(document.querySelectorAll('span.artdeco-button__text')).find(el => el.innerText.trim() === 'Comment');
    
    if (commentButton) {
        // Find the parent button element that needs to be clicked
        const buttonElement = commentButton.closest('button');
        
        if (buttonElement) {
            buttonElement.click();  // Simulate the click on the comment button
            console.log('Comment button clicked');
        } else {
            console.log('Unable to find the button element');
        }
    } else {
        console.log('Unable to find the "Comment" button');
    }
}

// Event listener for inserting the Gemini-generated comment into the LinkedIn post's comment box
document.getElementById('autoCommentBtn').addEventListener('click', async () => {
    const descriptionElement = document.getElementById('description');
    const comment = await getCommentFromGemini(descriptionElement.innerText);
    
    // Insert the generated comment into the LinkedIn post's comment box
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                function: insertCommentIntoField,
                args: [comment]  // Pass the generated comment to the function
            });
        }
    });
});

// Event listener for redirecting to LinkedIn post URL
document.getElementById('redirectBtn').addEventListener('click', () => {
    const postUrl = document.getElementById('postUrl').value;
    if (!postUrl || !postUrl.includes('linkedin.com')) {
        document.getElementById('log').innerText = "Please enter a valid LinkedIn post URL.";
        return;
    }

    // Update the active tab to navigate to the entered LinkedIn post URL
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
            chrome.tabs.update(tabs[0].id, { url: postUrl });
        } else {
            document.getElementById('log').innerText = "No active tab found.";
        }
    });
});

// Event listener for fetching the post description
document.getElementById('fetchBtn').addEventListener('click', async () => {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        if (tabs.length === 0) {
            document.getElementById('description').innerText = "No active tab found";
            return;
        }

        const activeTab = tabs[0];
        chrome.runtime.sendMessage({ type: 'FETCH_DESCRIPTION', tabId: activeTab.id }, async (response) => {
            const descriptionElement = document.getElementById('description');
            const logElement = document.getElementById('log');
            
            if (response) {
                if (response.description && response.description !== descriptionElement.innerText) {
                    descriptionElement.innerText = response.description;

                    console.log("Sending to Gemini:", response.description);

                    // Fetch the best comment from Gemini API
                    const bestComment = await getCommentFromGemini(response.description);
                    logElement.innerText = "Best Comment: " + bestComment;
                } else if (response.error) {
                    descriptionElement.innerText = `Error: ${response.error}`;
                    logElement.innerText = "No comment generated.";
                }
            } else {
                descriptionElement.innerText = "No response from the background script";
                logElement.innerText = "No comment generated.";
            }
        });
    });
});
