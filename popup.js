document.getElementById('extractAndLogButton').addEventListener('click', () => {
    chrome.scripting.executeScript({
        function: extractAndLogMeetings
    });
});

function extractAndLogMeetings() {
    extractMeetingDetails();  // This function should be defined in content.js
}