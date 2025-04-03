import fs from 'fs';
import { parseString, Builder } from 'xml2js';

const filename = process.argv[2];
const output = process.argv[3] || 'updated.mpd';

if (!filename) {
  throw Error('Please provide a file');
}
fs.existsSync('./output') || fs.mkdirSync('./output');

const __dirname = new URL('.', import.meta.url).pathname;
const mpdFile = fs.readFileSync(__dirname + filename, 'utf8');

function repackMPD(mpdObject) {
  if (mpdObject.MPD.Period.length > 1) {
    throw Error('Multiple Periods not supported');
  }
  const period = mpdObject.MPD.Period[0];
  period.AdaptationSet.forEach((adaptationSet) => {
    if (adaptationSet.SegmentTemplate.length > 1) {
      throw Error(
        'Multiple SegmentTemplates not supported at adaptation level'
      );
    }
    const timescale = adaptationSet.SegmentTemplate[0].$['timescale'];
    delete adaptationSet.SegmentTemplate;

    adaptationSet.Representation.forEach((representation) => {
      if (representation.SegmentTemplate.length > 1) {
        throw Error(
          'Multiple SegmentTemplates not supported at representation level'
        );
      }
      representation.SegmentTemplate[0].$['timescale'] = timescale;
    });
  });

  return mpdObject;
}

parseString(mpdFile, (err, jsObject) => {
  const repackedMPD = repackMPD(jsObject);

  const builder = new Builder();
  const xml = builder.buildObject(repackedMPD);
  fs.writeFileSync(`output/${output}`, xml);
});
