import React from 'react';
import { ContentState, convertFromHTML } from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';

const htmlToState = (html) =>  {
  const blocksFromHtml = convertFromHTML(html);
  return ContentState.createFromBlockArray(
    blocksFromHtml.contentBlocks,
    blocksFromHtml.entityMap
  );
};

const groupBySection = (blocks) => {
  const go = (remaining, current, all) => {
    const [head, ...tail] = remaining;
    if (head) {
      if (head.getType() === 'header-three') {
        return go(tail, [head], [...all, current]);
      } else {
        return go(tail, [...current, head], all);
      }
    } else {
      return [...all, current].filter(bs => bs.length > 0);
    }
  };
  return go(blocks, [], []);
};

const blocksToHtml = blocks => {
  return stateToHTML(ContentState.createFromBlockArray(
    blocks,
    {}
  ));
};

const Ad = () => (
  <div className="ad">
    AD HERE
  </div>
);

const StickyAd = () => (
  <div className="sticky-ad">
    STICKY AD HERE
  </div>
);

const mergeBlocks = (components, blocks) => {
  return (blocks.length === 0)
    ? components
    : [...components, (
      <div
        key={`${components.length}`}
        dangerouslySetInnerHTML={{__html: blocksToHtml(blocks)}}
      ></div>
    )]
};

const Section = ({ contents, stickyAds }) => (
  <section className="section">
    <div className="contents">
      {contents}
    </div>
    <div className="sticky-ads">
      {stickyAds}
    </div>
  </section>
);

const BlockSection = ({ blocks }) => {
  const go = (remaining, current = [], acc = { contents: [], stickyAds: [] }) => {
    const [head, ...tail] = remaining;
    if (head) {
      switch (head.getText().trim()) {
        case '{{STICKY_AD}}':
          return go(tail, [], {
            contents: mergeBlocks(acc.contents, current),
            stickyAds: [
              ...acc.stickyAds,
              <StickyAd key={`${acc.stickyAds.length}`} />
            ]
          });
        case '{{AD}}':
          return go(tail, [], {
            contents: [
              ...mergeBlocks(acc.contents, current),
              <Ad key={`ad-${acc.contents.length}`}/>,
            ],
            stickyAds: acc.stickyAds,
          });
        default:
          return go(tail, [...current, head], acc);
      }
    } else {
      return {
        contents: mergeBlocks(acc.contents, current),
        stickyAds: acc.stickyAds,
      };
    }
  };
  const { contents, stickyAds } = go(blocks);
  return <Section contents={contents} stickyAds={stickyAds}/>
};

export default class ContentView extends React.Component {

  render = () => {
    const { html } = this.props;
    const state = htmlToState(html);
    const blocks = state.getBlocksAsArray();
    const sections = groupBySection(blocks);

    return (
      <div>
        {sections.map((blocks, index) => (
          <React.Fragment key={index}>
            <BlockSection blocks={blocks} />
            {index % 2 === 1 && (
              <Section
                contents={<Ad/>}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }

}
