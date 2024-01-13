export default (xmlString) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');
  const errorNode = doc.querySelector('parsererror');
  if (errorNode) {
    throw new Error('parseError');
  }
  const rssData = doc.documentElement;
  const channel = rssData.children[0];
  const childNodesArray = Array.from(channel.childNodes)
    .filter((el) => el.nodeType !== 3);

  const channelTitleAndDescription = childNodesArray
    .reduce((acc, node) => {
      if (node.nodeName === 'title' || node.nodeName === 'description') {
        acc[node.nodeName] = node.textContent;
        return acc;
      }
      return acc;
    }, {});

  const items = childNodesArray.filter((node) => node.nodeName === 'item')
    .map((node) => Array.from(node.childNodes)
      .filter(((el) => el.nodeType !== 3))
      .reduce((acc, item) => {
        acc[item.nodeName] = item.textContent;
        return acc;
      }, {}));

  const { title, description } = channelTitleAndDescription;

  return { title, description, items };
};
