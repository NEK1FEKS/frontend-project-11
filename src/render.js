const itemFeedGenerator = (feeds) => {
  const feedsCollection = feeds.map(({ title, description }) => {
    const feedItem = document.createElement('li');
    feedItem.classList.add('list-group-item', 'border-0', 'border-end-0');
    const feedTitle = document.createElement('h3');
    feedTitle.classList.add('h6', 'm-0');
    feedTitle.textContent = `${title}`;
    const feedDescription = document.createElement('p');
    feedDescription.classList.add('m-0', 'small', 'text-black-50');
    feedDescription.textContent = `${description}`;
    feedItem.appendChild(feedTitle);
    feedItem.appendChild(feedDescription);
    return feedItem;
  });
  return feedsCollection;
};

const itemPostGenerator = (items) => {
  const postItems = items.map(({ title, link, id }) => {
    const postItem = document.createElement('li');
    postItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');

    const postLink = document.createElement('a');
    postLink.classList.add('fw-bold');
    postLink.setAttribute('href', `${link}`);
    postLink.setAttribute('data-id', `${id}`);
    postLink.setAttribute('target', '_blank');
    postLink.setAttribute('rel', 'noopener noreferrer');
    postLink.textContent = `${title}`;
    const button = document.createElement('button');
    button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    button.setAttribute('type', 'button');
    button.setAttribute('data-id', `${id}`);
    button.setAttribute('data-bs-toggle', 'modal');
    button.setAttribute('data-bs-target', '#modal');
    button.textContent = 'Просмотр';
    postItem.appendChild(postLink);
    postItem.appendChild(button);

    return postItem;
  });
  return postItems;
};
const containerGenerator = (title) => {
  const cardBorder = document.createElement('div');
  cardBorder.classList.add('card', 'border-0');
  const cardBody = document.createElement('div');
  cardBody.classList.add('card-body');
  const cardTitle = document.createElement('h2');
  cardTitle.classList.add('card-title', 'h4');
  cardTitle.textContent = `${title}`;
  cardBody.appendChild(cardTitle);
  const listGroup = document.createElement('ul');
  listGroup.classList.add('list-group', 'border-0', 'rounded-0');
  cardBorder.appendChild(cardBody);
  cardBorder.appendChild(listGroup);
  return cardBorder;
};
const renderError = (fields, error) => {
  fields.rssInput.classList.add('is-invalid');
  if (!fields.rssInputFeedback.classList.contains('text-danger')) {
    fields.rssInputFeedback.classList.remove('text-success');
    fields.rssInputFeedback.classList.add('text-danger');
  }
  fields.rssInputFeedback.textContent = error;
};

const renderReadPosts = (elements, state) => {
  const links = elements.posts.querySelectorAll('a');
  const readLinks = Array.from(links)
    .filter((link) => state.uiState.postsReadId.includes(link.getAttribute('data-id')));
  readLinks.forEach((readLink) => {
    readLink.classList.remove('fw-bold');
    readLink.classList.add('fw-normal');
  });
};

const renderSuccess = (elements, i18Instance) => {
  const hadError = elements.fields.rssInput.classList.contains('is-invalid');
  if (hadError) {
    elements.fields.rssInput.classList.remove('is-invalid');
  }
  if (!elements.fields.rssInputFeedback.classList.contains('text-success')) {
    elements.fields.rssInputFeedback.classList.remove('text-danger');
    elements.fields.rssInputFeedback.classList.add('text-success');
  }
  elements.fields.rssInputFeedback.textContent = i18Instance.t('success');
  elements.fields.rssInput.value = '';
  elements.fields.rssInput.focus();
};

const renderSending = (i18Instance) => {
  const rssInputFeedback = document.querySelector('.feedback');
  rssInputFeedback.textContent = i18Instance.t('loading');
};

const renderFeeds = (elements, state) => {
  const feedsContainer = containerGenerator('Фиды');
  const feeds = itemFeedGenerator(state.data.feedItemsList);
  feedsContainer.querySelector('.list-group').replaceChildren(...feeds);
  elements.feeds.replaceChildren(feedsContainer);
};

const renderPosts = (elements, state) => {
  const postsContainer = containerGenerator('Посты');
  const posts = itemPostGenerator(state.data.postItemsList);
  postsContainer.querySelector('.list-group').replaceChildren(...posts);
  elements.posts.replaceChildren(postsContainer);
  const links = elements.posts.querySelectorAll('a');
  const readLinks = Array.from(links)
    .filter((link) => state.uiState.postsReadId.includes(link.getAttribute('data-id')));
  readLinks.forEach((readLink) => {
    readLink.classList.remove('fw-bold');
    readLink.classList.add('fw-normal');
  });
};

const renderModalWindowContent = (elements, state) => {
  console.log(elements.modal.linkButton);
  const { readPost } = state.uiState;
  const { title, description } = readPost;
  elements.modal.title.textContent = title;
  elements.modal.description.textContent = description;
  elements.modal.linkButton.setAttribute('href', state.uiState.readLink);
  renderReadPosts(elements, state);
};

export default (elements, state, i18Instance) => (path, value) => {
  console.log(value);
  switch (value) {
    case 'sending':
      renderSending(i18Instance);
      break;
    case 'sent':
      renderSuccess(elements, i18Instance);
      renderFeeds(elements, state);
      renderPosts(elements, state);
      break;
    case 'update':
      renderPosts(elements, state);
      break;
    case 'windowOpen':
      renderModalWindowContent(elements, state, value);
      break;
    case 'error':
      renderError(elements.fields, state.form.error);
      break;
    default:
      throw Error('error');
  }
};
