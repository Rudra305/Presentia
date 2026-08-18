#!/usr/bin/env node

/**
 * Automatically updates GitHub repository homepage/description and README.md
 * with the latest Expo EAS Build URL.
 * 
 * Usage:
 *   node scripts/update-github-build-url.js <build-url-or-id>
 * Example:
 *   node scripts/update-github-build-url.js https://expo.dev/accounts/ashutoshba/projects/presentia/builds/05ff628b-bc5d-4548-8635-ed48a8c0852a
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const GITHUB_REPO = 'Rudra305/Presentia';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

let inputUrl = process.argv[2];

if (!inputUrl) {
  console.log('Usage: node scripts/update-github-build-url.js <build-url-or-uuid>');
  process.exit(1);
}

let buildUrl = inputUrl;
if (!inputUrl.startsWith('http')) {
  buildUrl = `https://expo.dev/accounts/ashutoshba/projects/presentia/builds/${inputUrl}`;
}

console.log(`\n🚀 Updating GitHub Repository with new Build URL:`);
console.log(`🔗 ${buildUrl}\n`);

// 1. Update README.md
try {
  const readmePath = path.join(__dirname, '..', 'README.md');
  if (fs.existsSync(readmePath)) {
    let content = fs.readFileSync(readmePath, 'utf8');
    content = content.replace(
      /https:\/\/expo\.dev\/accounts\/ashutoshba\/projects\/presentia\/builds\/[a-zA-Z0-9-]+/g,
      buildUrl
    );
    fs.writeFileSync(readmePath, content, 'utf8');
    console.log('✅ README.md updated successfully with new build URL.');
  }
} catch (err) {
  console.warn('⚠️ Could not update README.md:', err.message);
}

// 2. Update GitHub Repo Metadata via API
if (!GITHUB_TOKEN) {
  console.log('ℹ️ GITHUB_TOKEN environment variable not set. Skipping GitHub API update (README.md updated).');
  process.exit(0);
}

const payload = Buffer.from(
  JSON.stringify({
    name: 'Presentia',
    description: '📱 Offline-first, on-device AI face recognition student attendance and analytics mobile app (Expo SDK 54, React Native 0.81, SQLite)',
    homepage: buildUrl
  })
);

const req = https.request(
  {
    hostname: 'api.github.com',
    path: `/repos/${GITHUB_REPO}`,
    method: 'PATCH',
    headers: {
      'User-Agent': 'Presentia-Build-Sync',
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'Content-Length': payload.length
    }
  },
  (res) => {
    let body = '';
    res.on('data', (d) => (body += d));
    res.on('end', () => {
      try {
        const json = JSON.parse(body);
        if (json.homepage) {
          console.log(`✅ GitHub repository homepage updated to: ${json.homepage}`);
        } else {
          console.log('API Response:', json.message || body);
        }
      } catch (e) {
        console.log('Finished updating GitHub repository.');
      }
    });
  }
);

req.on('error', (e) => {
  console.error('❌ Failed to update GitHub repository:', e.message);
});

req.write(payload);
req.end();
