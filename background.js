let lastDescription = '';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Received message in background:", request);

    if (request.type === 'FETCH_DESCRIPTION') {
        const tabId = request.tabId;
        if (tabId) {
            console.log("Tab ID received:", tabId);

            chrome.scripting.executeScript({
                target: { tabId: tabId },
                function: fetchPostDescription
            }, (results) => {
                if (chrome.runtime.lastError) {
                    console.log("Script execution error:", chrome.runtime.lastError.message);
                    sendResponse({ error: chrome.runtime.lastError.message });
                } else {
                    sendResponse({ description: lastDescription || "No description found" });
                }
            });
        } else {
            console.log("No valid tab ID in request");
            sendResponse({ error: "Unable to retrieve tab ID" });
        }
        return true;  // Keeps the message channel open for asynchronous response
    }

    if (request.type === 'POST_DESCRIPTION' && request.description) {
        lastDescription = request.description;
    }
});

function fetchPostDescription() {
    const descriptionParent = document.querySelector('.update-components-text.relative.update-components-update-v2__commentary');

    if (descriptionParent) {
        let postDescription = '';
        descriptionParent.querySelectorAll('span').forEach(span => {
            postDescription += span.innerText.trim() + ' ';
        });
        postDescription = postDescription.trim();

        // Log the fetched description for debugging
        console.log("Fetched Post Description:", postDescription);

        chrome.runtime.sendMessage({ type: 'POST_DESCRIPTION', description: postDescription });
    } else {
        console.log("No description found in DOM");
    }
}
