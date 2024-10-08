// This script fetches the post description from LinkedIn and sends it to the background script
function fetchPostDescription() {
    const descriptionParent = document.querySelector('.update-components-text.relative.update-components-update-v2__commentary');

    if (descriptionParent) {
        let postDescription = '';
        descriptionParent.querySelectorAll('span').forEach(span => {
            postDescription += span.innerText.trim() + ' ';
        });
        postDescription = postDescription.trim();

        // Send the fetched description to background script
        chrome.runtime.sendMessage({ type: 'POST_DESCRIPTION', description: postDescription });
    } else {
        console.log("No description found in DOM");
    }
}
