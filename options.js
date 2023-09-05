document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector('form').addEventListener('submit', saveOptions);
document.querySelector('#clear-storage-button').addEventListener('click', clearStoredTickets);

function clearStoredTickets() {
    chrome.storage.sync.set({recentTickets: []}, () => {
        console.log('Recent tickets storage cleared');
    });
}

function saveOptions(e) {
    e.preventDefault();
    chrome.storage.sync.set({
        jiraEmail: document.querySelector('#jira-email').value,
        jiraApiToken: document.querySelector('#jira-api-token').value,
        jiraBaseUrl: document.querySelector('#jira-base-url').value,
        defaultJiraTicket: document.querySelector('#default-jira-ticket').value,
    }, () => {
        console.log('Options saved');
    });
}

function restoreOptions() {
    chrome.storage.sync.get(['jiraEmail', 'jiraApiToken', 'jiraBaseUrl', 'defaultJiraTicket'], (result) => {
        document.querySelector('#jira-email').value = result.jiraEmail || '';
        document.querySelector('#jira-api-token').value = result.jiraApiToken || '';
        document.querySelector('#jira-base-url').value = result.jiraBaseUrl || '';
        document.querySelector('#default-jira-ticket').value = result.defaultJiraTicket || '';
    });
}
