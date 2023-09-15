import * as yup from 'yup';
import onChange from 'on-change';
import i18next from 'i18next';
import resources from './localization/index.js';

const renderError = (fields, error) => {
  fields.rssInput.classList.add('is-invalid');
  if (!fields.rssInputFeedback.classList.contains('text-danger')) {
    fields.rssInputFeedback.classList.remove('text-success');
    fields.rssInputFeedback.classList.add('text-danger');
  }
  fields.rssInputFeedback.textContent = error;
};

const renderSuccess = (fields, i18Instance) => {
  const hadError = fields.rssInput.classList.contains('is-invalid');
  if (hadError) {
    fields.rssInput.classList.remove('is-invalid');
  }
  if (!fields.rssInputFeedback.classList.contains('text-success')) {
    fields.rssInputFeedback.classList.remove('text-danger');
    fields.rssInputFeedback.classList.add('text-success');
  }
  fields.rssInputFeedback.textContent = i18Instance.t('success');
  fields.rssInput.value = '';
  fields.rssInput.focus();
};

// view
const render = (elements, initialState, i18Instance) => (path, value, prevValue) => {
  console.log(value);
  switch (value) {
    case 'success':
      renderSuccess(elements.fields, i18Instance);
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
  };
  // model
  const initialState = {
    form: {
      valid: true,
      processState: 'filling',
      validLinks: [],
      error: '',
    },
  };

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

    const schema = yup.string().url().notOneOf(initialState.form.validLinks);
    schema.validate(inputData)
      .then((link) => {
        state.form.validLinks.push(link);
        state.form.valid = true;
        state.form.processState = 'sending';
        // elements.fields.rssInput.value = '';
        // elements.fields.rssInput.focus();
      })
      .catch((e) => {
        state.form.error = e.errors.map((err) => i18Instance.t(err.key)).join('');
        state.form.valid = false;
        state.form.processState = 'error';
        console.log(state.form.error);
      });
  });
};
