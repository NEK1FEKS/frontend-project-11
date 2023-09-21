import * as yup from 'yup';
import onChange from 'on-change';
import i18next from 'i18next';
import axios from 'axios';
import resources from './localization/index.js';
import parser from './parser.js';

const makerCard = (title) => {
  const card = document.createElement('div');
  card.classList.add('card', 'border-0');
  const cardBody = document.createElement('div');
  cardBody.classList.add('card-body');
  const cardTitle = document.createElement('h2');
  cardTitle.classList.add('card-title', 'h4');
  cardTitle.textContent = `${title}`;
  cardBody.appendChild(cardTitle);
  const listGroup = document.createElement('ul');
  listGroup.classList.add('list-group', 'border-0', 'rounded-0');
  card.appendChild(cardBody);
  card.appendChild(listGroup);
  return card;
};

const feedMaker = (data) => {
  const feedsGallery = data.map(({ title, description }) => {
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
  return feedsGallery.reverse();
};

const postMaker = (data) => {
  const postsCollection = data.map(({ items }) => {
    const postItems = items.map(({ title, description, link }, id) => {
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
      button.textContent = 'Search';
      postItem.appendChild(postLink);
      postItem.appendChild(button);
      return postItem;
    });
    return postItems;
  });

  return postsCollection.flat().reverse();
};

const renderError = (fields, error) => {
  fields.rssInput.classList.add('is-invalid');
  if (!fields.rssInputFeedback.classList.contains('text-danger')) {
    fields.rssInputFeedback.classList.remove('text-success');
    fields.rssInputFeedback.classList.add('text-danger');
  }
  fields.rssInputFeedback.textContent = error;
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
  const feedsContainer = makerCard('Feeds');
  const newFeeds = feedMaker(elements.data);
  newFeeds.forEach((item) => feedsContainer.querySelector('.list-group').append(item));
  const postsContainer = makerCard('Posts');
  const newPosts = postMaker(elements.data);
  newPosts.forEach((item) => postsContainer.querySelector('.list-group').append(item));
  elements.feeds.replaceChildren(feedsContainer);
  elements.posts.replaceChildren(postsContainer);
};

// view
const render = (elements, initialState, i18Instance) => (path, value) => {
  console.log(value);
  switch (value) {
    case 'sent':
      renderSuccess(elements, i18Instance);
      break;
    case 'error':
      renderError(elements.fields, initialState.form.error);
      break;
    default:
      break;
  }
};

export default () => {
  const defaultLanguage = 'ru';
  const i18Instance = i18next.createInstance();
  i18Instance.init({
    lng: defaultLanguage,
    debug: true,
    resources,
  }).then();

  const elements = {
    form: document.querySelector('.rss-form'),
    fields: {
      rssInput: document.getElementById('url-input'),
      rssInputFeedback: document.querySelector('.feedback'),
    },
    submitButton: document.querySelector('button[type="submit"]'),
    posts: document.querySelector('.posts'),
    feeds: document.querySelector('.feeds'),
    data: [],
  };
  // model
  const initialState = {
    form: {
      valid: true,
      processState: 'filling',
      error: '',
    },
    validLinks: [],
  };
  const routes = (url) => `https://allorigins.hexlet.app/get?disableCache=true&url=${url}`; // url with proxy

  const state = onChange(initialState, render(elements, initialState, i18Instance));
  // controllers
  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const inputData = formData.get('url');
    console.log(inputData);
    yup.setLocale({
      string: {
        url: () => ({ key: 'url' }),
      },
      mixed: {
        notOneOf: () => ({ key: 'notOneOf' }),
      },
    });
    const schema = yup.string().url().notOneOf(initialState.validLinks);
    schema.validate(inputData)
      .then((link) => {
        state.validLinks.push(link);
        state.form.valid = true;
      })
      .catch((err) => {
        state.form.error = err.errors.map((err) => i18Instance.t(err.key)).join('');
        state.form.valid = false;
        state.form.processState = 'error';
      })
      .then(() => {
        if (initialState.form.valid) {
          axios.get(routes(state.validLinks[state.validLinks.length - 1]))
            .then((response) => {
              state.form.processState = 'sending';
              if (!parser(response.data.contents)) {
                state.form.error = i18Instance.t('parseError');
                state.form.processState = 'error';
              } else {
                elements.data.push(parser(response.data.contents));
                state.form.processState = 'sent';
              }
            })
            .catch((networkError) => {
              state.form.processState = 'error';
              state.form.error = `network error: ${networkError}`;
            });
        }
      })
      .then(() => state.form.processState = 'filling');
  });
};
