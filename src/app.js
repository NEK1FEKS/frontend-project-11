import * as yup from 'yup';
import onChange from 'on-change';

const renderError = (fields, error) => {
  fields.rssInput.classList.add('is-invalid');
  if (!fields.rssInputFeedback.classList.contains('text-danger')) {
    fields.rssInputFeedback.classList.remove('text-success');
    fields.rssInputFeedback.classList.add('text-danger');
  }
  fields.rssInputFeedback.textContent = error;
};

const renderSuccess = (fields) => {
  const hadError = fields.rssInput.classList.contains('is-invalid');
  if (hadError) {
    fields.rssInput.classList.remove('is-invalid');
  }
  if (!fields.rssInputFeedback.classList.contains('text-success')) {
    fields.rssInputFeedback.classList.remove('text-danger');
    fields.rssInputFeedback.classList.add('text-success');
  }
  fields.rssInputFeedback.textContent = 'RSS load success';
};

// view
const render = (elements, initialState) => (path, value, prevValue) => {
  console.log(initialState, prevValue);
  switch (path) {
    case 'form.validLinks':
      renderSuccess(elements.fields);
      break;
    case 'form.error':
      renderError(elements.fields, value);
      break;
    default:
      break;
  }
};

export default () => {
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
      state: 'valid',
      processState: 'filling',
      validLinks: [],
      error: '',
    },
  };

  const state = onChange(initialState, render(elements, initialState));
  // controllers
  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const inputData = formData.get('url');
    console.log(inputData);
    const schema = yup.string().url().notOneOf(initialState.form.validLinks);
    schema.validate(inputData)
      .then((link) => {
        state.form.validLinks.push(link);
        state.form.state = true;
        state.form.processState = 'sending';
        elements.fields.rssInput.value = '';
        elements.fields.rssInput.focus();
      })
      .catch((e) => {
        state.form.error = e.message;
        state.form.valid = false;
        state.form.processState = 'error';
      });
  });
};
