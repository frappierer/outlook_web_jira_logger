chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "logToJira") {
        logToJira(request.details, sendResponse); // Pass sendResponse as an argument
        return true;  // Indicate that we will send a response asynchronously
    }
});


function logToJira(details, sendResponse) {
    console.log("Logging to JIRA...");

    // Constants for Jira authentication and the base URL
    const JIRA_EMAIL = "xxx";
    const JIRA_API_TOKEN = "xxx";
    const JIRA_BASE_URL = "https://xxx.atlassian.net/";

    fetch(`${JIRA_BASE_URL}rest/api/3/issue/${details.ticketNumber}/worklog`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${btoa(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`)}`,
            "Accept": "application/json",
            "X-Atlassian-Token": "no-check"
        },
        body: details.payload
    })
    .then(response => response.json())
    .then(data => {
        console.log(`Time successfully logged for ticket ID ${details.ticketNumber} on ${details.date}: ${details.time}. Comment: ${details.title}`);
        console.log("Response Data:", data);
        sendResponse({message: "Time successfully logged", success: true}); // Send success response
    })
    .catch(error => {
        console.error(`Error logging time for ticket ID ${details.ticketNumber}.`);
        console.error("Error:", error);
        sendResponse({message: "Error logging time", success: false}); // Send error response
    });
}

