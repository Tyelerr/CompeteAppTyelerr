const { XMLParser } = require('fast-xml-parser');

async function testFeed() {
  try {
    console.log('Testing azbilliards.com RSS feed...');

    const response = await fetch('https://www.azbilliards.com/feed/');
    console.log('Response status:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    let xmlText = await response.text();
    console.log('XML length:', xmlText.length);
    console.log('First 200 chars:', xmlText.substring(0, 200));

    // Fix malformed XML
    xmlText = xmlText.trim();
    const lastCompleteItemIndex = xmlText.lastIndexOf('</item>');
    if (lastCompleteItemIndex > -1) {
      const afterLastItem = xmlText.substring(lastCompleteItemIndex + 7);
      if (
        afterLastItem.includes('<item>') &&
        !afterLastItem.includes('</item>')
      ) {
        console.log('Found incomplete item tag, fixing...');
        xmlText =
          xmlText.substring(0, lastCompleteItemIndex + 7) +
          afterLastItem.substring(0, afterLastItem.indexOf('<item>')) +
          '</channel></rss>';
      }
    }

    const options = {
      ignoreAttributes: false,
      attributeNameProcessors: [(name) => name.replace(':', '_')],
      allowBooleanAttributes: true,
      parseNodeValue: true,
      parseAttributeValue: true,
      cdataPropName: '__cdata',
    };

    const parser = new XMLParser(options);
    const result = parser.parse(xmlText);

    console.log('Parse successful!');
    console.log('Channel title:', result.rss.channel.title);

    if (result.rss.channel.item) {
      const items = Array.isArray(result.rss.channel.item)
        ? result.rss.channel.item
        : [result.rss.channel.item];
      console.log('Number of items found:', items.length);

      if (items.length > 0) {
        console.log('First item title:', items[0].title);
        console.log(
          'First item description preview:',
          items[0].description?.__cdata?.substring(0, 100) + '...',
        );
        console.log('First item author:', items[0]['dc_creator']?.__cdata);
        console.log('First item date:', items[0].pubDate);
      }
    } else {
      console.log('No items found in feed');
    }
  } catch (error) {
    console.error('Feed test failed:', error.message);
  }
}

testFeed();
