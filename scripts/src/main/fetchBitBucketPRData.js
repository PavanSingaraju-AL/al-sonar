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
async function getMergeRequests(projectConfig, author) {
    const prsURL = `${config.bitbucket.baseURL}${config.bitbucket.pr_apiURLs}${author}`;
    try {
        const response = await axios.get(prsURL, { auth: {
                                                    username: projectConfig.access_userid,
                                                    password: projectConfig.token
                                                } });
        return response.data;
    } catch (error) {
        console.error('Error fetching merge requests:', error.message);
        throw error;
    }
}

// Function to fetch comments for a merge request
async function getMergeRequestComments(mergeRequestId, projectConfig) {
    const commentsURL = `${config.bitbucket.baseURL}${config.bitbucket.pr_commentsURL}`
                    .replace('$workspace', projectConfig.workspace)
                    .replace('$repo_slug', projectConfig.repo_slug)
                    .replace('$pull_request_id', mergeRequestId);

    try {
        const response = await axios.get(commentsURL, { auth: {
                                                            username: projectConfig.access_userid,
                                                            password: projectConfig.token
                                                        } });
        return response.data;
    } catch (error) {
        console.error('Error fetching merge request comments:', error.message);
        throw error;
    }
}

// Main function to fetch merge requests and comments
async function fetchMergeRequestsAndComments() {
    const prsAndCommits = [];
    for (const projectConfig of config.bitbucket.projects) {
        const fromDate = moment(projectConfig.created_from).toISOString();
        const toDate = moment(projectConfig.created_upto).toISOString();
        
        for (const author of projectConfig.author_usernames) {
            try {
                const mergeRequests = await getMergeRequests(projectConfig, author);

                const filteredMRs = mergeRequests.values.filter(mr => 
                    mr.comment_count > 0 && 
                    (moment(mr.created_on).isSameOrAfter(fromDate) || 
                    moment(mr.created_on).isSameOrBefore(toDate)) 
                );
                for (const mr of filteredMRs) {

                    const commits = await getMergeRequestComments(mr.id, projectConfig);

                    const commentsData = commits.values.map(commit => ({
                        pr_title: mrTitle,
                        pr_author: mr.author.display_name,
                        pr_priority: '',
                        pr_size: '',
                        pr_status: mr.state,
                        pr_created_at: mr.created_on,
                        pr_closed_on: mr.merged_at,
                        pr_no_of_days: calculateDaysSinceClosed(mr.merged_at, mr.created_at),
                        pr_returned: '',
                        commit_comment: commit.content.raw,
                        pr_URL: commit.pullrequest.links.html.href
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
        path: 'bitbucket_PR_Comments.csv',
        header: [
            { id: 'pr_title', title: 'PR Title' },
            { id: 'pr_author', title: 'PR Author' },
            { id: 'pr_priority', title: 'PR Priority'},
            { id: 'pr_size', title: 'Story Points'},
            { id: 'pr_status', title: 'PR Status' },
            { id: 'pr_created_at', title: 'PR Created On' },
            { id: 'pr_closed_on', title: 'PR Closed On' },
            { id: 'pr_no_of_days', title: 'No. Of Days to Close the PR' },
            { id: 'pr_returned', title: 'Is PR Returned?' },
            { id: 'commit_comment', title: 'Comment' },
            { id: 'pr_URL', title: 'PR URL' }
        ]
    });

    csvWriter.writeRecords(prsAndCommits.flat())
        .then(() => console.log('CSV file has been written successfully'))
        .catch(error => console.error('Error writing CSV file', error));
}


// Run the main function
fetchMergeRequestsAndComments();

