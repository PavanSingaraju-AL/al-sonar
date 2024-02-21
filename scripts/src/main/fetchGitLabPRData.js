const axios = require('axios');
const fs = require('fs');
const moment = require('moment');
const csvFilePath = 'output.csv';
const { createObjectCsvWriter } = require('csv-writer');

// Load configuration from JSON
const config = require('./config.json'); // Assuming your JSON config is in config.json file

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

// Function to fetch merge requests created by a specific author after a certain date
async function getMergeRequests(author, fromDate, projectConfig) {
    const url = `${config.gitlab.baseURL}${projectConfig.project_id}${config.gitlab.pr_apiURLs}`
                .replace('$author_name', author)
                .replace('$created_after_date', fromDate);
    try {
        const response = await axios.get(url, { headers: { 'PRIVATE-TOKEN': projectConfig.token } });
        return response.data;
    } catch (error) {
        console.error('Error fetching merge requests:', error.message);
        throw error;
    }
}

// Function to fetch comments for a merge request
async function getMergeRequestComments(projectId, mergeRequestId, projectConfig) {
    const url = `${config.gitlab.baseURL}${projectId}/merge_requests/${mergeRequestId}${config.gitlab.comment_apiURL}`;
    try {
        const response = await axios.get(url, { headers: { 'PRIVATE-TOKEN': projectConfig.token } });
        return response.data;
    } catch (error) {
        console.error('Error fetching merge request comments:', error.message);
        throw error;
    }
}

// Main function to fetch merge requests and comments
async function fetchMergeRequestsAndComments() {
    const prsAndCommits = [];
    for (const projectConfig of config.gitlab.projects) {
        const fromDate = moment(projectConfig.created_after).toISOString();
        for (const author of projectConfig.author_usernames) {
            try {
                const mergeRequests = await getMergeRequests(author, fromDate, projectConfig);
                
                for (const mr of mergeRequests) {
                    const commits = await getMergeRequestComments(projectConfig.project_id, mr.iid, projectConfig);
                    const prData = {
                        pr_title: mr.title,
                        pr_author: mr.author.name,
                        pr_created_at: mr.created_at,
                        pr_status: mr.state,
                        pr_closed_on: mr.merged_at
                    };
                    const commentsData = commits.map(commit => ({
                        pr_title: mr.title,
                        pr_author: mr.author.name,
                        pr_priority: '',
                        pr_size: '',
                        pr_status: mr.state,
                        pr_closed_on: mr.merged_at,
                        pr_no_of_days: calculateDaysSinceClosed(mr.merged_at, mr.created_at),
                        pr_returned: '',
                        commit_comment: commit.body
                        
                    }));
                    // Combine PR and commit data
                    prsAndCommits.push(commentsData);
                }
            } catch (error) {
                console.error('Error fetching merge requests and comments:', error.message);
            }
        }
    }
    console.log(prsAndCommits);
    
    // Write data to CSV
    const csvWriter = createObjectCsvWriter({
        path: 'gitlab_PR_Comments.csv',
        header: [
            { id: 'pr_title', title: 'PR Title' },
            { id: 'pr_author', title: 'PR Author' },
            { id: 'pr_priority', title: 'PR Priority'},
            { id: 'pr_size', title: 'Story Points'},
            { id: 'pr_status', title: 'PR Status' },
            { id: 'pr_closed_on', title: 'PR Closed On' },
            { id: 'pr_no_of_days', title: 'No. Of Days to Close the PR' },
            { id: 'pr_returned', title: 'Is PR Returned?' },
            { id: 'commit_comment', title: 'Comment' }
            
        ]
    });

    csvWriter.writeRecords(prsAndCommits.flat())
        .then(() => console.log('CSV file has been written successfully'))
        .catch(error => console.error('Error writing CSV file', error));
}


// Run the main function
fetchMergeRequestsAndComments();

