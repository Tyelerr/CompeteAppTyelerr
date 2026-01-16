/**
 * RSS Feed Diagnostic Test Script
 *
 * This script tests the RSS feed from azbilliards.com using multiple approaches
 * to help diagnose why the feed might not be loading in the app.
 */

const fetch = require('node-fetch');
const { XMLParser } = require('fast-xml-parser');

// Multiple URL strategies for mobile compatibility
const feedUrls = [
  'https://www.azbilliards.com/feed/',
  'https://api.allorigins.win/get?url=' +
    encodeURIComponent('https://www.azbilliards.com/feed/'),
  'https://corsproxy.io/?' +
    encodeURIComponent('https://www.azbilliards.com/feed/'),
];

// Test headers to mimic mobile browser
const headers = {
  'User-Agent':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
  Accept: 'application/rss+xml, application/xml, text/xml, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
};

// XML parser options
const options = {
  ignoreAttributes: false,
  attributeNameProcessors: [(name) => name.replace(':', '_')],
  allowBooleanAttributes: true,
  parseNodeValue: true,
  parseAttributeValue: true,
  cdataPropName: '__cdata',
};

const parser = new XMLParser(options);

// Test each URL
async function testFeed(url, index) {
  console.log(`\n----- Testing URL ${index + 1}: ${url} -----`);

  try {
    console.log('Fetching...');
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
      timeout: 15000,
    });

    console.log(`Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      throw new Error(
        `HTTP error! status: ${response.status} - ${response.statusText}`,
      );
    }

    let xmlText = await response.text();
    console.log(`Response length: ${xmlText.length} characters`);

    // Handle proxy responses that wrap the XML
    if (index > 0) {
      try {
        const proxyResponse = JSON.parse(xmlText);
        if (proxyResponse.contents) {
          xmlText = proxyResponse.contents;
          console.log(
            `Extracted content from proxy response, new length: ${xmlText.length} characters`,
          );
        }
      } catch (e) {
        console.log(`Not a JSON proxy response, using as-is`);
      }
    }

    if (!xmlText || xmlText.trim().length === 0) {
      throw new Error('Empty response received from feed');
    }

    // Log the first 200 characters to see what we're getting
    console.log(`Response preview: ${xmlText.substring(0, 200)}...`);

    // Fix malformed XML by removing incomplete item tags at the end
    xmlText = xmlText.trim();
    const lastCompleteItemIndex = xmlText.lastIndexOf('</item>');
    if (lastCompleteItemIndex > -1) {
      const afterLastItem = xmlText.substring(lastCompleteItemIndex + 7);
      if (
        afterLastItem.includes('<item>') &&
        !afterLastItem.includes('</item>')
      ) {
        console.log('Found incomplete item tag, fixing XML...');
        xmlText =
          xmlText.substring(0, lastCompleteItemIndex + 7) +
          afterLastItem.substring(0, afterLastItem.indexOf('<item>')) +
          '</channel></rss>';
      }
    }

    try {
      console.log('Parsing XML...');
      const result = parser.parse(xmlText);

      if (!result?.rss?.channel) {
        throw new Error('Invalid RSS feed structure - missing channel');
      }

      // Handle case where there are no items or items is not an array
      let newsItems = [];
      if (result.rss.channel.item) {
        newsItems = Array.isArray(result.rss.channel.item)
          ? result.rss.channel.item
          : [result.rss.channel.item];

        // Filter out incomplete items
        const originalCount = newsItems.length;
        newsItems = newsItems.filter(
          (item) =>
            item &&
            item.title &&
            item.description &&
            item.link &&
            item.pubDate &&
            (item['dc_creator'] || item['dc:creator']),
        );

        console.log(
          `Found ${newsItems.length} valid items out of ${originalCount} total items`,
        );

        // Print the first item as a sample
        if (newsItems.length > 0) {
          console.log('\nSample item:');
          const item = newsItems[0];
          console.log(`Title: ${item.title}`);
          console.log(`Link: ${item.link}`);
          console.log(`Date: ${item.pubDate}`);
          console.log(
            `Creator: ${
              item['dc:creator']?.__cdata ||
              item['dc_creator']?.__cdata ||
              'Unknown'
            }`,
          );
          console.log(
            `Description: ${item.description.__cdata.substring(0, 100)}...`,
          );
        }

        console.log(`\nURL ${index + 1} TEST RESULT: SUCCESS ✅`);
      } else {
        console.log(`No items found in feed`);
        console.log(
          `\nURL ${index + 1} TEST RESULT: FAILED ❌ (No items in feed)`,
        );
      }
    } catch (parseError) {
      console.error(`XML parsing error: ${parseError.message}`);
      console.log(
        `\nURL ${index + 1} TEST RESULT: FAILED ❌ (XML parsing error)`,
      );
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.log(`\nURL ${index + 1} TEST RESULT: FAILED ❌ (${error.message})`);
  }
}

// Main function to test all URLs
async function testAllFeeds() {
  console.log('=== RSS FEED DIAGNOSTIC TEST ===');
  console.log(
    `Testing ${feedUrls.length} different URLs for the AZBilliards RSS feed\n`,
  );

  for (let i = 0; i < feedUrls.length; i++) {
    await testFeed(feedUrls[i], i);
  }

  console.log('\n=== TEST SUMMARY ===');
  console.log('If all URLs failed, check:');
  console.log('1. Network connectivity (especially on iOS TestFlight builds)');
  console.log('2. CORS issues (the proxy URLs should help with this)');
  console.log(
    '3. AZBilliards feed availability (the site might be blocking requests)',
  );
  console.log(
    '4. HTTP vs HTTPS issues (iOS ATS might be blocking HTTP requests)',
  );
  console.log(
    '\nIf at least one URL succeeded, update the app to use that URL first in the list.',
  );
}

// Run the tests
testAllFeeds().catch(console.error);
