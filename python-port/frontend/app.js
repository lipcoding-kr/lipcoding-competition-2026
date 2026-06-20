import { ALL_PHASES, LEVEL_CONFIG } from "./data.js";

const state = {
  level: null,
  phases: [],
  projectName: "",
  startDate: "",
  endDate: "",
  goal: "",
  started: false,
  backendStatus: "checking",
  backendMessage: "Loading backend response...",
};

const app = document.querySelector("#app");

const clonePhases = (phaseIds) =>
  ALL_PHASES.filter((phase) => phaseIds.includes(phase.id)).map((phase) => ({
    ...phase,
    steps: phase.steps.map((step) => ({ ...step, completed: false })),
  }));

const getEmoji = (percentage) => {
  if (percentage === 0) return "🥚";
  if (percentage < 25) return "🐣";
  if (percentage < 50) return "🐥";
  if (percentage < 75) return "🐔";
  if (percentage < 100) return "🦅";
  return "🏆";
};

const getMascotLabel = (percentage) => {
  if (percentage === 0) return "알";
  if (percentage < 25) return "병아리 탄생!";
  if (percentage < 50) return "아기 병아리";
  if (percentage < 75) return "성장한 닭";
  if (percentage < 100) return "날개를 펼친 독수리";
  return "전설의 개발자!";
};

const renderRing = (percentage) => {
  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  const color = percentage < 30 ? "#f59e0b" : percentage < 70 ? "#8b5cf6" : "#10b981";

  return `
    <div class="ring" aria-hidden="true">
      <svg viewBox="0 0 ${size} ${size}">
        <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" stroke="#e5e7eb" stroke-width="${strokeWidth}" fill="none"></circle>
        <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" stroke="${color}" stroke-width="${strokeWidth}" fill="none"
          stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" stroke-linecap="round"></circle>
      </svg>
      <div class="value">${percentage}%</div>
      <div class="label">완료</div>
    </div>
  `;
};

const getProgress = () => {
  const totalSteps = state.phases.reduce((acc, phase) => acc + phase.steps.length, 0);
  const completedSteps = state.phases.reduce(
    (acc, phase) => acc + phase.steps.filter((step) => step.completed).length,
    0,
  );
  const percentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  return { totalSteps, completedSteps, percentage };
};

const getMascotMessage = (percentage) => {
  if (!state.level) return "안녕! 나는 파일럿이야 🥚 레벨을 선택해줘!";
  if (!state.started) return "좋아! 프로젝트 정보를 입력해줘!";
  if (percentage === 0) return "알에서 깨어나려면 첫 단계를 체크해봐! 💪";
  if (percentage < 25) return "삐약! 태어났어! 계속 가보자~ 🐣";
  if (percentage < 50) return "날개가 자라고 있어! 대단해! 🐥";
  if (percentage < 75) return "이제 꽤 큰 닭이 됐어! 계속! 🐔";
  if (percentage < 100) return "독수리처럼 날아오를 준비! 거의 다 왔어! 🦅";
  return "전설이 됐어! 프로젝트 완성! 🏆🎊";
};

const getDday = () => {
  if (!state.endDate) return "D-0";
  const diff = Math.ceil((new Date(state.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? `D-${diff}` : `D+${Math.abs(diff)}`;
};

const getNextStep = () => {
  const phase = state.phases.find((item) => item.steps.some((step) => !step.completed));
  return phase?.steps.find((step) => !step.completed)?.title ?? "";
};

const renderLevelCards = () =>
  ["beginner", "intermediate", "advanced"]
    .map((level) => {
      const config = LEVEL_CONFIG[level];
      const selected = state.level === level;
      return `
        <button class="level-card ${level} ${selected ? "selected" : ""}" data-action="select-level" data-level="${level}">
          ${selected ? '<div class="selected-mark">✓</div>' : ""}
          <div class="level-emoji">${level === "beginner" ? "🌱" : level === "intermediate" ? "🌿" : "🌳"}</div>
          <div class="level-label">${config.label}</div>
          <p class="level-desc">${config.description}</p>
          <div class="level-meta">${config.phases.length}단계 여정</div>
        </button>
      `;
    })
    .join("");

const renderTimeline = () =>
  state.phases
    .map((phase, index) => {
      const completed = phase.steps.filter((step) => step.completed).length;
      const total = phase.steps.length;
      const progress = total ? Math.round((completed / total) * 100) : 0;
      const complete = completed === total;
      return `
        <article class="card phase">
          <div class="phase-head">
            <div class="phase-left">
              <div class="phase-emoji" style="background:${complete ? "#dcfce7" : "#fffbeb"}">${phase.emoji}</div>
              <div>
                <h3 class="phase-title">${index + 1}. ${phase.name}</h3>
                <p class="phase-sub">${completed}/${total} 완료</p>
              </div>
            </div>
            <div class="phase-progress">
              <div class="bar"><span style="width:${progress}%; ${complete ? "background:#10b981;" : ""}"></span></div>
              <strong>${progress}%</strong>
            </div>
          </div>
          <div class="phase-body">
            ${phase.steps
              .map(
                (step) => `
              <div class="step-row">
                <button class="step-btn ${step.completed ? "completed" : ""}" data-action="toggle-step" data-phase="${phase.id}" data-step="${step.id}">
                  <div class="check">${step.completed ? "✓" : ""}</div>
                  <div>
                    <p class="step-title">${step.title}</p>
                    <p class="step-desc">${step.description}</p>
                  </div>
                </button>
                <button class="guide-btn" title="${step.guide ?? ""}">?</button>
              </div>
            `,
              )
              .join("")}
          </div>
        </article>
      `;
    })
    .join("");

const render = () => {
  const { totalSteps, completedSteps, percentage } = getProgress();
  const levelConfig = state.level ? LEVEL_CONFIG[state.level] : null;
  const levelLabel = levelConfig?.label ?? "";
  const mascot = getEmoji(percentage);
  const mascotLabel = getMascotLabel(percentage);

  app.innerHTML = `
    <div class="shell">
      <header class="header">
        <div class="brand"><span>🐣</span><span>VibePilot</span></div>
        <button class="login-btn" type="button" aria-label="GitHub 로그인">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12C24 5.37 18.63 0 12 0z"/></svg>
          로그인
        </button>
      </header>

      <main class="main">
        <section class="hero">
          <div class="mascot-wrap">
            <div class="mascot ${state.started ? "sm" : "lg"}">${mascot}</div>
            ${percentage > 0 ? `<span class="badge">${mascotLabel}</span>` : ""}
            <div class="speech"><p>${getMascotMessage(percentage)}</p></div>
          </div>
          ${!state.level ? `
            <h1 class="hero-title">바이브 코딩, 체계적으로 관리하자!</h1>
            <p class="hero-subtitle">기획부터 배포까지, AI와 함께하는 프로젝트 여정</p>
          ` : ""}
        </section>

        <section class="status-strip">
          <div>
            <strong>Backend</strong>
            <span class="status-pill ${state.backendStatus === "ok" ? "ok" : state.backendStatus === "checking" ? "" : "err"}">
              ${state.backendStatus === "ok" ? "Connected" : state.backendStatus === "checking" ? "Checking..." : "Unavailable"}
            </span>
          </div>
          <div>${state.backendMessage}</div>
        </section>

        <section class="grid">
          ${!state.started ? `
            <div class="card card-pad">
              ${!state.level ? `
                <h2 class="section-title">나의 바이브 코딩 레벨은?</h2>
                <div class="levels">${renderLevelCards()}</div>
              ` : `
                <div class="selected-summary">
                  <div style="font-size: 1.7rem;">${state.level === "beginner" ? "🌱" : state.level === "intermediate" ? "🌿" : "🌳"}</div>
                  <strong>${levelLabel} 선택됨</strong>
                  <button class="change-btn" data-action="reset-level">변경</button>
                </div>
                <div class="form-grid">
                  <div>
                    <label class="field-label" for="projectName">프로젝트 이름</label>
                    <input class="field" id="projectName" value="${state.projectName}" placeholder="예: 나만의 Todo 앱" />
                  </div>
                  <div>
                    <label class="field-label" for="goal">🎯 목표</label>
                    <input class="field" id="goal" value="${state.goal}" placeholder="예: 3시간 안에 MVP 완성하기!" />
                  </div>
                  <div class="two-col">
                    <div>
                      <label class="field-label" for="startDate">📅 시작일</label>
                      <input type="date" class="date-field" id="startDate" value="${state.startDate}" />
                    </div>
                    <div>
                      <label class="field-label" for="endDate">🏁 마감일</label>
                      <input type="date" class="date-field" id="endDate" value="${state.endDate}" />
                    </div>
                  </div>
                </div>
                <div style="margin-top: 18px;">
                  <button class="start-btn" data-action="start-project" ${!state.projectName.trim() || !state.startDate || !state.endDate ? "disabled" : ""}>🚀 여정 시작하기!</button>
                </div>
              `}
            </div>
          ` : `
            <div class="dashboard">
              <section class="card card-pad">
                <div class="dashboard-top">
                  ${renderRing(percentage)}
                  <div>
                    <h2 class="project-title">${state.projectName}</h2>
                    <div class="meta-row">
                      <span class="chip level">${levelLabel}</span>
                      <span class="chip">${completedSteps}/${totalSteps} 단계 완료</span>
                    </div>
                    ${state.goal ? `<div class="goal">🎯 ${state.goal}</div>` : ""}
                    <div class="meta-row">
                      <span>📅 ${state.startDate} ~ ${state.endDate}</span>
                      <span class="chip deadline">${getDday()}</span>
                    </div>
                    <div class="next-step">${percentage === 100 ? "🎉 모든 단계를 완료했어요!" : `다음 할 일: ${getNextStep()}`}</div>
                  </div>
                </div>
              </section>
              <section class="timeline">${renderTimeline()}</section>
            </div>
          `}
        </section>
      </main>

      <footer class="footer">VibePilot © 2026 — 바이브 코딩을 더 스마트하게 🐥</footer>
    </div>
  `;

  app.querySelectorAll('[data-action="select-level"]').forEach((button) => {
    button.addEventListener("click", () => {
      const level = button.dataset.level;
      state.level = level;
      state.phases = clonePhases(LEVEL_CONFIG[level].phases);
      render();
    });
  });

  app.querySelectorAll('[data-action="toggle-step"]').forEach((button) => {
    button.addEventListener("click", () => {
      const { phase, step } = button.dataset;
      state.phases = state.phases.map((item) =>
        item.id === phase
          ? {
              ...item,
              steps: item.steps.map((entry) =>
                entry.id === step ? { ...entry, completed: !entry.completed } : entry,
              ),
            }
          : item,
      );
      render();
    });
  });

  const projectName = app.querySelector("#projectName");
  if (projectName) {
    projectName.addEventListener("input", (event) => {
      state.projectName = event.target.value;
      render();
    });
  }

  const goal = app.querySelector("#goal");
  if (goal) {
    goal.addEventListener("input", (event) => {
      state.goal = event.target.value;
      render();
    });
  }

  const startDate = app.querySelector("#startDate");
  if (startDate) {
    startDate.addEventListener("input", (event) => {
      state.startDate = event.target.value;
      render();
    });
  }

  const endDate = app.querySelector("#endDate");
  if (endDate) {
    endDate.addEventListener("input", (event) => {
      state.endDate = event.target.value;
      render();
    });
  }

  const resetLevel = app.querySelector('[data-action="reset-level"]');
  if (resetLevel) {
    resetLevel.addEventListener("click", () => {
      state.level = null;
      state.phases = [];
      state.started = false;
      state.projectName = "";
      state.startDate = "";
      state.endDate = "";
      state.goal = "";
      render();
    });
  }

  const startProject = app.querySelector('[data-action="start-project"]');
  if (startProject) {
    startProject.addEventListener("click", () => {
      if (state.level && state.projectName.trim() && state.startDate && state.endDate) {
        state.started = true;
        render();
      }
    });
  }
};

const loadBackend = async () => {
  try {
    const [healthResponse, messageResponse] = await Promise.all([
      fetch("/api/health"),
      fetch("/api/message"),
    ]);

    if (!healthResponse.ok || !messageResponse.ok) {
      throw new Error("API request failed");
    }

    const health = await healthResponse.json();
    const payload = await messageResponse.json();
    state.backendStatus = health.status === "ok" ? "ok" : "error";
    state.backendMessage = `${payload.title} — ${payload.message}`;
  } catch (error) {
    state.backendStatus = "error";
    state.backendMessage = error.message;
  } finally {
    render();
  }
};

render();
loadBackend();
