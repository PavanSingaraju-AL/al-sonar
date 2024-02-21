const axios = require('axios');
const fs = require('fs');
const moment = require('moment');
const { createObjectCsvWriter } = require('csv-writer');

// Load configuration from JSON
const config = require('./github_config.json'); // Assuming your JSON config is in config.json file

// Function to fetch pull requests created by a specific author after a certain date
async function getPullRequests(author, fromDate, projectConfig) {
    const url = `https://api.github.com/repos/${projectConfig.owner}/${projectConfig.repo}/pulls`;
    try {
        const response = await axios.get(url, {
            params: {
                state: 'all', // Include closed pull requests as well
                creator: author,
                since: fromDate
            },
            headers: {
                'Authorization': `token ${projectConfig.token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching pull requests:', error.message);
        throw error;
    }
}

function calculateDaysSinceClosed(closedAt, createdAt) {
    if (!closedAt) {
      return ''; // Indicate "not applicable" for open PRs
    }
  
    const closedDate = new Date(closedAt);
    const createdDate = new Date(createdAt);
    const timeDiff = closedDate.getTime() - createdDate.getTime();
    const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    return days;
}

// Function to fetch comments for a pull request
async function getPullRequestComments(pullRequest, projectConfig) {
    const url = pullRequest.comments_url;
    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `token ${projectConfig.token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching pull request comments:', error.message);
        throw error;
    }
}

// Main function to fetch pull requests and comments
async function fetchPullRequestsAndComments() {
    const prsAndComments = [];
    for (const projectConfig of config.github.projects) {
        const fromDate = moment(projectConfig.created_after).toISOString();
        for (const author of projectConfig.author_usernames) {
            try {
                const pullRequests = await getPullRequests(author, fromDate, projectConfig);
                for (const pr of pullRequests) {
                    const comments = await getPullRequestComments(pr, projectConfig);
                    const prData = {
                        pr_title: pr.title,
                        pr_author: pr.user.login,
                        pr_created_at: pr.created_at,
                        pr_status: pr.state,
                        pr_closed_on: pr.closed_at
                    };
                    const commentsData = comments.map(comment => ({
                        pr_title: pr.title,
                        pr_author: pr.user.login,
                        pr_priority: '',
                        pr_size: '',
                        pr_status: pr.state,
                        pr_closed_on: pr.closed_at,
                        pr_no_of_days: calculateDaysSinceClosed(pr.closedAt, pr.createdAt),
                        pr_returned: '',
                        comment_body: comment.body
                    }));
                    // Combine PR and comment data
                    prsAndComments.push(commentsData);
                }
            } catch (error) {
                console.error('Error fetching pull requests and comments:', error.message);
            }
        }
    }
    console.log(prsAndComments);

    // Write data to CSV
    const csvWriter = createObjectCsvWriter({
        path: 'github_output.csv',
        header: [
            { id: 'pr_title', title: 'PR Title' },
            { id: 'pr_author', title: 'PR Author' },
            { id: 'pr_priority', title: 'PR Priority'},
            { id: 'pr_size', title: 'Story Points'},
            { id: 'pr_status', title: 'PR Status' },
            { id: 'pr_closed_on', title: 'PR Closed On' },
            { id: 'pr_no_of_days', title: 'No. Of Days to Close the PR' },
            { id: 'pr_returned', title: 'Is PR Returned?' },
            { id: 'comment_body', title: 'Comment Body' }
        ]
    });

    csvWriter.writeRecords(prsAndComments.flat())
        .then(() => console.log('CSV file has been written successfully'))
        .catch(error => console.error('Error writing CSV file', error));
}

// Run the main function
fetchPullRequestsAndComments();
