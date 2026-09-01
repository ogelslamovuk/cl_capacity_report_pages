const DATA_URL = document.body.dataset.dataUrl || "data/board.json";
const DISPLAY_TIMEZONE = "Europe/Minsk";
const DAY_MS = 24 * 60 * 60 * 1000;

const number = new Intl.NumberFormat("ru-RU");
const percent = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });
const dateFormat = new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", timeZone: DISPLAY_TIMEZONE });
const longDateFormat = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone: DISPLAY_TIMEZONE });
const timeFormat = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: DISPLAY_TIMEZONE });
const updatedFormat = new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: DISPLAY_TIMEZONE });
const dayKeyFormat = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: DISPLAY_TIMEZONE });
const hourFormat = new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: DISPLAY_TIMEZONE });

const state = {
  catalog: "current",
  period: "7d",
  cinema: "",
  week: "",
  signal: "",
  query: "",
  sort: "priority",
  currentFilm: null,
  sessionState: "upcoming"
};

const catalogMeta = {
  current: { label: "В прокате", description: "Фильмы, которые уже вышли и имеют предстоящие активные сеансы." },
  upcoming: { label: "Скоро", description: "Релиз еще не наступил, но сеансы уже появились в расписании." },
  recent: { label: "Сняты недавно", description: "Будущих сеансов нет, но показы были в последние семь дней." },
  special: { label: "Спецпоказы", description: "Событийные программы и ограниченные показы рассматриваются отдельно." }
};

const signalStyles = {
  critical: { color: "var(--color-critical)", soft: "var(--color-critical-soft)", label: "Проверить" },
  opportunity: { color: "var(--color-positive)", soft: "var(--color-positive-soft)", label: "Возможность" },
  watch: { color: "var(--color-warning)", soft: "var(--color-warning-soft)", label: "Наблюдать" },
  stable: { color: "var(--color-accent)", soft: "var(--color-accent-soft)", label: "Без отклонений" }
};

const helpCopy = {
  snapshot: "Время последней выгрузки из SilverScreen. Все показатели актуальны на этот момент.",
  period: "Сегодня — сеансы календарного дня снимка. Прошлые 7 — завершенные показы, следующие 7 — опубликованное будущее расписание.",
  catalog: "Разделяет текущий прокат, будущие релизы, недавно снятые фильмы и специальные показы по состоянию расписания.",
  search: "Фильтрует репертуар по названию фильма или события.",
  cinema_filter: "Ограничивает расчеты одной площадкой. «Вся сеть» объединяет все кинотеатры.",
  week_filter: "Прокатная неделя считается от локальной даты релиза фильма.",
  signal_filter: "Оставляет фильмы с выбранным типом аналитического сигнала.",
  reset: "Возвращает фильтры поиска и сортировку к исходным значениям.",
  sort: "Меняет порядок фильмов в таблице, не изменяя показатели.",
  signals_section: "Наиболее заметные ситуации по действующим пороговым правилам, отсортированные по приоритету.",
  portfolio_section: "Полный список событий выбранного раздела с показателями за активный период.",
  network_occupancy: "Проданные места делятся на доступную вместимость всех сеансов выбранного периода.",
  network_tickets: "Сумма проданных мест по сеансам выбранного периода.",
  network_sessions: "Количество активных сеансов, попавших в выбранный период и фильтры.",
  network_screen: "Суммарная длительность сеансов. При отсутствии времени окончания используется хронометраж фильма.",
  network_signals: "Количество фильмов с сигналом «проверить» или «возможность».",
  portfolio_film: "Название фильма и краткая рекомендация по текущему сигналу.",
  portfolio_week: "Текущая прокатная неделя от локальной даты релиза.",
  portfolio_sessions: "Количество сеансов фильма в выбранном периоде.",
  portfolio_tickets: "Проданные места по сеансам выбранного периода.",
  portfolio_screen: "Суммарное экранное время фильма в выбранном периоде.",
  portfolio_occupancy: "Взвешенная загрузка: все проданные места делятся на общую вместимость.",
  portfolio_state: "Сигнал, который сработал по прозрачному пороговому правилу V0.",
  film_final_occupancy: "Проданные места делятся на вместимость завершенных сеансов за последние семь дней.",
  film_future_occupancy: "Текущий выкуп предстоящих сеансов на момент снимка.",
  film_tickets: "Проданные места по всем сеансам фильма в доступном окне данных.",
  film_sessions: "Все активные сеансы фильма в доступном окне данных.",
  film_screen: "Суммарная длительность всех сеансов фильма в доступном окне данных.",
  film_week: "Прокатная неделя от локальной даты релиза. До релиза значение не рассчитывается.",
  trend_section: "Финальная загрузка завершенных сеансов по дням. До релиза здесь показан текущий выкуп будущих сеансов.",
  cinema_section: "Сравнение взвешенной загрузки фильма между кинотеатрами.",
  evidence_section: "Объясняет, какое пороговое правило сработало и на каких фактах основан вывод.",
  daypart_section: "Сравнивает загрузку утром, днем, вечером и после 22:00.",
  sessions_section: "Все опубликованные сеансы фильма в окне данных с текущим или финальным заполнением.",
  session_tabs: "Переключает весь список, будущие продажи и завершенные показы за последние семь дней.",
  session_time: "Локальные дата и время начала сеанса.",
  session_cinema: "Площадка, зал и доступная вместимость сеанса.",
  session_occupancy: "Проданные места делятся на вместимость конкретного сеанса.",
  session_sold: "Количество проданных мест и полная вместимость зала.",
  session_fill: "Визуальная шкала текущего или финального заполнения зала.",
  session_state: "Словесная оценка загрузки по порогам текущей версии.",
  session_drawer: "Детализация выбранного сеанса на момент текущего снимка SilverScreen."
};

const $ = (id) => document.getElementById(id);
let reportData = null;

function h(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function posterMarkup(event, size = "small", loading = "lazy") {
  const initial = event.name.trim().charAt(0).toLocaleUpperCase("ru") || "M";
  const image = event.poster_url
    ? `<img src="${h(event.poster_url)}" alt="" loading="${loading}" decoding="async" data-poster-image>`
    : "";
  return `<span class="poster poster--${size}" aria-hidden="true"><span class="poster__fallback">${h(initial)}</span>${image}</span>`;
}

function bindPosterFallbacks(root = document) {
  root.querySelectorAll("[data-poster-image]").forEach((image) => {
    const hideBrokenImage = () => { image.hidden = true; };
    image.addEventListener("error", hideBrokenImage, { once: true });
    if (image.complete && image.naturalWidth === 0) hideBrokenImage();
  });
}

function styleFor(signal) {
  return signalStyles[signal] || signalStyles.stable;
}

function signalVariables(item) {
  const style = styleFor(item.signal);
  return `--signal-color:${style.color};--signal-soft:${style.soft}`;
}

function dateKey(value) {
  const parts = dayKeyFormat.formatToParts(new Date(value));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function dateAtStartOfDay(value) {
  return new Date(`${dateKey(value)}T00:00:00+03:00`);
}

function weightedOccupancy(shows) {
  const capacity = shows.reduce((sum, show) => sum + show.capacity, 0);
  const sold = shows.reduce((sum, show) => sum + show.ticket_sold, 0);
  return capacity ? Math.round(sold * 1000 / capacity) / 10 : 0;
}

function showDurationMinutes(show, event) {
  if (show.end) {
    const duration = Math.round((new Date(show.end) - new Date(show.start)) / 60000);
    if (duration > 0 && duration < 360) return duration;
  }
  return event.runtime || 0;
}

function periodShows(event) {
  const asOf = new Date(reportData.meta.generated_at);
  const source = state.cinema
    ? event.shows.filter((show) => String(show.cinema_id) === state.cinema)
    : event.shows;
  if (state.period === "today") {
    const key = dateKey(asOf);
    return source.filter((show) => dateKey(show.start) === key);
  }
  if (state.period === "next") {
    const end = new Date(asOf.getTime() + 7 * DAY_MS);
    return source.filter((show) => new Date(show.start) >= asOf && new Date(show.start) < end);
  }
  const start = new Date(asOf.getTime() - 7 * DAY_MS);
  return source.filter((show) => new Date(show.start) >= start && new Date(show.start) < asOf);
}

function cinemaSpread(shows) {
  const grouped = new Map();
  shows.forEach((show) => {
    const group = grouped.get(show.cinema) || [];
    group.push(show);
    grouped.set(show.cinema, group);
  });
  const values = [...grouped.entries()]
    .map(([name, items]) => ({ name, shows: items.length, occupancy: weightedOccupancy(items) }))
    .filter((item) => item.shows >= 3)
    .sort((a, b) => b.occupancy - a.occupancy);
  if (values.length < 2) return null;
  const strongest = values[0];
  const weakest = values.at(-1);
  return { strongest, weakest, gap: Math.round((strongest.occupancy - weakest.occupancy) * 10) / 10 };
}

function deriveSignal(event) {
  const asOf = new Date(reportData.meta.generated_at);
  const source = state.cinema
    ? event.shows.filter((show) => String(show.cinema_id) === state.cinema)
    : event.shows;
  const future24 = source.filter((show) => {
    const start = new Date(show.start);
    return start >= asOf && start < new Date(asOf.getTime() + DAY_MS);
  });
  const future4 = source.filter((show) => {
    const start = new Date(show.start);
    return start >= asOf && start < new Date(asOf.getTime() + 4 * 60 * 60 * 1000);
  });
  const past7 = source.filter((show) => {
    const start = new Date(show.start);
    return start < asOf && start >= new Date(asOf.getTime() - 7 * DAY_MS);
  });
  const next7 = source.filter((show) => {
    const start = new Date(show.start);
    return start >= asOf && start < new Date(asOf.getTime() + 7 * DAY_MS);
  });

  if (event.state === "upcoming") {
    const sold = next7.reduce((sum, show) => sum + show.ticket_sold, 0);
    return {
      signal: "watch",
      signalLabel: "Предпродажи открыты",
      recommendation: `${number.format(sold)} билетов продано на первые сеансы`,
      evidence: [
        `В расписании ${next7.length} сеансов на ближайшие семь дней.`,
        `Текущий выкуп будущих сеансов — ${percent.format(weightedOccupancy(next7))}%.`,
        `Официальная дата релиза — ${longDateFormat.format(new Date(`${event.release_anchor}T12:00:00+03:00`))}.`
      ],
      priority: 50 + Math.min(40, weightedOccupancy(next7))
    };
  }

  if (event.state === "recent") {
    const lastShow = new Date(event.last_show);
    return {
      signal: "stable",
      signalLabel: "Прокат завершен",
      recommendation: `Последний сеанс был ${dateFormat.format(lastShow)}`,
      evidence: [
        `За последние семь дней прошло ${past7.length} сеансов.`,
        `Их финальная загрузка составила ${percent.format(weightedOccupancy(past7))}%.`,
        "Предстоящих активных сеансов в опубликованном расписании нет."
      ],
      priority: weightedOccupancy(past7)
    };
  }

  if (event.state === "special") {
    const future = source.filter((show) => new Date(show.start) >= asOf);
    return {
      signal: "watch",
      signalLabel: "Специальная программа",
      recommendation: future.length ? `${future.length} предстоящих сеансов` : "Показ уже состоялся",
      evidence: [
        `Событие идет отдельно от регулярного кинорепертуара.`,
        `Всего в текущем окне ${source.length} сеансов.`,
        `Текущий выкуп — ${percent.format(weightedOccupancy(future.length ? future : source))}%.`
      ],
      priority: future.length ? 55 + weightedOccupancy(future) / 2 : 20
    };
  }

  const future24Occupancy = weightedOccupancy(future24);
  const highFuture = future24.filter((show) => show.sold_percent >= 75);
  if (future24.length >= 2 && (future24Occupancy >= 70 || highFuture.length >= 2)) {
    return {
      signal: "opportunity",
      signalLabel: "Высокий выкуп <24ч",
      recommendation: "Проверить вместимость ближайших сеансов",
      evidence: [
        `${highFuture.length} ближайших сеанса уже заполнены минимум на 75%.`,
        `Средний выкуп в ближайшие 24 часа — ${percent.format(future24Occupancy)}%.`,
        `Всего в ближайшие семь дней запланировано ${next7.length} сеансов.`
      ],
      priority: 80 + Math.min(19, future24Occupancy / 5)
    };
  }

  const pastOccupancy = weightedOccupancy(past7);
  if (past7.length >= 10 && pastOccupancy <= 18) {
    return {
      signal: "critical",
      signalLabel: "Низкая финальная загрузка",
      recommendation: "Проверить объем и расположение сеансов",
      evidence: [
        `За семь дней завершено ${past7.length} сеансов.`,
        `Их фактическая финальная загрузка — ${percent.format(pastOccupancy)}%.`,
        `В будущем расписании остается ${next7.length} сеансов.`
      ],
      priority: 92
    };
  }

  const future4Occupancy = weightedOccupancy(future4);
  const weakImmediate = future4.filter((show) => show.sold_percent <= 10);
  if (future4.length >= 2 && future4Occupancy <= 10 && weakImmediate.length >= 2) {
    return {
      signal: "critical",
      signalLabel: "Слабый ближайший слот",
      recommendation: "Проверить сеансы, начинающиеся в течение четырех часов",
      evidence: [
        `${weakImmediate.length} ближайших сеанса заполнены не более чем на 10%.`,
        `Средний выкуп четырехчасового окна — ${percent.format(future4Occupancy)}%.`,
        "Сигнал ограничен только сеансами, до которых осталось мало времени."
      ],
      priority: 88
    };
  }

  const spread = cinemaSpread([...past7, ...next7]);
  if (!state.cinema && spread && spread.gap >= 25) {
    return {
      signal: "watch",
      signalLabel: "Локальный перекос",
      recommendation: `Разница между площадками — ${percent.format(spread.gap)} п.п.`,
      evidence: [
        `${spread.strongest.name}: ${percent.format(spread.strongest.occupancy)}% загрузки.`,
        `${spread.weakest.name}: ${percent.format(spread.weakest.occupancy)}% загрузки.`,
        "В сравнении участвуют площадки минимум с тремя сеансами."
      ],
      priority: 65 + Math.min(20, spread.gap / 2)
    };
  }

  if (event.week >= 3 && past7.length >= 4 && pastOccupancy >= 45) {
    return {
      signal: "opportunity",
      signalLabel: `Держится на ${event.week}-й неделе`,
      recommendation: "Фильм сохраняет рабочую загрузку",
      evidence: [
        `Финальная загрузка за семь дней — ${percent.format(pastOccupancy)}%.`,
        `За период завершено ${past7.length} сеансов.`,
        `В будущем расписании остается ${next7.length} сеансов.`
      ],
      priority: 70 + pastOccupancy / 4
    };
  }

  return {
    signal: "stable",
    signalLabel: "Без явного сигнала",
    recommendation: "Смотреть фактические сеансы",
    evidence: [
      `За семь дней завершено ${past7.length} сеансов с загрузкой ${percent.format(pastOccupancy)}%.`,
      `В ближайшие семь дней стоит ${next7.length} сеансов.`,
      "Пороговые правила V0 не нашли выраженного отклонения."
    ],
    priority: 30 + pastOccupancy / 3
  };
}

function eventView(event) {
  const shows = periodShows(event);
  const capacity = shows.reduce((sum, show) => sum + show.capacity, 0);
  const sold = shows.reduce((sum, show) => sum + show.ticket_sold, 0);
  const screenMinutes = shows.reduce((sum, show) => sum + showDurationMinutes(show, event), 0);
  const signal = deriveSignal(event);
  return {
    ...event,
    ...signal,
    periodShows: shows,
    sessions: shows.length,
    capacity,
    tickets: sold,
    occupancy: capacity ? Math.round(sold * 1000 / capacity) / 10 : 0,
    screenHours: Math.round(screenMinutes / 6) / 10,
    trend: dailyOccupancy(event.shows.filter((show) => show.state === "past")).slice(-7)
  };
}

function periodLabel() {
  if (state.period === "today") return "за сегодня";
  if (state.period === "next") return "на следующие 7 дней";
  return "за завершенные 7 дней";
}

function helpTrigger(key, label) {
  return `<button class="help-trigger" type="button" data-help="${h(key)}" aria-label="Справка: ${h(label)}">i</button>`;
}

function headerCell(label, helpKey) {
  return `<span class="table-head-label">${h(label)}${helpTrigger(helpKey, label)}</span>`;
}

function metric(label, value, detail, tone = "", helpKey = "") {
  const help = helpKey ? helpTrigger(helpKey, label) : "";
  return `<article class="metric ${tone ? `metric--${tone}` : ""}"><div class="metric__label"><span>${h(label)}</span>${help}</div><strong>${h(value)}</strong><small>${h(detail)}</small></article>`;
}

function setupHelpTooltips() {
  const tooltip = $("help-tooltip");
  const hoverDelay = 800;
  let activeTrigger = null;
  let activation = "";
  let showTimer = 0;
  let hideTimer = 0;
  let transitionTimer = 0;

  const positionTooltip = () => {
    if (!activeTrigger || tooltip.hidden || !activeTrigger.isConnected) return;
    const triggerRect = activeTrigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    const gap = 10;
    const edge = 8;
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const placeBelow = spaceBelow >= tooltipRect.height + gap || spaceBelow >= triggerRect.top;
    const top = placeBelow
      ? triggerRect.bottom + gap
      : triggerRect.top - tooltipRect.height - gap;
    const unclampedLeft = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
    const left = Math.max(edge, Math.min(unclampedLeft, viewportWidth - tooltipRect.width - edge));
    const arrowLeft = Math.max(10, Math.min(triggerRect.left + triggerRect.width / 2 - left, tooltipRect.width - 10));
    tooltip.dataset.placement = placeBelow ? "below" : "above";
    tooltip.style.left = `${Math.round(left)}px`;
    tooltip.style.top = `${Math.round(Math.max(edge, top))}px`;
    tooltip.style.setProperty("--tooltip-arrow-left", `${Math.round(arrowLeft)}px`);
  };

  const showTooltip = (trigger, source) => {
    const copy = helpCopy[trigger.dataset.help];
    if (!copy) return;
    window.clearTimeout(showTimer);
    window.clearTimeout(hideTimer);
    window.clearTimeout(transitionTimer);
    if (activeTrigger && activeTrigger !== trigger) {
      activeTrigger.removeAttribute("aria-describedby");
      activeTrigger.setAttribute("aria-expanded", "false");
    }
    activeTrigger = trigger;
    activation = source;
    tooltip.textContent = copy;
    tooltip.hidden = false;
    tooltip.classList.remove("is-visible");
    trigger.setAttribute("aria-describedby", "help-tooltip");
    trigger.setAttribute("aria-expanded", "true");
    positionTooltip();
    window.requestAnimationFrame(() => tooltip.classList.add("is-visible"));
  };

  const hideTooltip = (immediate = false) => {
    window.clearTimeout(showTimer);
    window.clearTimeout(hideTimer);
    if (!activeTrigger && tooltip.hidden) return;
    const trigger = activeTrigger;
    activeTrigger = null;
    activation = "";
    if (trigger) {
      trigger.removeAttribute("aria-describedby");
      trigger.setAttribute("aria-expanded", "false");
    }
    tooltip.classList.remove("is-visible");
    const finish = () => {
      if (!activeTrigger) tooltip.hidden = true;
    };
    if (immediate) finish();
    else transitionTimer = window.setTimeout(finish, 160);
  };

  document.addEventListener("pointerover", (event) => {
    const trigger = event.target.closest(".help-trigger");
    if (!trigger || event.pointerType === "touch" || trigger.contains(event.relatedTarget)) return;
    window.clearTimeout(hideTimer);
    showTimer = window.setTimeout(() => showTooltip(trigger, "hover"), hoverDelay);
  });

  document.addEventListener("pointerout", (event) => {
    const trigger = event.target.closest(".help-trigger");
    if (!trigger || trigger.contains(event.relatedTarget)) return;
    window.clearTimeout(showTimer);
    if (activeTrigger === trigger && activation !== "tap" && !trigger.matches(":focus-visible")) {
      hideTimer = window.setTimeout(() => hideTooltip(), 100);
    }
  });

  document.addEventListener("focusin", (event) => {
    const trigger = event.target.closest(".help-trigger");
    if (trigger) showTooltip(trigger, "focus");
  });

  document.addEventListener("focusout", (event) => {
    const trigger = event.target.closest(".help-trigger");
    if (trigger && activeTrigger === trigger && activation !== "tap") {
      hideTimer = window.setTimeout(() => hideTooltip(), 100);
    }
  });

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest(".help-trigger");
    if (trigger) {
      event.preventDefault();
      event.stopPropagation();
      if (window.matchMedia("(hover: none)").matches) {
        if (activeTrigger === trigger && activation === "tap") hideTooltip();
        else showTooltip(trigger, "tap");
      }
      return;
    }
    if (activation === "tap") hideTooltip();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && activeTrigger) {
      hideTooltip(true);
      if (document.activeElement?.classList.contains("help-trigger")) document.activeElement.blur();
    }
  });

  window.addEventListener("resize", positionTooltip);
  window.addEventListener("scroll", positionTooltip, { passive: true });
}

function filteredEvents() {
  const query = state.query.trim().toLocaleLowerCase("ru");
  return reportData.events.filter((event) => {
    if (event.state !== state.catalog) return false;
    const signal = deriveSignal(event);
    if (state.signal && signal.signal !== state.signal) return false;
    if (state.week === "1" && event.week !== 1) return false;
    if (state.week === "2" && event.week !== 2) return false;
    if (state.week === "3+" && event.week < 3) return false;
    if (query && !event.name.toLocaleLowerCase("ru").includes(query)) return false;
    if (state.cinema && !event.shows.some((show) => String(show.cinema_id) === state.cinema)) return false;
    return true;
  });
}

function renderCatalogTabs() {
  const counts = reportData.meta.state_counts;
  $("catalog-tabs").innerHTML = Object.entries(catalogMeta).map(([key, meta]) => `
    <button class="catalog-tab ${state.catalog === key ? "is-active" : ""}" type="button" data-catalog="${key}">
      <span>${h(meta.label)}</span><strong>${number.format(counts[key] || 0)}</strong>
    </button>`).join("");
  document.querySelectorAll("[data-catalog]").forEach((button) => button.addEventListener("click", () => {
    state.catalog = button.dataset.catalog;
    state.week = "";
    state.signal = "";
    $("week-filter").value = "";
    $("signal-filter").value = "";
    $("board-title").textContent = catalogMeta[state.catalog].label;
    $("board-description").textContent = catalogMeta[state.catalog].description;
    renderCatalogTabs();
    renderBoard();
  }));
}

function renderMetrics(events) {
  const films = events.map(eventView);
  const sessions = films.reduce((sum, film) => sum + film.sessions, 0);
  const tickets = films.reduce((sum, film) => sum + film.tickets, 0);
  const capacity = films.reduce((sum, film) => sum + film.capacity, 0);
  const occupancy = capacity ? Math.round(tickets * 1000 / capacity) / 10 : 0;
  const attention = films.filter((film) => film.signal === "critical" || film.signal === "opportunity").length;
  $("network-metrics").innerHTML = [
    metric("Загрузка", `${percent.format(occupancy)}%`, periodLabel(), "", "network_occupancy"),
    metric("Продано билетов", number.format(tickets), periodLabel(), "", "network_tickets"),
    metric("Сеансы", number.format(sessions), periodLabel(), "", "network_sessions"),
    metric("Экранное время", `${number.format(Math.round(films.reduce((sum, film) => sum + film.screenHours, 0)))} ч`, periodLabel(), "", "network_screen"),
    metric("Сигналы", number.format(attention), "возможности и проверки", attention ? "critical" : "", "network_signals")
  ].join("");
}

function renderDecisionList(events) {
  const decisions = events.map(eventView).sort((a, b) => b.priority - a.priority).slice(0, 6);
  $("decision-count").textContent = `${decisions.length} наиболее заметных ситуаций`;
  $("decision-list").innerHTML = decisions.length ? decisions.map((film) => {
    const style = styleFor(film.signal);
    const week = film.week ? `${film.week}-я неделя` : "до релиза";
    return `<button class="decision-item" type="button" data-film-id="${film.id}" style="${signalVariables(film)}">
      <span class="decision-item__meta"><span>${h(style.label)}</span><small>${h(week)}</small></span>
      <span class="decision-item__body">${posterMarkup(film, "small")}<span class="decision-item__copy"><strong>${h(film.name)}</strong><span>${h(film.signalLabel)}</span></span></span>
      <span class="decision-item__action">${h(film.recommendation)} →</span>
    </button>`;
  }).join("") : `<div class="empty-state"><strong>Событий нет</strong><span>Измени фильтры или раздел репертуара.</span></div>`;
}

function dailyOccupancy(shows) {
  const grouped = new Map();
  shows.forEach((show) => {
    const key = dateKey(show.start);
    const group = grouped.get(key) || [];
    group.push(show);
    grouped.set(key, group);
  });
  return [...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, items]) => ({ key, date: new Date(items[0].start), occupancy: weightedOccupancy(items), sessions: items.length }));
}

function miniTrend(values) {
  const source = values.length ? values : [{ occupancy: 0 }];
  return `<span class="mini-trend" aria-hidden="true">${source.slice(-5).map((item) => `<i style="--bar:${Math.max(8, Math.min(100, item.occupancy))}%"></i>`).join("")}</span>`;
}

function sortEvents(events) {
  const key = state.sort;
  return [...events].sort((a, b) => {
    if (key === "occupancy") return b.occupancy - a.occupancy;
    if (key === "tickets") return b.tickets - a.tickets;
    if (key === "screenHours") return b.screenHours - a.screenHours;
    return b.priority - a.priority;
  });
}

function renderPortfolio(events) {
  const films = sortEvents(events.map(eventView));
  $("portfolio-count").textContent = `${films.length} событий в выбранном разделе`;
  const head = `<div class="table-row table-row--head">
    ${headerCell("Фильм", "portfolio_film")}${headerCell("Нед.", "portfolio_week")}${headerCell("Сеансы", "portfolio_sessions")}${headerCell("Билеты", "portfolio_tickets")}${headerCell("Экран", "portfolio_screen")}${headerCell("Загрузка", "portfolio_occupancy")}${headerCell("Состояние", "portfolio_state")}<span></span>
  </div>`;
  const rows = films.map((film) => `<article class="table-row table-row--film" role="button" tabindex="0" data-film-id="${film.id}" style="${signalVariables(film)}">
    <div class="film-cell"><i class="signal-bar" aria-hidden="true"></i>${posterMarkup(film, "small")}<div><strong>${h(film.name)}</strong><span>${h(film.recommendation)}</span></div></div>
    <div class="data-cell">${film.week || "—"}</div>
    <div class="data-cell">${number.format(film.sessions)}</div>
    <div class="data-cell">${number.format(film.tickets)}</div>
    <div class="data-cell">${number.format(film.screenHours)} ч</div>
    <div class="trend-cell">${miniTrend(film.trend)}<span class="data-cell">${percent.format(film.occupancy)}%</span></div>
    <div><span class="signal-pill">${h(film.signalLabel)}</span></div>
    <div class="row-arrow" aria-hidden="true">→</div>
  </article>`).join("");
  $("portfolio-table").innerHTML = films.length ? head + rows : `<div class="empty-state"><strong>Ничего не найдено</strong><span>Сбрось часть фильтров.</span></div>`;
}

function renderBoard() {
  const events = filteredEvents();
  renderMetrics(events);
  renderDecisionList(events);
  renderPortfolio(events);
  bindPosterFallbacks($("board-view"));
  bindFilmLinks();
}

function filmReferenceShows(event) {
  const asOf = new Date(reportData.meta.generated_at);
  const past7 = event.shows.filter((show) => {
    const start = new Date(show.start);
    return start < asOf && start >= new Date(asOf.getTime() - 7 * DAY_MS);
  });
  if (past7.length) return past7;
  return event.shows.filter((show) => new Date(show.start) >= asOf);
}

function renderFilm(event) {
  state.currentFilm = event;
  const insight = deriveSignal(event);
  const style = styleFor(insight.signal);
  const asOf = new Date(reportData.meta.generated_at);
  const past7 = event.shows.filter((show) => show.state === "past" && new Date(show.start) >= new Date(asOf.getTime() - 7 * DAY_MS));
  const future = event.shows.filter((show) => show.state === "upcoming");
  const reference = filmReferenceShows(event);
  const totalScreenHours = event.shows.reduce((sum, show) => sum + showDurationMinutes(show, event), 0) / 60;
  $("film-view").style.cssText = signalVariables(insight);
  $("film-head").innerHTML = `<div class="film-head__identity">${posterMarkup(event, "large", "eager")}<div class="film-head__title">
      <span>${h(catalogMeta[event.state].label)} · ${event.week ? `${event.week}-я прокатная неделя` : "до релиза"} · ${event.runtime || "—"} мин</span>
      <h1 id="film-title">${h(event.name)}</h1>
      <p>Event ID ${event.id} · релиз ${h(longDateFormat.format(new Date(`${event.release_anchor}T12:00:00+03:00`)))}</p>
    </div></div>
  <div class="recommendation"><span>${h(style.label)} · ${h(insight.signalLabel)}</span><strong>${h(insight.recommendation)}</strong></div>`;
  bindPosterFallbacks($("film-head"));
  $("film-metrics").innerHTML = [
    metric("Финальная загрузка", `${percent.format(weightedOccupancy(past7))}%`, `${past7.length} завершенных сеансов за 7 дней`, "", "film_final_occupancy"),
    metric("Будущий выкуп", `${percent.format(weightedOccupancy(future))}%`, `${future.length} предстоящих сеансов`, "", "film_future_occupancy"),
    metric("Продано билетов", number.format(event.shows.reduce((sum, show) => sum + show.ticket_sold, 0)), "во всем окне данных", "", "film_tickets"),
    metric("Сеансы", number.format(event.shows.length), `${dateFormat.format(new Date(event.first_show))} — ${dateFormat.format(new Date(event.last_show))}`, "", "film_sessions"),
    metric("Экранное время", `${number.format(Math.round(totalScreenHours))} ч`, "во всем окне данных", "", "film_screen"),
    metric("Неделя", event.week || "—", event.week ? "от локальной даты релиза" : "релиз впереди", "", "film_week")
  ].join("");
  renderTrend(event, past7.length ? past7 : future);
  renderCinemaPerformance(reference);
  renderEvidence(insight);
  renderDayparts(reference);
  state.sessionState = event.state === "recent" ? "past" : "upcoming";
  document.querySelectorAll("[data-session-state]").forEach((item) => item.classList.toggle("is-active", item.dataset.sessionState === state.sessionState));
  renderSessions(event);
}

function renderTrend(event, shows) {
  const values = dailyOccupancy(shows).slice(-7);
  $("trend-title").textContent = shows.some((show) => show.state === "past") ? "Финальная загрузка" : "Текущий выкуп";
  $("trend-chart").style.setProperty("--columns", Math.max(1, values.length));
  $("trend-chart").innerHTML = values.length ? values.map((item) => `<div class="trend-column">
    <div class="trend-column__bar" style="--height:${Math.max(2, Math.min(100, item.occupancy))}%"><strong>${percent.format(item.occupancy)}%</strong></div>
    <span>${h(dateFormat.format(item.date))}<small>${item.sessions} сеанс.</small></span>
  </div>`).join("") : `<div class="empty-state"><strong>Нет сеансов</strong><span>В выбранном окне пока нечего сравнивать.</span></div>`;
}

function renderCinemaPerformance(shows) {
  const grouped = new Map();
  shows.forEach((show) => {
    const items = grouped.get(show.cinema) || [];
    items.push(show);
    grouped.set(show.cinema, items);
  });
  const values = [...grouped.entries()]
    .map(([name, items]) => ({ name, items, occupancy: weightedOccupancy(items) }))
    .sort((a, b) => b.occupancy - a.occupancy);
  $("cinema-performance").innerHTML = values.map((cinema) => `<div class="cinema-row">
    <strong>${h(cinema.name)}</strong>
    <div class="cinema-row__meter"><i style="--meter:${Math.min(100, cinema.occupancy)}%"></i></div>
    <span class="cinema-row__value">${percent.format(cinema.occupancy)}%</span>
    <span class="cinema-row__meta">${cinema.items.length} сеанс. · ${number.format(cinema.items.reduce((sum, show) => sum + show.ticket_sold, 0))} бил.</span>
  </div>`).join("") || `<div class="empty-state"><strong>Нет данных</strong></div>`;
}

function renderEvidence(insight) {
  $("evidence-content").innerHTML = `<div class="evidence-call"><span>${h(insight.signalLabel)}</span><strong>${h(insight.recommendation)}</strong></div>
    <ul class="evidence-list">${insight.evidence.map((item) => `<li>${h(item)}</li>`).join("")}</ul>
    <p class="confidence">Прозрачное пороговое правило V0 · один снимок SilverScreen</p>`;
}

function daypartFor(show) {
  const hour = Number(hourFormat.format(new Date(show.start)));
  if (hour < 12) return { key: "morning", label: "Утро", range: "до 12:00" };
  if (hour < 17) return { key: "day", label: "День", range: "12:00–17:00" };
  if (hour < 22) return { key: "evening", label: "Вечер", range: "17:00–22:00" };
  return { key: "late", label: "Поздний", range: "после 22:00" };
}

function zoneFor(occupancy) {
  if (occupancy >= 75) return { color: "var(--color-positive)", label: "Высокий спрос" };
  if (occupancy >= 40) return { color: "var(--color-accent)", label: "Рабочая загрузка" };
  if (occupancy >= 20) return { color: "var(--color-warning)", label: "Ниже среднего" };
  return { color: "var(--color-critical)", label: "Низкий выкуп" };
}

function renderDayparts(shows) {
  const order = ["morning", "day", "evening", "late"];
  const grouped = new Map(order.map((key) => [key, []]));
  const meta = new Map();
  shows.forEach((show) => {
    const part = daypartFor(show);
    grouped.get(part.key).push(show);
    meta.set(part.key, part);
  });
  const defaults = {
    morning: { label: "Утро", range: "до 12:00" },
    day: { label: "День", range: "12:00–17:00" },
    evening: { label: "Вечер", range: "17:00–22:00" },
    late: { label: "Поздний", range: "после 22:00" }
  };
  $("daypart-grid").innerHTML = order.map((key) => {
    const items = grouped.get(key);
    const part = meta.get(key) || defaults[key];
    const occupancy = weightedOccupancy(items);
    const zone = zoneFor(occupancy);
    return `<article class="daypart"><div class="daypart__head"><b>${h(part.label)}</b><span>${h(part.range)}</span></div>
      <strong>${percent.format(occupancy)}%</strong><div class="daypart__meter"><i style="--meter:${Math.min(100, occupancy)}%;--meter-color:${zone.color}"></i></div>
      <small>${items.length} сеансов</small></article>`;
  }).join("");
}

function sessionRows(event) {
  const asOf = new Date(reportData.meta.generated_at);
  const pastFloor = new Date(asOf.getTime() - 7 * DAY_MS);
  return event.shows.filter((show) => {
    if (state.sessionState === "upcoming") return show.state === "upcoming";
    if (state.sessionState === "past") return show.state === "past" && new Date(show.start) >= pastFloor;
    return show.state === "upcoming" || new Date(show.start) >= pastFloor;
  });
}

function renderSessions(event) {
  const shows = sessionRows(event).sort((a, b) => {
    if (state.sessionState === "past") return new Date(b.start) - new Date(a.start);
    return new Date(a.start) - new Date(b.start);
  });
  $("sessions-caption").textContent = `${shows.length} сеансов · последние 7 дней и опубликованное будущее`;
  const head = `<div class="session-row session-row--head">${headerCell("Время", "session_time")}${headerCell("Кинотеатр / зал", "session_cinema")}${headerCell("Загрузка", "session_occupancy")}${headerCell("Продано", "session_sold")}${headerCell("Заполнение", "session_fill")}${headerCell("Состояние", "session_state")}<span></span></div>`;
  const rows = shows.map((show) => {
    const zone = zoneFor(show.sold_percent);
    return `<article class="session-row" role="button" tabindex="0" data-session-id="${show.id}" style="--zone-color:${zone.color}">
      <div class="session-time"><strong>${h(timeFormat.format(new Date(show.start)))}</strong><span>${h(dateFormat.format(new Date(show.start)))}</span></div>
      <div><strong>${h(show.cinema)}</strong><div class="session-meta">${h(show.auditorium)} · ${number.format(show.capacity)} мест</div></div>
      <div class="session-occupancy">${percent.format(show.sold_percent)}%</div>
      <div class="data-cell">${number.format(show.ticket_sold)}<small>из ${number.format(show.capacity)}</small></div>
      <div class="session-meter"><i style="--meter:${Math.min(100, show.sold_percent)}%"></i></div>
      <div class="session-status"><i></i>${h(zone.label)}</div>
      <div class="row-arrow">→</div>
    </article>`;
  }).join("");
  $("session-table").innerHTML = shows.length ? head + rows : `<div class="empty-state"><strong>Сеансов нет</strong><span>Переключи состояние сеансов.</span></div>`;
  document.querySelectorAll("[data-session-id]").forEach((row) => {
    const open = () => openSession(event.shows.find((show) => String(show.id) === row.dataset.sessionId));
    row.addEventListener("click", open);
    row.addEventListener("keydown", (eventKey) => {
      if (eventKey.key === "Enter" || eventKey.key === " ") { eventKey.preventDefault(); open(); }
    });
  });
}

function openSession(show) {
  if (!show) return;
  const zone = zoneFor(show.sold_percent);
  const drawer = $("session-drawer");
  drawer.style.cssText = `--signal-color:${zone.color};--signal-soft:var(--color-accent-soft)`;
  $("drawer-title").textContent = `${show.cinema} · ${timeFormat.format(new Date(show.start))}`;
  $("drawer-content").innerHTML = `<div class="drawer-summary">
    <div><span>Дата</span><strong>${h(dateFormat.format(new Date(show.start)))}</strong></div><div><span>Зал</span><strong>${h(show.auditorium)}</strong></div>
    <div><span>Продано</span><strong>${number.format(show.ticket_sold)} / ${number.format(show.capacity)}</strong></div><div><span>Загрузка</span><strong>${percent.format(show.sold_percent)}%</strong></div>
    <div><span>Сеанс</span><strong>#${show.id}</strong></div><div><span>Состояние</span><strong>${show.state === "upcoming" ? "Продажи идут" : "Завершен"}</strong></div>
  </div><div class="drawer-note"><span>${h(zone.label)}</span><p>${show.state === "upcoming" ? "Текущий выкуп на момент снимка SilverScreen." : "Финальная загрузка завершенного сеанса."}</p></div>
  <p class="snapshot-note">История изменения выкупа появится только после накопления нескольких снимков.</p>`;
  $("drawer-backdrop").hidden = false;
  drawer.inert = false;
  drawer.classList.add("is-open");
  drawer.setAttribute("aria-hidden", "false");
  $("close-drawer").focus();
}

function closeSession() {
  const drawer = $("session-drawer");
  drawer.classList.remove("is-open");
  drawer.setAttribute("aria-hidden", "true");
  drawer.inert = true;
  $("drawer-backdrop").hidden = true;
}

function openFilm(id) {
  const event = reportData.events.find((item) => String(item.id) === String(id));
  if (!event) return;
  closeSession();
  $("board-view").hidden = true;
  $("film-view").hidden = false;
  renderFilm(event);
  history.replaceState(null, "", `#film=${event.id}`);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openBoard() {
  state.currentFilm = null;
  closeSession();
  $("film-view").hidden = true;
  $("board-view").hidden = false;
  history.replaceState(null, "", location.pathname);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function bindFilmLinks() {
  document.querySelectorAll("[data-film-id]").forEach((element) => {
    const open = () => openFilm(element.dataset.filmId);
    element.addEventListener("click", open);
    element.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); }
    });
  });
}

function setupFilters() {
  $("cinema-filter").innerHTML = `<option value="">Вся сеть</option>${reportData.cinemas.map((cinema) => `<option value="${cinema.id}">${h(cinema.name)}</option>`).join("")}`;
  const bindings = [
    ["search-input", "input", (value) => { state.query = value; }],
    ["cinema-filter", "change", (value) => { state.cinema = value; }],
    ["week-filter", "change", (value) => { state.week = value; }],
    ["signal-filter", "change", (value) => { state.signal = value; }],
    ["sort-filter", "change", (value) => { state.sort = value; }]
  ];
  bindings.forEach(([id, eventName, update]) => $(id).addEventListener(eventName, (event) => { update(event.target.value); renderBoard(); }));
  document.querySelectorAll("[data-period]").forEach((button) => button.addEventListener("click", () => {
    state.period = button.dataset.period;
    document.querySelectorAll("[data-period]").forEach((item) => item.classList.toggle("is-active", item === button));
    renderBoard();
  }));
  $("reset-filters").addEventListener("click", () => {
    Object.assign(state, { cinema: "", week: "", signal: "", query: "", sort: "priority" });
    $("search-input").value = "";
    $("cinema-filter").value = "";
    $("week-filter").value = "";
    $("signal-filter").value = "";
    $("sort-filter").value = "priority";
    renderBoard();
  });
}

function setupFilmControls() {
  $("back-to-board").addEventListener("click", openBoard);
  document.querySelectorAll("[data-session-state]").forEach((button) => button.addEventListener("click", () => {
    state.sessionState = button.dataset.sessionState;
    document.querySelectorAll("[data-session-state]").forEach((item) => item.classList.toggle("is-active", item === button));
    if (state.currentFilm) renderSessions(state.currentFilm);
  }));
  $("close-drawer").addEventListener("click", closeSession);
  $("drawer-backdrop").addEventListener("click", closeSession);
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeSession(); });
}

function renderMeta() {
  const generated = new Date(reportData.meta.generated_at);
  $("freshness").querySelector("span").textContent = `Снимок ${updatedFormat.format(generated)}`;
  $("scope-line").textContent = `Сеть mooon · ${reportData.cinemas.length} кинотеатров · ${longDateFormat.format(generated)}`;
}

function renderFailure(error) {
  $("network-metrics").innerHTML = `<div class="empty-state"><strong>Не удалось загрузить снимок</strong><span>${h(error.message)}</span></div>`;
  $("portfolio-table").innerHTML = "";
  $("decision-list").innerHTML = "";
  $("freshness").classList.add("is-error");
  $("freshness").querySelector("span").textContent = "Ошибка загрузки";
}

async function init() {
  setupHelpTooltips();
  const response = await fetch(`${DATA_URL}?v=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  reportData = await response.json();
  renderMeta();
  renderCatalogTabs();
  setupFilters();
  setupFilmControls();
  renderBoard();
  const match = location.hash.match(/^#film=(\d+)$/);
  if (match) openFilm(match[1]);
}

init().catch(renderFailure);
