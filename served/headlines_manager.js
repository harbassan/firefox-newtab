import headlines from "./headlines_store.js";

const headlines_container = document.querySelector(".headlines-wrapper")

function render_headline(headline) {
  const { title, url } = headline;
  return (`
    <li class="headline">
      <a href="${url}">
        ${title}
      </a>
    </li>
  `)
}

function render_headlines() {
  const headline_els = headlines.map(headline => render_headline(headline));
  headlines_container.innerHTML = headline_els.join("");
}

render_headlines();
