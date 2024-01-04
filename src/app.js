import * as yup from 'yup';
import onChange from 'on-change';
import i18next from 'i18next';
import axios from 'axios';
import resources from './localization/index.js';
import parser from './parser.js';
import render from './render.js';

const routes = (url) => `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`;

const rssValidateSchema = (listsCollection) => {
  yup.setLocale({
    string: {
      url: { key: 'url' },
    },
    mixed: {
      notOneOf: { key: 'notOneOf' },
    },
  });

  return yup.string().url().notOneOf(listsCollection);
};

export default () => {
  const defaultLanguage = 'ru';
  const i18Instance = i18next.createInstance();
  i18Instance.init({
    lng: defaultLanguage,
    debug: true,
    resources,
  }).then();

  const state = {
    form: {
      valid: true,
      processState: 'filling',
      error: null,
    },
    validLinks: [],
    data: {
      feedItemsList: [],
      postItemsList: [],
    },
    uiState: {
      readLink: '',
      readPost: null,
      postsReadId: [],
    },
  };
  const elements = {
    form: document.querySelector('.rss-form'),
    fields: {
      rssInput: document.getElementById('url-input'),
      rssInputFeedback: document.querySelector('.feedback'),
    },
    submitButton: document.querySelector('button[type="submit"]'),
    posts: document.querySelector('.posts'),
    feeds: document.querySelector('.feeds'),
    modal: {
      window: document.getElementById('modal'),
      linkButton: document.getElementById('modal').querySelector('.btn'),
      title: document.querySelector('.modal-title'),
      description: document.querySelector('.modal-body'),
    },
  };

  const updateData = (links) => {
    const uploadedPosts = links.map((link) => axios.get(routes(link))
      .then((response) => {
        const channelData = parser(response.data.contents);
        if (!channelData) {
          throw new Error('parseError');
        }
        return channelData.items;
      })
      .catch(() => ([])));

    const promise = Promise.all(uploadedPosts);
    promise.then((arrOfPosts) => {
      const posts = arrOfPosts.flatMap((posts) => posts);
      return posts;
    })
      .then((posts) => {
        const oldPostsTitles = state.data.postItemsList.map(({ title }) => title);
        const newPosts = posts.filter((post) => !oldPostsTitles.includes(post.title));
        if (newPosts.length !== 0) {
          state.data.postItemsList.unshift(...newPosts);
          state.data.postItemsList.forEach((item, id) => item.id = state.data.postItemsList.length
            - (id + 1));
          watchedState.form.processState = 'update';
        }
      })
      .then(() => {
        setTimeout(() => {
          state.form.processState = 'filling';
          return updateData(links);
        }, 5000);
      });
  };

  const watchedState = onChange(state, render(elements, state, i18Instance));
  // controllers
  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const inputData = formData.get('url');
    rssValidateSchema(state.validLinks).validate(inputData)
      .then((link) => {
        state.validLinks.push(link);
        state.form.valid = true;
        return link;
      })
      .then((validLink) => {
        if (state.form.valid) {
          watchedState.form.processState = 'sending';
          return axios.get(routes(validLink));
        }
      })
      .then((response) => {
        if (response.status !== 200) {
          throw new Error(`networkError: ${response.status}`);
        }
        const channelData = parser(response.data.contents);
        if (!channelData) {
          throw new Error('parseError');
        }
        const { title, description, items } = channelData;
        state.data.feedItemsList.unshift({ title, description });
        state.data.postItemsList.unshift(...items);
        state.data.postItemsList.forEach((item, id) => item.id = state.data.postItemsList.length 
          - (id + 1));
        watchedState.form.processState = 'sent';
      })
      .catch((err) => {
        console.log(err.errors);
        switch (err.name) {
          case 'ValidationError':
            state.form.error = i18Instance.t(err.errors[0].key);
            break;
          case 'Error':
            state.form.error = 'Ресурс не содержит валидный RSS';
            break;
          default: state.form.error = 'Ошибка сети';
        }
        state.form.valid = false;
        watchedState.form.processState = 'error';
      });
  });
  updateData(state.validLinks);

  elements.modal.window.addEventListener('shown.bs.modal', (e) => {
    const modalButton = e.relatedTarget;
    const readPostId = modalButton.getAttribute('data-id');
    const readPost = state.data.postItemsList.filter((post) => String(post.id) === readPostId);
    const readLink = modalButton.previousSibling;
    if (!state.uiState.postsReadId.includes(readPostId)) {
      state.uiState.readLink = readLink.getAttribute('href');
      state.uiState.readPost = readPost[0];
      state.uiState.postsReadId.push(readPostId);
      watchedState.uiState.modalWindow = 'windowOpen';
    }
  });
  elements.modal.window.addEventListener('hidden.bs.modal', () => state.uiState.modalWindow = 'windowClose');
};
