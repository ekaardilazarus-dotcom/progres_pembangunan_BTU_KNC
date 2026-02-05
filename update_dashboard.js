
const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'dashboard.html');
let content = fs.readFileSync(filePath, 'utf8');

// Remove User 1 Page
// Find start index
const user1Start = content.indexOf('<div class="page-content user1-page"');
// Find User 2 start to know where User 1 ends (assuming User 2 comes after User 1)
const user2Start = content.indexOf('<div class="page-content user2-page"');

if (user1Start !== -1 && user2Start !== -1) {
    console.log('Removing User 1 Page...');
    // Extract the part before User 1 and the part starting from User 2
    const before = content.substring(0, user1Start);
    // We want to keep User 2, so start from user2Start
    const after = content.substring(user2Start);
    content = before + '\n' + after;
} else {
    console.log('User 1 or User 2 marker not found');
}

// Remove User 3 Page
const user3Start = content.indexOf('<div class="page-content user3-page"');
const user4Start = content.indexOf('<div class="page-content user4-page"');

if (user3Start !== -1 && user4Start !== -1) {
    console.log('Removing User 3 Page...');
    const before = content.substring(0, user3Start);
    const after = content.substring(user4Start);
    content = before + '\n' + after;
} else {
    console.log('User 3 or User 4 marker not found');
}

// Also remove the "Landing Page" content (Role Buttons) so we don't see them?
// The user wants a new menu. The old landing page is inside <div class="main-content" id="landingPage">
// We should probably keep it but hide it via CSS or JS, OR replace it with a "Loading..." or empty state.
// Since navigation.js expects "landingPage" to exist (we just added the ID), we should keep the DIV but maybe empty it or hide it.
// Actually, if we access dashboard.html directly, we might want to see something.
// But the user said "pecah ... menjadi 3".
// Let's leave the landing page as is for now, but CSS will hide it if a role is selected.

fs.writeFileSync(filePath, content);
console.log('dashboard.html updated successfully');
