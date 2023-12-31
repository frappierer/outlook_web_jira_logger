# Remarks 
* Currently the Extension is parsing only German calender entries
* You find a more sophisticated version of this [https://github.com/Tylopilus/jira-timebooker](https://github.com/Tylopilus/jira-timebooker) here. Englisch Kalender is also working there.


# Chrome Extension for Jira Integration

This Chrome extension helps to log meetings directly from Outlook webview to **JIRA Cloud** (On-prem is untested) with ease. It shows a sidebar with all meetings of the current view. In the sidebar, you can then edit the meetings and log them in bulk to jira.

For the Extension to work the Url pattern must follow `https://*/calendar/view/*`.

 ![image](https://github.com/frappierer/outlook_web_jira_logger/assets/4376185/22af64f1-d86a-4fd6-8bbb-e94192e86d8a)



## Features

- Extract and log meeting details automatically
- Will work in single day view and multi day views
- Integration with JIRA API to log hours
- Easy to use UI integrated directly into your browser
- Group meetings by date
- It will save the last 10 tickets you log work to.

## Installation

1. Clone or [download](https://github.com/frappierer/outlook_web_jira_logger/archive/refs/heads/main.zip) the repository to your local machine.
2. Open the Google Chrome browser.
3. Go to `chrome://extensions/`.
4. Check the `Developer mode` checkbox.
5. Click on the `Load unpacked` button.
6. Navigate to the location where you cloned the repository and select the folder containing the extension files.
7. The extension should now be installed and you will see it in your list of extensions.
8. Go to https://id.atlassian.com/manage-profile/security/api-tokens to create a jira token.
9. Add your Jira Credentials via the Options Page: ![main_large](https://github.com/frappierer/outlook_web_jira_logger/assets/4376185/dc9536c0-6480-463b-aaa7-b7e8f031f002)



## Usage

1. Click on the `Log Meetings` button that appears in your browser.
2. The extension will automatically extract meeting details from the page and group them by date.
3. You can edit the duration and associate meetings with JIRA tickets directly in the extension sidebar.
4. Click on the `Log to JIRA` button to log all the meetings to JIRA.

