var groupedMeetings = {};  // Declare groupedMeetings at the top level

if (typeof jQuery == 'undefined') {
    var script = document.createElement('script');
    script.type = "text/javascript";
    script.src = "https://code.jquery.com/jquery-3.6.0.min.js";
    script.onload = function() {
        initializeUI();
    };
    document.head.appendChild(script);
} else {
    initializeUI();
}

function toggleSidebar() {
    $('#sidebar').toggle();
    if ($('#sidebar').is(':visible')) {
        extractMeetingDetails();
    }
}

// Function to initialize the UI components (button and sidebar)
function initializeUI() {

    // Create a button to show/hide the sidebar
    let button = $('<button id="toggleSidebarButton">Toggle Sidebar</button>');
    button.addClass('toggle-sidebar-button');

    button.click(toggleSidebar);
    $('body').append(button);
    // Adding styles for delete buttons
    

    // Link the styles.css file
    let cssLink = $('<link rel="stylesheet" type="text/css" href="styles.css">');
    $('head').append(cssLink);

    // Create a sidebar to display the event details
   
    let sidebar = $('<div id="sidebar"></div>').addClass('sidebar');
    $('body').append(sidebar);
}

// Mapping of German month names to numerical values
const monthNames = {
    "Januar": "01",
    "Februar": "02",
    "März": "03",
    "April": "04",
    "Mai": "05",
    "Juni": "06",
    "Juli": "07",
    "August": "08",
    "September": "09",
    "Oktober": "10",
    "November": "11",
    "Dezember": "12"
};

// Function to group an array of objects by a property
function groupBy(array, property) {
    return array.reduce((groups, item) => {
        let group = groups[item[property]] || [];
        group.push(item);
        groups[item[property]] = group;
        return groups;
    }, {});
}

function extractMeetingDetails() {
    let meetings = [];
    let meetingPromises = [];
    // Extract meeting details as before, but now we will also group them by date
    $('div[role="button"][class*="root-"]').each(function() {
        let meeting = {};
        // Extract meeting title
        let titleDiv = $(this).find('div[class*="sNIPV"]');
        if (titleDiv.length > 0) {
            meeting.title = titleDiv.contents().filter(function() {
                return this.nodeType === 3; // Node.TEXT_NODE
            }).text().trim();
        }

        // Extract date and time from aria-label attribute
        let ariaLabel = $(this).attr('aria-label');
        if (ariaLabel) {
            let dateAndTimeMatch = ariaLabel.match(/(\d{2})\. (\w+) (\d{4}) (\d{2}):(\d{2}) bis (\d{2}):(\d{2})/);

            if (dateAndTimeMatch) {
                let startDate = new Date(`${dateAndTimeMatch[3]}-${monthNames[dateAndTimeMatch[2]]}-${dateAndTimeMatch[1]}T${dateAndTimeMatch[4]}:${dateAndTimeMatch[5]}:00.000+0000`);
                let endDate = new Date(`${dateAndTimeMatch[3]}-${monthNames[dateAndTimeMatch[2]]}-${dateAndTimeMatch[1]}T${dateAndTimeMatch[6]}:${dateAndTimeMatch[7]}:00.000+0000`);
                let durationMinutes = (endDate - startDate) / (1000 * 60);

                meeting.time = `${durationMinutes} minutes`;
                meeting.date = `${dateAndTimeMatch[1]}.${monthNames[dateAndTimeMatch[2]]}.${dateAndTimeMatch[3]}`;
                meeting.startTimeISO = startDate.toISOString().replace('Z', '+0000');  // Modify the format to match the one used in your Python script
            }
        }

        if (meeting.title && meeting.time && meeting.date) {
            let meetingPromise = new Promise((resolve, reject) => {
                chrome.storage.sync.get(['defaultJiraTicket'], (result) => {
                    meeting.jiraTicket = result.defaultJiraTicket || "CWSA-1";
                    resolve(meeting);
                });
            });
            meetingPromises.push(meetingPromise);
        }
    });

    Promise.all(meetingPromises).then((resolvedMeetings) => {
        groupedMeetings = groupBy(resolvedMeetings, 'date');
        populateSidebar(groupedMeetings);
    });
}

    // Group meetings by date and populate the sidebar
function populateSidebar(groupedMeetings) {
    let sidebar = $('#sidebar');
    sidebar.empty();
    for (let [date, dateMeetings] of Object.entries(groupedMeetings)) {
        let dateSection = $('<div class="date-section" data-date-section="' + date + '"></div>');

        let dateHeader = $('<div class="date-header"><span class="date-text"></span><span class="date-sum"></span><button data-date="' + date + '" class="delete-date-button">X</button></div>');
        dateHeader.find('.date-text').text(date);

        // Your snippet for calculating the sum of hours for each day
        let totalMinutes = dateMeetings.reduce((sum, meeting) => sum + parseInt(meeting.time.match(/\d+/)[0]), 0);
        let hours = Math.floor(totalMinutes / 60);
        let minutes = totalMinutes % 60;
        dateHeader.find('.date-sum').text(` (${hours} hours and ${minutes} minutes)`);

        dateSection.append(dateHeader);
        dateMeetings.forEach((meeting, index) => {
            let uniqueId = `${meeting.date}|${meeting.startTimeISO}`;
            dateSection.append(`<div class="meeting-item" data-unique-id="${uniqueId}">Title: ${meeting.title}, Time: ${meeting.time}<input type="text" value="${meeting.jiraTicket}" class="jira-ticket-input"><button data-date="${date}" data-unique-id="${uniqueId}" class="delete-meeting-button">X</button></div>`);

            // Add event listener to the input field
            let inputElement = dateSection.find('.jira-ticket-input').last();
            inputElement.focus(function() {
                populateTicketDropdown(inputElement);
            });
            inputElement.blur(function() {
                $('.ticket-dropdown').remove();
            });
        });

        sidebar.append(dateSection);
    }

    // Adding "Log to JIRA" button
    let logToJiraButton = $('<button id="logToJiraButton">Log to JIRA</button>');
    logToJiraButton.addClass('log-to-jira-button');

    logToJiraButton.addClass('log-to-jira-button-hover');

    logToJiraButton.click(function() {
        logToJira(groupedMeetings);
    });
    sidebar.append(logToJiraButton);

    // Add event listeners for delete buttons
    $('.delete-date-button').click(function() {
    let dateToDelete = $(this).attr('data-date');
    delete groupedMeetings[dateToDelete];  // remove the entry from groupedMeetings
    $(`.date-section:contains(${dateToDelete})`).remove();
    });

    $('.delete-meeting-button').click(function() {
    let uniqueId = $(this).data('unique-id');
    let [date, startTimeISO] = uniqueId.split('|');
    console.log('Unique ID:', uniqueId);
    console.log('Date:', date);
    console.log('Start Time ISO:', startTimeISO);
    let meetingIndex = groupedMeetings[date].findIndex(meeting => meeting.startTimeISO === startTimeISO);

    if (meetingIndex >= 0) {
        groupedMeetings[date].splice(meetingIndex, 1);
        $(`.meeting-item[data-unique-id="${uniqueId}"]`).remove();

        if (groupedMeetings[date].length === 0) {
            delete groupedMeetings[date];
            $(`.date-section[data-date-section="${date}"]`).remove();
        } else {
            updateDateSum(date);
        }
    } else {
        console.error('Unable to find meeting with unique identifier:', uniqueId);
        console.error('Current state of groupedMeetings at error:', groupedMeetings);
    }
});




}

function updateDateSum(date) {
    let dateMeetings = groupedMeetings[date];
    if (dateMeetings) {
        let totalMinutes = dateMeetings.reduce((sum, meeting) => sum + parseInt(meeting.time.match(/\d+/)[0]), 0);
        let hours = Math.floor(totalMinutes / 60);
        let minutes = totalMinutes % 60;
        $(`.date-section[data-date-section="${date}"]`).find('.date-sum').text(` (${hours} hours and ${minutes} minutes)`);
    }
}


function updateSuccessIndicator(ticketNumber, date, index) {
    let dateSection = $(`.date-section:contains(${date})`);
    let meetingItem = dateSection.find('.meeting-item').eq(index);
    meetingItem.append('<span class="success-indicator">✔</span>');

}

function logToJira(groupedMeetings) {
    console.log("Logging to JIRA...");

    $('.date-section').each(function() {
        console.log("Inside date section loop");
        let date = $(this).find('.date-text').text();
        console.log("Date:", date);
        let dateMeetings = groupedMeetings[date]; // Get the array of meetings for the current date
        console.log("Date Meetings:", dateMeetings);

        $(this).find('.meeting-item').each(function(index) {
            console.log("Inside meeting item loop");
            let meeting = dateMeetings[index];
            let title = meeting.title;
            let time = meeting.time;
            //trim to remove spacees 
            let ticketNumber = $(this).find('.jira-ticket-input').val().trim();
            console.log(`Logging time for ticket ${ticketNumber}: Date: ${date}, Title: ${title}, Time: ${time}`);
            // Convert time from minutes to seconds for Jira API
            let timeInSeconds = parseInt(time.match(/\d+/)[0]) * 60;

            // Setting up the request payload
            let payload = JSON.stringify({
                "comment": {
                    "content": [
                        {
                            "content": [
                                {
                                    "text": title,
                                    "type": "text"
                                }
                            ],
                            "type": "paragraph"
                        }
                    ],
                    "type": "doc",
                    "version": 1
                },
                "started": meeting.startTimeISO,  // Use the stored start time
                "timeSpentSeconds": timeInSeconds
            });

            // Construct details object to send as message
            let details = {
                payload: payload,
                ticketNumber: ticketNumber,
                date: date,
                time: time,
                title: title
            };

            // Send message to background script
            chrome.runtime.sendMessage({action: "logToJira", details: details}, response => {
                console.log(response.message);
                if (response.success) {
                    updateSuccessIndicator(details.ticketNumber, details.date, index);
                }
            });
        });
    });
}

function populateTicketDropdown(inputElement) {
    chrome.storage.sync.get(['recentTickets'], (result) => {
        let recentTickets = result.recentTickets || [];
        let dropdown = $('<div class="ticket-dropdown"></div>');
        recentTickets.forEach(ticketDetails => {
            let option = $(`<div class="ticket-option">${ticketDetails.ticketNumber} - ${ticketDetails.ticketName} - ${ticketDetails.projectName}</div>`);
            option.click(function() {
                inputElement.val(ticketDetails.ticketNumber);
                dropdown.remove();
            });
            dropdown.append(option);
        });
        dropdown.insertAfter(inputElement);
    });
}