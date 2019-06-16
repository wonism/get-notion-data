/**
 * Inspired by ZEIT's repository.
 * https://github.com/zeit/spr-landing.git
 */
const fetch = require('node-fetch');

const DEFAULT_PAGE_ID = 'db45cd2e-7c69-4c34-93c9-7f2376ab184a';

const getJSONHeaders = res => JSON.stringify(res.headers.raw());

const getBodyOrNull = async (res) => {
  try {
    return await res.text();
  } catch (err) {
    return null;
  }
}

const getError = async (res) => {
  const errorHeader = getJSONHeaders(res);
  const errorBody = await getBodyOrNull(res);

  return `Notion API error (${res.status})\n${errorHeader}\n${errorBody}`;
};

const rpc = async (fnName, body = {}) => {
  const response = await fetch(`https://www.notion.so/api/v3/${fnName}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (response.ok) {
    const result = await response.json();

    return result;
  } else {
    throw new Error(await getError(response));
  }
}

const queryCollection = ({ collectionId, collectionViewId, loader = {}, query = {} }) => {
  const userLocale = process.env.LANG ? process.env.LANG.slice(0, 2) : 'ko';
  const userTimeZone = process.env.TZ || 'Asia/Seoul';

  const {
    limit = 70,
    loadContentCover = true,
    type = 'table',
    userLocale,
    userTimeZone,
  } = loader;

  const {
    aggregate = [{
      aggregation_type: 'count',
      id: 'count',
      property: 'title',
      type: 'title',
      view_type: 'table'
    }],
    filter = [],
    filter_operator = 'and',
    sort = [],
  } = query;

  return rpc('queryCollection', {
    collectionId,
    collectionViewId,
    loader: {
      limit,
      loadContentCover,
      type,
      userLocale,
      userTimeZone,
    },
    query: {
      aggregate,
      filter,
      filter_operator,
      sort,
    },
  });
}

const loadPageChunk = ({ pageId, limit = 100, cursor = { stack: [] }, chunkNumber = 0, verticalColumns = false }) => (
  rpc('loadPageChunk', {
    pageId,
    limit,
    cursor,
    chunkNumber,
    verticalColumns,
  })
);

const getNotionData = async (pageId = DEFAULT_PAGE_ID) => {
  const { recordMap: { block: b = {} } } = await loadPageChunk({ pageId });
  const blocks = Object.values(b);

  const notionData = { sections: [], meta: {} };

  for (const block of blocks) {
    const { value } = block;
    const { type } = value;

    if (type === 'page' || type === 'header' || type === 'sub_header') {
      const { properties: { title } } = value;
      const section = {
        title,
        children: [],
      };

      notionData.sections.push(section);
    }

    const section = notionData.sections[notionData.sections.length -1];

    switch (type) {
      case 'image': {
        const { format: { display_source: displaySource } } = value;

        const child = {
          type,
          src: `/image.js?url=${encodeURIComponent(displaySource)}`,
        };

        section.children.push(child);
        break;
      }
      case 'text': {
        if (value.properties == null) {
          break;
        }

        const child = {
          type,
          value: value.properties.title,
        };

        section.children.push(child);
        break;
      }
      case 'bulleted_list': {
        const child = {
          type,
          children: value.properties.title,
        };

        section.children.push(child);
        break;
      }
      case 'collection_view': {
        const { collection_id: collectionId, view_ids: viewIds } = value;
        const collectionViewId = viewIds[0];

        const collection = await queryCollection({
          collectionId,
          collectionViewId,
        });

        const entries = Object
          .values(collection.recordMap.block)
          .filter(block => block.value && block.value.parent_id === collectionId);

        const table = entries.reduce((oldTable, { value: { properties } }) => {
          const propertyName = properties.title[0][0].toLowerCase().trim().replace(/[ -_]+/g, '_');

          return {
            ...oldTable,
            [propertyName]: properties['Agd&'],
          };
        }, {});

        if (notionData.sections.length === 1) {
          notionData.meta = table;
          break;
        }

        const child = {
          type,
          value: table,
        };

        section.children.push(child);
        break;
      }
      default:
        break;
    }
  }

  return notionData;
};

module.exports = getNotionData;
