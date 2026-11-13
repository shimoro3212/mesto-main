const config = {
  baseUrl: `https://mesto.nomoreparties.co/v1/${encodeURIComponent(import.meta.env.VITE_MESTO_COHORT || "")}`,
  headers: {
    authorization: import.meta.env.VITE_MESTO_TOKEN || "",
    "Content-Type": "application/json",
  },
};

/* Проверяем, успешно ли выполнен запрос, и отклоняем промис в случае ошибки. */
const getResponseData = (res) => {
  return res.ok
    ? res.json()
    : Promise.reject(new Error(`Ошибка сервера: ${res.status}`));
};

export const getUserInfo = () => {
  return fetch(`${config.baseUrl}/users/me`, {
    headers: config.headers,
    signal: AbortSignal.timeout(20000),
  }).then(getResponseData);
};

export const getCardList = () => {
  return fetch(`${config.baseUrl}/cards`, {
    headers: config.headers,
    signal: AbortSignal.timeout(20000),
  }).then(getResponseData);
};

export const setUserInfo = ({ name, about }) => {
  return fetch(`${config.baseUrl}/users/me`, {
    method: "PATCH",
    headers: config.headers,
    signal: AbortSignal.timeout(20000),
    body: JSON.stringify({
      name,
      about,
    }),
  }).then(getResponseData);
};

export const setUserAvatar = (avatar) => {
  return fetch(`${config.baseUrl}/users/me/avatar`, {
    method: "PATCH",
    headers: config.headers,
    signal: AbortSignal.timeout(20000),
    body: JSON.stringify({
      avatar,
    }),
  }).then(getResponseData);
};

export const addCard = ({ name, link }) => {
  return fetch(`${config.baseUrl}/cards`, {
    method: "POST",
    headers: config.headers,
    signal: AbortSignal.timeout(20000),
    body: JSON.stringify({
      name,
      link,
    }),
  }).then(getResponseData);
};

export const deleteCardFromServer = (cardID) => {
  return fetch(`${config.baseUrl}/cards/${encodeURIComponent(cardID)}`, {
    method: "DELETE",
    headers: config.headers,
    signal: AbortSignal.timeout(20000),
  }).then(getResponseData);
};

export const changeLikeCardStatus = (cardID, isLiked) => {
  return fetch(`${config.baseUrl}/cards/likes/${encodeURIComponent(cardID)}`, {
    method: isLiked ? "DELETE" : "PUT",
    headers: config.headers,
    signal: AbortSignal.timeout(20000),
  }).then(getResponseData);
};
