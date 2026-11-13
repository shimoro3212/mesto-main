/*
  Файл index.js является точкой входа в наше приложение
  и только он должен содержать логику инициализации нашего приложения
  используя при этом импорты из других файлов

  Из index.js не допускается что то экспортировать
*/

import {
  createCardElement,
  deleteCard,
  isCardLiked,
  updateCardLikes,
} from "./components/card.js";
import {
  openModalWindow,
  closeModalWindow,
  setCloseModalWindowEventListeners,
} from "./components/modal.js";
import {
  getUserInfo,
  getCardList,
  setUserInfo,
  setUserAvatar,
  addCard,
  deleteCardFromServer,
  changeLikeCardStatus,
} from "./components/api.js";
import { enableValidation, clearValidation } from "./components/validation.js";

const validationSettings = {
  formSelector: ".popup__form",
  inputSelector: ".popup__input",
  submitButtonSelector: ".popup__button",
  inactiveButtonClass: "popup__button_disabled",
  inputErrorClass: "popup__input_type_error",
  errorClass: "popup__error_visible",
};

// DOM узлы
const placesWrap = document.querySelector(".places__list");
const profileFormModalWindow = document.querySelector(".popup_type_edit");
const profileForm = profileFormModalWindow.querySelector(".popup__form");
const profileTitleInput = profileForm.querySelector(".popup__input_type_name");
const profileDescriptionInput = profileForm.querySelector(
  ".popup__input_type_description",
);
const profileSubmitButton = profileForm.querySelector(".popup__button");

const cardFormModalWindow = document.querySelector(".popup_type_new-card");
const cardForm = cardFormModalWindow.querySelector(".popup__form");
const cardNameInput = cardForm.querySelector(".popup__input_type_card-name");
const cardLinkInput = cardForm.querySelector(".popup__input_type_url");
const cardSubmitButton = cardForm.querySelector(".popup__button");

const imageModalWindow = document.querySelector(".popup_type_image");
const imageElement = imageModalWindow.querySelector(".popup__image");
const imageCaption = imageModalWindow.querySelector(".popup__caption");

const openProfileFormButton = document.querySelector(".profile__edit-button");
const openCardFormButton = document.querySelector(".profile__add-button");

const profileTitle = document.querySelector(".profile__title");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__image");

const avatarFormModalWindow = document.querySelector(".popup_type_edit-avatar");
const avatarForm = avatarFormModalWindow.querySelector(".popup__form");
const avatarInput = avatarForm.querySelector(".popup__input");
const avatarSubmitButton = avatarForm.querySelector(".popup__button");

const removeCardModalWindow = document.querySelector(".popup_type_remove-card");
const removeCardForm = removeCardModalWindow.querySelector(".popup__form");
const removeCardSubmitButton = removeCardForm.querySelector(".popup__button");

const cardInfoModalWindow = document.querySelector(".popup_type_info");
const cardInfoModalTitle = cardInfoModalWindow.querySelector(".popup__title");
const cardInfoModalInfoList = cardInfoModalWindow.querySelector(".popup__info");
const cardInfoModalText = cardInfoModalWindow.querySelector(".popup__text");
const cardInfoModalUsersList =
  cardInfoModalWindow.querySelector(".popup__list");

const infoDefinitionTemplate = document
  .getElementById("popup-info-definition-template")
  .content.querySelector(".popup__info-item");
const infoUserPreviewTemplate = document
  .getElementById("popup-info-user-preview-template")
  .content.querySelector(".popup__list-item");

// Данные текущего пользователя и карточки, ожидающей удаления
let currentUserId = null;
let cardToDelete = null;
let infoRequestId = 0;
const pendingForms = new WeakSet();
const statusElement = document.querySelector(".content__status");
const profileControls = [
  openProfileFormButton,
  openCardFormButton,
  profileAvatar,
];
profileControls.forEach((control) => {
  control.disabled = true;
});

const showRequestError = (error) => {
  console.error(error);
  statusElement.textContent =
    "Не удалось выполнить запрос. Проверьте подключение и попробуйте ещё раз.";
};

const startFormRequest = (form, button) => {
  if (pendingForms.has(form) || !form.checkValidity()) return false;
  pendingForms.add(form);
  button.disabled = true;
  statusElement.textContent = "";
  form.querySelectorAll("input").forEach((input) => {
    input.readOnly = true;
  });
  return true;
};

const finishFormRequest = (form, button) => {
  pendingForms.delete(form);
  form.querySelectorAll("input").forEach((input) => {
    input.readOnly = false;
  });
  button.disabled = !form.checkValidity();
};

// Меняет текст кнопки на время отправки данных на сервер
const renderLoading = (button, isLoading, defaultText, loadingText) => {
  button.textContent = isLoading ? loadingText : defaultText;
};

const renderUserInfo = ({ name, about, avatar }) => {
  profileTitle.textContent = name;
  profileDescription.textContent = about;
  profileAvatar.style.backgroundImage = `url(${avatar})`;
};

const formatDate = (date) =>
  date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const createInfoString = (term, description) => {
  const infoItem = infoDefinitionTemplate.cloneNode(true);
  infoItem.querySelector(".popup__info-term").textContent = term;
  infoItem.querySelector(".popup__info-description").textContent = description;
  return infoItem;
};

const createUserPreview = (user) => {
  const userPreview = infoUserPreviewTemplate.cloneNode(true);
  userPreview.textContent = user.name;
  return userPreview;
};

const handlePreviewPicture = ({ name, link }) => {
  imageElement.src = link;
  imageElement.alt = name;
  imageCaption.textContent = name;
  openModalWindow(imageModalWindow);
};

const handleLikeCard = (cardId, likeButton, likeCountElement) => {
  if (likeButton.disabled) return;
  likeButton.disabled = true;
  statusElement.textContent = "";
  changeLikeCardStatus(cardId, isCardLiked(likeButton))
    .then((cardData) => {
      updateCardLikes(
        likeButton,
        likeCountElement,
        cardData.likes,
        currentUserId,
      );
    })
    .catch((err) => {
      showRequestError(err);
    })
    .finally(() => {
      likeButton.disabled = false;
    });
};

const handleDeleteCard = (cardId, cardElement) => {
  if (pendingForms.has(removeCardForm)) return;
  cardToDelete = { cardId, cardElement };
  openModalWindow(removeCardModalWindow);
};

const handleInfoClick = (cardId) => {
  const requestId = ++infoRequestId;
  /* Для вывода корректной информации необходимо получить актуальные данные с сервера */
  getCardList()
    .then((cards) => {
      if (
        requestId !== infoRequestId ||
        document.querySelector(".popup_is-opened")
      )
        return;
      const cardData = cards.find((card) => card._id === cardId);
      if (!cardData) {
        return Promise.reject(new Error("Карточка не найдена"));
      }

      cardInfoModalTitle.textContent = "Информация о карточке";
      cardInfoModalInfoList.replaceChildren(
        createInfoString("Описание:", cardData.name),
        createInfoString(
          "Дата создания:",
          formatDate(new Date(cardData.createdAt)),
        ),
        createInfoString("Владелец:", cardData.owner.name),
        createInfoString("Количество лайков:", cardData.likes.length),
      );

      cardInfoModalText.textContent = cardData.likes.length
        ? "Лайкнули:"
        : "Пока никто не поставил лайк";
      cardInfoModalUsersList.replaceChildren(
        ...cardData.likes.map(createUserPreview),
      );

      openModalWindow(cardInfoModalWindow);
    })
    .catch((err) => {
      showRequestError(err);
    });
};

const cardHandlers = {
  onPreviewPicture: handlePreviewPicture,
  onLikeIcon: handleLikeCard,
  onDeleteCard: handleDeleteCard,
  onInfoClick: handleInfoClick,
};

const handleProfileFormSubmit = (evt) => {
  evt.preventDefault();
  if (!startFormRequest(profileForm, profileSubmitButton)) return;
  renderLoading(profileSubmitButton, true, "Сохранить", "Сохранение...");
  setUserInfo({
    name: profileTitleInput.value,
    about: profileDescriptionInput.value,
  })
    .then((userData) => {
      profileTitle.textContent = userData.name;
      profileDescription.textContent = userData.about;
      closeModalWindow(profileFormModalWindow);
    })
    .catch((err) => {
      showRequestError(err);
    })
    .finally(() => {
      renderLoading(profileSubmitButton, false, "Сохранить", "Сохранение...");
      finishFormRequest(profileForm, profileSubmitButton);
    });
};

const handleAvatarFormSubmit = (evt) => {
  evt.preventDefault();
  if (!startFormRequest(avatarForm, avatarSubmitButton)) return;
  renderLoading(avatarSubmitButton, true, "Сохранить", "Сохранение...");
  setUserAvatar(avatarInput.value)
    .then((userData) => {
      profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
      closeModalWindow(avatarFormModalWindow);
    })
    .catch((err) => {
      showRequestError(err);
    })
    .finally(() => {
      renderLoading(avatarSubmitButton, false, "Сохранить", "Сохранение...");
      finishFormRequest(avatarForm, avatarSubmitButton);
    });
};

const handleCardFormSubmit = (evt) => {
  evt.preventDefault();
  if (!startFormRequest(cardForm, cardSubmitButton)) return;
  renderLoading(cardSubmitButton, true, "Создать", "Создание...");
  addCard({
    name: cardNameInput.value,
    link: cardLinkInput.value,
  })
    .then((cardData) => {
      placesWrap.prepend(
        createCardElement(cardData, currentUserId, cardHandlers),
      );
      closeModalWindow(cardFormModalWindow);
    })
    .catch((err) => {
      showRequestError(err);
    })
    .finally(() => {
      renderLoading(cardSubmitButton, false, "Создать", "Создание...");
      finishFormRequest(cardForm, cardSubmitButton);
    });
};

const handleRemoveCardFormSubmit = (evt) => {
  evt.preventDefault();
  if (!startFormRequest(removeCardForm, removeCardSubmitButton)) return;
  if (!cardToDelete) {
    finishFormRequest(removeCardForm, removeCardSubmitButton);
    return;
  }
  const targetCard = cardToDelete;
  renderLoading(removeCardSubmitButton, true, "Да", "Удаление...");
  deleteCardFromServer(targetCard.cardId)
    .then(() => {
      deleteCard(targetCard.cardElement);
      cardToDelete = null;
      closeModalWindow(removeCardModalWindow);
    })
    .catch((err) => {
      showRequestError(err);
    })
    .finally(() => {
      renderLoading(removeCardSubmitButton, false, "Да", "Удаление...");
      finishFormRequest(removeCardForm, removeCardSubmitButton);
    });
};

// EventListeners
profileForm.addEventListener("submit", handleProfileFormSubmit);
cardForm.addEventListener("submit", handleCardFormSubmit);
avatarForm.addEventListener("submit", handleAvatarFormSubmit);
removeCardForm.addEventListener("submit", handleRemoveCardFormSubmit);

openProfileFormButton.addEventListener("click", () => {
  if (pendingForms.has(profileForm)) return;
  infoRequestId += 1;
  profileTitleInput.value = profileTitle.textContent;
  profileDescriptionInput.value = profileDescription.textContent;
  clearValidation(profileForm, validationSettings);
  openModalWindow(profileFormModalWindow);
});

profileAvatar.addEventListener("click", () => {
  if (pendingForms.has(avatarForm)) return;
  infoRequestId += 1;
  avatarForm.reset();
  clearValidation(avatarForm, validationSettings);
  openModalWindow(avatarFormModalWindow);
});

openCardFormButton.addEventListener("click", () => {
  if (pendingForms.has(cardForm)) return;
  infoRequestId += 1;
  cardForm.reset();
  clearValidation(cardForm, validationSettings);
  openModalWindow(cardFormModalWindow);
});

enableValidation(validationSettings);

//настраиваем обработчики закрытия попапов
const allPopups = document.querySelectorAll(".popup");
allPopups.forEach((popup) => {
  setCloseModalWindowEventListeners(popup);
});

// Загружаем данные пользователя и карточки с сервера
statusElement.textContent = "Загрузка…";
Promise.all([getCardList(), getUserInfo()])
  .then(([cards, userData]) => {
    currentUserId = userData._id;
    profileControls.forEach((control) => {
      control.disabled = false;
    });
    statusElement.textContent = "";
    renderUserInfo(userData);
    cards.forEach((cardData) => {
      placesWrap.append(
        createCardElement(cardData, currentUserId, cardHandlers),
      );
    });
  })
  .catch((err) => {
    showRequestError(err);
  });
