function pad(number) {
  return String(number).padStart(2, "0")
}

function formatTime(date) {
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${hours}:${minutes}:${seconds}`
}

function formatDate(date) {
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = pad(date.getFullYear()).slice(2);

  return `${day}:${month}:${year}`;
}

function set(el, content) {
  if (el.innerHTML !== content) {
    el.innerHTML = content;
  }
}

function main() {
  const time_el = document.querySelector(".time");
  const date_el = document.querySelector(".date");

  function update() {
    const ms = new Date();
    set(time_el, formatTime(ms));
    set(date_el, formatDate(ms));
  }

  update();
  setInterval(update, 1000);
}

main();


