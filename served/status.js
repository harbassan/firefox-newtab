const status_bar = document.querySelector("ul.headlines-wrapper");

export function update(message) {
    status_bar.innerHTML = `<li class="headline">${message}</li>`;
}

export function error(message) {
    status_bar.innerHTML = `<li class="headline error">${message}</li>`;
}

export function clear() {
    status_bar.innerHTML = "";
}
