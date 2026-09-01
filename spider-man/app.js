const DATA_URL = document.body.dataset.dataUrl || "data/sessions.json";
const DISPLAY_TIMEZONE = "Europe/Minsk";
const STALE_AFTER_MS = 90 * 60 * 1000;

const number = new Intl.NumberFormat("ru-RU");
const percent = new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const dayFormat = new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", timeZone: DISPLAY_TIMEZONE });
const dateOptionFormat = new Intl.DateTimeFormat("ru-RU", { weekday: "short", day: "2-digit", month: "long", timeZone: DISPLAY_TIMEZONE });
const timeFormat = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: DISPLAY_TIMEZONE });
const updatedFormat = new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: DISPLAY_TIMEZONE });
const dateKeyFormat = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: DISPLAY_TIMEZONE });

const $ = (id) => document.getElementById(id);
let reportData = null;

function zoneFor(value) {
  if (value <= 5) return { key: "critical", label: "Красная зона" };
  if (value <= 25) return { key: "low", label: "Низкий выкуп" };
  if (value <= 50) return { key: "medium", label: "Средний выкуп" };
  return { key: "strong", label: "Высокий выкуп" };
}

function dateKey(value) {
  const parts = dateKeyFormat.formatToParts(new Date(value));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function sortShows(shows, mode = "weakest") {
  const sorted = [...shows];
  if (mode === "strongest") {
    return sorted.sort((a, b) => b.sold_percent - a.sold_percent || new Date(a.start) - new Date(b.start));
  }
  if (mode === "time") {
    return sorted.sort((a, b) => new Date(a.start) - new Date(b.start) || a.show_id - b.show_id);
  }
  return sorted.sort((a, b) => a.sold_percent - b.sold_percent || new Date(a.start) - new Date(b.start));
}

function sortWeakestFirst(shows) {
  return sortShows(shows, "weakest");
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
  hall.querySelector("strong").textContent = show.cinema || "Кинотеатр не указан";
  hall.querySelector("span").textContent = `${show.auditorium} · Сеанс #${show.show_id}`;

  const sales = row.querySelector(".show-row__sales");
  sales.querySelector("strong").textContent = `${number.format(show.ticket_sold)} / ${number.format(show.capacity)}`;
  sales.querySelector("span").textContent = "занято / мест";

  const meter = row.querySelector(".show-row__meter");
  meter.setAttribute("aria-valuenow", String(show.sold_percent));
  meter.setAttribute("aria-label", `Выкуп ${percent.format(show.sold_percent)} процента`);
  meter.querySelector("span").textContent = `${number.format(Math.max(0, show.capacity - show.ticket_sold))} мест свободно`;

  const result = row.querySelector(".show-row__percent");
  result.querySelector("strong").textContent = `${percent.format(show.sold_percent)}%`;
  result.querySelector("span").textContent = isPast ? "итог" : zone.label;
  return fragment;
}

function renderList(target, shows, isPast, sortMode) {
  target.replaceChildren();
  if (!shows.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    const title = document.createElement("strong");
    const body = document.createElement("span");
    title.textContent = "По выбранным фильтрам ничего не найдено";
    body.textContent = "Измените условия или сбросьте фильтры.";
    empty.append(title, body);
    target.append(empty);
    return;
  }
  const fragment = document.createDocumentFragment();
  sortShows(shows, sortMode).forEach((show) => fragment.append(createShowRow(show, isPast)));
  target.append(fragment);
}

function updateSummary(upcoming, past) {
  const sold = upcoming.reduce((sum, show) => sum + show.ticket_sold, 0);
  const capacity = upcoming.reduce((sum, show) => sum + show.capacity, 0);
  const nextDay = new Date(reportData.meta.generated_at).getTime() + 24 * 60 * 60 * 1000;
  const redZoneCount = upcoming.filter((show) => (
    new Date(show.start).getTime() <= nextDay && show.sold_percent <= 5
  )).length;
  $("upcoming-count").textContent = number.format(upcoming.length);
  $("past-count").textContent = number.format(past.length);
  $("upcoming-nav-count").textContent = number.format(upcoming.length);
  $("past-nav-count").textContent = number.format(past.length);
  $("upcoming-sold").textContent = number.format(sold);
  $("upcoming-capacity").textContent = capacity ? `из ${number.format(capacity)} мест` : "мест";
  $("red-zone-count").textContent = number.format(redZoneCount);
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

function occupancyMatches(show, filter) {
  if (filter === "critical") return show.sold_percent <= 5;
  if (filter === "low") return show.sold_percent > 5 && show.sold_percent <= 25;
  if (filter === "medium") return show.sold_percent > 25 && show.sold_percent <= 50;
  if (filter === "strong") return show.sold_percent > 50;
  if (filter === "full") return show.sold_percent === 100;
  return true;
}

function filteredShows(shows) {
  const cinema = $("filter-cinema").value;
  const selectedDate = $("filter-date").value;
  const occupancy = $("filter-occupancy").value;
  const search = $("filter-search").value.trim().toLocaleLowerCase("ru");
  return shows.filter((show) => {
    if (cinema && show.cinema !== cinema) return false;
    if (selectedDate && dateKey(show.start) !== selectedDate) return false;
    if (!occupancyMatches(show, occupancy)) return false;
    if (search) {
      const haystack = `${show.cinema} ${show.auditorium} ${show.show_id}`.toLocaleLowerCase("ru");
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

function renderReport() {
  if (!reportData) return;
  const cutoff = new Date(reportData.meta.generated_at).getTime();
  const filtered = filteredShows(reportData.shows);
  const upcoming = filtered.filter((show) => new Date(show.start).getTime() >= cutoff);
  const past = filtered.filter((show) => new Date(show.start).getTime() < cutoff);
  const mode = $("filter-state").value;
  const sortMode = $("filter-sort").value;
  $("upcoming-section").hidden = mode === "past";
  $("past-section").hidden = mode === "upcoming";
  renderList($("upcoming-list"), upcoming, false, sortMode);
  renderList($("past-list"), past, true, sortMode);
  updateSummary(upcoming, past);
  $("filter-result").textContent = `Показано ${number.format(upcoming.length + past.length)} из ${number.format(reportData.shows.length)}`;
}

function fillSelect(select, options) {
  options.forEach(({ value, label }) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    select.append(option);
  });
}

function setFiltersCollapsed(collapsed) {
  const panel = document.querySelector(".filters");
  const toggle = $("filter-toggle");
  panel.classList.toggle("is-collapsed", collapsed);
  toggle.setAttribute("aria-expanded", String(!collapsed));
  toggle.textContent = collapsed ? "Развернуть" : "Свернуть";
}

function setupFilters(data) {
  const cinemas = [...new Set(data.shows.map((show) => show.cinema).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ru"));
  fillSelect($("filter-cinema"), cinemas.map((cinema) => ({ value: cinema, label: cinema })));
  const dates = [...new Map(data.shows.map((show) => [dateKey(show.start), new Date(show.start)])).entries()]
    .sort((a, b) => a[1] - b[1]);
  fillSelect($("filter-date"), dates.map(([value, date]) => ({ value, label: dateOptionFormat.format(date) })));
  document.querySelectorAll(".filter-control").forEach((control) => control.addEventListener("input", renderReport));
  $("filter-reset").addEventListener("click", () => {
    $("filter-cinema").value = "";
    $("filter-date").value = "";
    $("filter-occupancy").value = "";
    $("filter-state").value = "all";
    $("filter-sort").value = "weakest";
    $("filter-search").value = "";
    renderReport();
  });
  $("filter-toggle").addEventListener("click", () => {
    setFiltersCollapsed(!document.querySelector(".filters").classList.contains("is-collapsed"));
  });
  setFiltersCollapsed(window.matchMedia("(max-width: 40rem)").matches);
  document.querySelectorAll(".mode-nav a").forEach((link) => link.addEventListener("click", () => {
    $("filter-state").value = link.classList.contains("mode-nav__past") ? "past" : "upcoming";
    renderReport();
  }));
}

async function init() {
  const response = await fetch(`${DATA_URL}?v=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  reportData = await response.json();
  const eventHeading = $("event-name");
  const [eventLead, ...eventTail] = String(reportData.event.name).split(": ");
  eventHeading.replaceChildren(document.createTextNode(`${eventLead}:`), document.createElement("br"));
  const eventAccent = document.createElement("span");
  eventAccent.textContent = eventTail.join(": ") || "Новый день";
  eventHeading.append(eventAccent);
  updateFreshness(reportData.meta.generated_at);
  setupFilters(reportData);
  renderReport();
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

window.CapacityReport = { zoneFor, sortWeakestFirst, sortShows };
