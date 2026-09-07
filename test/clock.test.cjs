const { test } = require('node:test');
const assert = require('node:assert/strict');
const { archiveStart, clockText } = require('../extension/content.js');

const id = 'fGdv79lZHIw';
function archive() {
  return {
    videoDetails: { videoId: id, isLiveContent: true },
    microformat: { playerMicroformatRenderer: { liveBroadcastDetails: {
      isLiveNow: false,
      startTimestamp: '2020-07-12T02:42:34Z',
      endTimestamp: '2020-07-12T14:28:44Z',
    } } },
  };
}

test('only completed archives with matching video IDs and valid timestamps qualify', () => {
  assert.equal(archiveStart(archive(), id), Date.parse('2020-07-12T02:42:34Z'));
  for (const change of [
    r => { r.videoDetails.isLiveContent = false; },
    r => { r.videoDetails.isLive = true; },
    r => { r.videoDetails.isUpcoming = true; },
    r => { r.videoDetails.videoId = 'xxxxxxxxxxx'; },
    r => { r.microformat.playerMicroformatRenderer.liveBroadcastDetails.isLiveNow = true; },
    r => { delete r.microformat.playerMicroformatRenderer.liveBroadcastDetails.isLiveNow; },
    r => { delete r.microformat.playerMicroformatRenderer.liveBroadcastDetails.endTimestamp; },
    r => { r.microformat.playerMicroformatRenderer.liveBroadcastDetails.startTimestamp = 'invalid'; },
    r => { r.microformat.playerMicroformatRenderer.liveBroadcastDetails.startTimestamp = '2020-07-12T02:42:34'; },
    r => { r.microformat.playerMicroformatRenderer.liveBroadcastDetails.endTimestamp = '2020-07-11T00:00:00Z'; },
  ]) {
    const response = archive(); change(response);
    assert.equal(archiveStart(response, id), null);
  }
  for (const response of [null, {}, { videoDetails: {} }]) assert.equal(archiveStart(response, id), null);
  assert.equal(archiveStart(archive(), null), null);
});

test('local dates, example, rollover, seek and invalid positions', () => {
  process.env.TZ = 'Asia/Tokyo';
  const start = archiveStart(archive(), id);
  assert.equal(clockText(start, 13260.9), ' (2020-07-12 15:23:34)');
  assert.equal(clockText(start, 0), ' (2020-07-12 11:42:34)');
  assert.equal(clockText(Date.parse('2020-12-31T14:59:59Z'), 1), ' (2021-01-01 00:00:00)');
  process.env.TZ = 'America/New_York';
  assert.equal(clockText(Date.parse('2020-03-08T06:59:59Z'), 1), ' (2020-03-08 03:00:00)');
  for (const seconds of [-1, NaN, Infinity, '12']) assert.equal(clockText(start, seconds), '');
  assert.equal(clockText(null, 0), '');
});
