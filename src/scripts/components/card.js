const LIKE_ACTIVE_CLASS = "card__like-button_is-active";

export const isCardLiked = (likeButton) => {
  return likeButton.classList.contains(LIKE_ACTIVE_CLASS);
};

/* Обновляет состояние сердечка и счётчик лайков по данным с сервера */
export const updateCardLikes = (
  likeButton,
  likeCountElement,
  likes,
  userId,
) => {
  const isLiked = likes.some((user) => user._id === userId);
  likeButton.classList.toggle(LIKE_ACTIVE_CLASS, isLiked);
  likeButton.setAttribute("aria-pressed", String(isLiked));
  likeCountElement.textContent = likes.length;
};

export const deleteCard = (cardElement) => {
  cardElement.remove();
};

const getTemplate = () => {
  return document
    .getElementById("card-template")
    .content.querySelector(".card")
    .cloneNode(true);
};

export const createCardElement = (
  data,
  userId,
  { onPreviewPicture, onLikeIcon, onDeleteCard, onInfoClick },
) => {
  const cardElement = getTemplate();
  const likeButton = cardElement.querySelector(".card__like-button");
  const likeCountElement = cardElement.querySelector(".card__like-count");
  const deleteButton = cardElement.querySelector(
    ".card__control-button_type_delete",
  );
  const infoButton = cardElement.querySelector(
    ".card__control-button_type_info",
  );
  const cardImage = cardElement.querySelector(".card__image");

  cardImage.src = data.link;
  cardImage.alt = data.name;
  cardElement.querySelector(".card__title").textContent = data.name;

  updateCardLikes(likeButton, likeCountElement, data.likes, userId);

  if (onLikeIcon) {
    likeButton.addEventListener("click", () =>
      onLikeIcon(data._id, likeButton, likeCountElement),
    );
  }

  // Иконка удаления показывается только у карточек текущего пользователя
  if (data.owner._id !== userId) {
    deleteButton.remove();
  } else if (onDeleteCard) {
    deleteButton.addEventListener("click", () =>
      onDeleteCard(data._id, cardElement),
    );
  }

  if (onInfoClick) {
    infoButton.addEventListener("click", () => onInfoClick(data._id));
  }

  if (onPreviewPicture) {
    cardImage.addEventListener("click", () =>
      onPreviewPicture({ name: data.name, link: data.link }),
    );
  }

  return cardElement;
};
