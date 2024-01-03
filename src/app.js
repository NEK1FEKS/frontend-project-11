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
      error: '',
    },
    validLinks: [],
    data: {
      feedItemsList: [],
      postItemsList: [],
    },
    uiState: {
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
  };

  const updateData = () => {
    console.log('update');
    setTimeout(() => updateData(), 5000);
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
          throw new Error(`${response.status}`);
        }
        const channelData = parser(response.data.contents);
        if (!channelData) {
          throw new Error('parseError');
        }
        console.log(channelData);
        const { title, description, items } = channelData;
        state.data.feedItemsList.unshift({ title, description });
        state.data.postItemsList.unshift(...items);
        watchedState.form.processState = 'sent';
      })
      .then(() => {
        updateData();
      })
      .catch((err) => {
        console.log(err);
        state.form.error = err.errors.map((err) => i18Instance.t(err.key)).join('');
        console.log(state.form.error);
        state.form.valid = false;
        watchedState.form.processState = 'error';
      });
  });
};
