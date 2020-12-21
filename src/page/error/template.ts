/* eslint-disable max-len */
import {Component} from '../../../lib/component';
import {css} from '../../../lib/css';

export const emptyComponentStyle = css`
$min-size: 44px;
.none {
  display: none !important;
}
.wrapper {
  display: flex;
  flex-flow: column;
  align-items: center;
}
.img {
  margin: 32px auto;
  aspect-ratio: attr(width) / attr(height);
  width: 520px;
  height: auto;
  @media only screen and (max-width: 600px) {
    width: auto !important;
  }
}
.title {
  margin: 8px 0;
  font: {
    size: 24px;
    weight: 400;
  }
}
.subtitle {
  margin: 0;
  padding: 0 16px;
  font: {
    size: 18px;
    weight: 400;
  }
}
@media only screen and (min-width: 992px) {
  .title {
    font: {
      size: 28px;
      weight: 500;
    }
  }
  .subtitle {
    font: {
      size: 20px;
      weight: 500;
    }
  }
}
.btn {
  margin: 24px auto;
  display: flex;
  flex-flow: row nowrap;
  border: 2px solid transparent;
  border-radius: 8px;
  align-items: center;
  min: {
    height: $min-size;
    width: $min-size;
  }
  color: #263238;
  cursor: pointer;
  background-color: #e6e6e6;
  transition: all 0.3s ease;
  &:active {
    background-color: #e6e6e6;
  }
  &:hover {
    background-color: white;
    border: 2px solid #ff8f44;
    .text {
      opacity: 1;
    }
  }
  &:focus {
    outline: none;
    border: 2px solid #263238;
  }
  :global .md-icons {
    font-size: 28px;
  }
  .text {
    padding: 4px;
    opacity: .87;
    transition: all 0.3s ease;
    font: {
      size: 16px;
      weight: 600;
    }
    @media only screen and (min-width: 992px) {
      font-weight: 600;
    }
  }
}`;

export function emptyComponent({title, subtitle, imgURL, display, onButtonPressed: onClick}
  : {title: string, subtitle: string, imgURL: string, display: boolean, onButtonPressed: (event: MouseEvent) => void}) {
  return Component.html`
    <div class="${emptyComponentStyle.wrapper +' '+ (display ? '' : emptyComponentStyle.none)}">
      <img class="${emptyComponentStyle.img}" alt="error" loading="lazy" src="${imgURL}" width="640" height="360" />
      <h1 class="${emptyComponentStyle.title}">${title}</h1>
      <h2 class="${emptyComponentStyle.subtitle} ${emptyComponentStyle.error}">${subtitle}</h2>
      <button class="${emptyComponentStyle.btn}" onclick="${onClick}">
        <i class="md-icons">navigate_before</i>
        <span class="${emptyComponentStyle.text}">back</span>
      </button>
    </div>
  `;
};
