const DATA_URL = document.body.dataset.dataUrl || "data/sessions.json";
const DISPLAY_TIMEZONE = "Europe/Minsk";
const STALE_AFTER_MS = 90 * 60 * 1000;

const number = new Intl.NumberFormat("ru-RU");
const percent = new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const dayFormat = new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", timeZone: DISPLAY_TIMEZONE });
const timeFormat = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: DISPLAY_TIMEZONE });
const updatedFormat = new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: DISPLAY_TIMEZONE });

const $ = (id) => document.getElementById(id);

function zoneFor(value) {
  if (value <= 5) return { key: "critical", label: "Красная зона" };
  if (value <= 25) return { key: "low", label: "Низкий выкуп" };
  if (value <= 50) return { key: "medium", label: "Средний выкуп" };
  return { key: "strong", label: "Высокий выкуп" };
}

function sortWeakestFirst(shows) {
  return [...shows].sort((a, b) => a.sold_percent - b.sold_percent || new Date(a.start) - new Date(b.start));
}

function createShowRow(show, isPast) {
  const fragment = $("show-row-template").content.cloneNode(true);
  const row = fragment.querySelector(".show-row");
  const startedAt = new Date(show.start);
  const zone = zoneFor(show.sold_percent);
  row.classList.add(`show-row--${zone.key}`);
  row.style.setProperty("--zone-color", `var(--color-${zone.key})`);
  row.style.setProperty("--meter", `${Math.min(100, Math.max(0, show.sold_percent))}%`);

  const time = row.querySelector(".show-row__time");
  time.querySelector("strong").textContent = timeFormat.format(startedAt);
  time.querySelector("span").textContent = dayFormat.format(startedAt).replace(".", "");

  const hall = row.querySelector(".show-row__hall");
  hall.querySelector("strong").textContent = show.auditorium;
  hall.querySelector("span").textContent = `Сеанс #${show.show_id}`;

  const sales = row.querySelector(".show-row__sales");
  sales.querySelector("strong").textContent = `${number.format(show.ticket_sold)} / ${number.format(show.capacity)}`;
  sales.querySelector("span").textContent = "билетов / мест";

  const meter = row.querySelector(".show-row__meter");
  meter.setAttribute("aria-valuenow", String(show.sold_percent));
  meter.setAttribute("aria-label", `Выкуп ${percent.format(show.sold_percent)} процента`);
  meter.querySelector("span").textContent = `${number.format(Math.max(0, show.capacity - show.ticket_sold))} мест свободно`;

  const result = row.querySelector(".show-row__percent");
  result.querySelector("strong").textContent = `${percent.format(show.sold_percent)}%`;
  result.querySelector("span").textContent = isPast ? "итог" : zone.label;
  return fragment;
}

function renderList(target, shows, isPast) {
  target.replaceChildren();
  if (!shows.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    const title = document.createElement("strong");
    const body = document.createElement("span");
    title.textContent = isPast ? "Прошедших сеансов пока нет" : "Предстоящих сеансов пока нет";
    body.textContent = "Раздел обновится после следующей выгрузки SilverScreen.";
    empty.append(title, body);
    target.append(empty);
    return;
  }
  const fragment = document.createDocumentFragment();
  sortWeakestFirst(shows).forEach((show) => fragment.append(createShowRow(show, isPast)));
  target.append(fragment);
}

function updateSummary(upcoming, past) {
  const sold = upcoming.reduce((sum, show) => sum + show.ticket_sold, 0);
  const capacity = upcoming.reduce((sum, show) => sum + show.capacity, 0);
  $("upcoming-count").textContent = number.format(upcoming.length);
  $("past-count").textContent = number.format(past.length);
  $("upcoming-nav-count").textContent = number.format(upcoming.length);
  $("past-nav-count").textContent = number.format(past.length);
  $("upcoming-sold").textContent = number.format(sold);
  $("upcoming-capacity").textContent = capacity ? `из ${number.format(capacity)} мест` : "билетов";
  $("weakest-percent").textContent = upcoming.length
    ? `${percent.format(Math.min(...upcoming.map((show) => show.sold_percent)))}%`
    : "—";
}

function updateFreshness(generatedAt) {
  const element = $("freshness");
  const generated = new Date(generatedAt);
  const age = Date.now() - generated.getTime();
  element.classList.toggle("is-stale", age > STALE_AFTER_MS);
  element.querySelector("span").textContent = age > STALE_AFTER_MS
    ? `Данные устарели · ${updatedFormat.format(generated)}`
    : `Обновлено ${updatedFormat.format(generated)}`;
}

async function init() {
  const response = await fetch(`${DATA_URL}?v=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  const cutoff = new Date(data.meta.generated_at).getTime();
  const upcoming = data.shows.filter((show) => new Date(show.start).getTime() >= cutoff);
  const past = data.shows.filter((show) => new Date(show.start).getTime() < cutoff);
  const eventHeading = $("event-name");
  const [eventLead, ...eventTail] = String(data.event.name).split(": ");
  eventHeading.replaceChildren(document.createTextNode(`${eventLead}:`), document.createElement("br"));
  const eventAccent = document.createElement("span");
  eventAccent.textContent = eventTail.join(": ") || "Новый день";
  eventHeading.append(eventAccent);
  updateFreshness(data.meta.generated_at);
  updateSummary(upcoming, past);
  renderList($("upcoming-list"), upcoming, false);
  renderList($("past-list"), past, true);
}

init().catch((error) => {
  const freshness = $("freshness");
  freshness.classList.add("is-error");
  freshness.querySelector("span").textContent = "Данные не загрузились";
  [$("upcoming-list"), $("past-list")].forEach((target) => {
    target.textContent = `Не удалось открыть выгрузку: ${error.message}`;
    target.classList.add("empty-state");
  });
  console.error(error);
});

window.CapacityReport = { zoneFor, sortWeakestFirst };
