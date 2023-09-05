chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "logToJira") {
        logToJira(request.details, sendResponse); // Pass sendResponse as an argument
        return true;  // Indicate that we will send a response asynchronously
    }
});

function logToJira(details, sendResponse) {
    console.log("Logging to JIRA...");

    chrome.storage.sync.get(['jiraEmail', 'jiraApiToken', 'jiraBaseUrl'], (result) => {
        const JIRA_EMAIL = result.jiraEmail || "default_email@example.com";
        const JIRA_API_TOKEN = result.jiraApiToken || "default_api_token";
        const JIRA_BASE_URL = result.jiraBaseUrl || "https://default.jira.url/";

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

            // Fetch ticket details
            fetch(`${JIRA_BASE_URL}rest/api/3/issue/${details.ticketNumber}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Basic ${btoa(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`)}`,
                    "Accept": "application/json"
                }
            })
            .then(response => response.json())
            .then(ticketData => {
                let ticketDetails = {
                    ticketNumber: details.ticketNumber,
                    ticketName: ticketData.fields.summary,
                    projectName: ticketData.fields.project.name
                };
                updateStoredTickets(ticketDetails);  // Update the stored tickets with ticket details
                sendResponse({message: "Time successfully logged", success: true}); // Send success response
            })
            .catch(error => {
                console.error(`Error fetching ticket details for ID ${details.ticketNumber}.`);
                console.error("Error:", error);
                sendResponse({message: "Error fetching ticket details", success: false}); // Send error response
            });
        })
        .catch(error => {
            console.error(`Error logging time for ticket ID ${details.ticketNumber}.`);
            console.error("Error:", error);
            sendResponse({message: "Error logging time", success: false}); // Send error response
        });
    });
}

function updateStoredTickets(ticketDetails) {
    chrome.storage.sync.get(['recentTickets'], (result) => {
        let recentTickets = result.recentTickets || [];
        // Remove the ticketDetails if it already exists in the array
        recentTickets = recentTickets.filter(ticket => ticket.ticketNumber !== ticketDetails.ticketNumber);
        // Add the ticketDetails at the beginning of the array
        recentTickets.unshift(ticketDetails);
        // Keep only the last 10 tickets
        recentTickets = recentTickets.slice(0, 10);
        // Store the updated recentTickets array
        chrome.storage.sync.set({recentTickets: recentTickets});
    });
}

function clearStoredTickets() {
    chrome.storage.sync.set({recentTickets: []}, () => {
        console.log('Recent tickets storage cleared');
    });
}