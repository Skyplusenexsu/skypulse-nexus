const DISTRICT_LAYOUT = [
  { name: "浦江核心区", x: 420, y: 120 },
  { name: "临港智造港", x: 640, y: 360 },
  { name: "虹桥枢纽区", x: 200, y: 210 },
  { name: "张江云谷", x: 540, y: 170 },
  { name: "滨江金融带", x: 470, y: 245 },
  { name: "苏河数创带", x: 305, y: 155 },
  { name: "北外滩航运区", x: 395, y: 210 },
  { name: "前滩会展区", x: 505, y: 310 },
  { name: "大学创新圈", x: 255, y: 330 },
  { name: "生态居住环", x: 160, y: 395 },
  { name: "国际医疗港", x: 618, y: 220 },
  { name: "智慧文旅岛", x: 705, y: 150 }
];

const CORRIDOR_LINKS = [
  { from: "国际医疗港", to: "张江云谷", mix: "医药与应急" },
  { from: "虹桥枢纽区", to: "滨江金融带", mix: "商务高时效" },
  { from: "北外滩航运区", to: "临港智造港", mix: "补给与运力" },
  { from: "生态居住环", to: "浦江核心区", mix: "夜间即时" },
  { from: "智慧文旅岛", to: "前滩会展区", mix: "文旅消费" },
  { from: "虹桥枢纽区", to: "智慧文旅岛", mix: "枢纽接驳" },
  { from: "国际医疗港", to: "临港智造港", mix: "冷链专送" },
  { from: "大学创新圈", to: "滨江金融带", mix: "应急抢修" }
];

const ARCHITECTURE_LAYERS = [
  { tag: "L1", title: "数据采集层", desc: "接入飞行任务、天气扰动、空域状态、订单需求和异常事件等多源输入。" },
  { tag: "L2", title: "分析引擎层", desc: "进行任务节律统计、风险评分、容量压力估计与预测指标生成。" },
  { tag: "L3", title: "策略服务层", desc: "输出场景重算、关键通道排序、调度建议和告警联动结果。" },
  { tag: "L4", title: "可视交互层", desc: "以指挥台、空域网络、热力矩阵和管理后台统一呈现。" }
];

const WORKFLOW_STEPS = [
  { title: "1. 数据接入", desc: "后端自动生成与维护飞行任务、异常事件和场景配置数据。" },
  { title: "2. 指标演算", desc: "分析服务按场景参数重算风险、准点率、运力压力和时段热区。" },
  { title: "3. 管理动作", desc: "支持新增告警、保存配置、浏览任务记录和导出运行报告。" },
  { title: "4. 可视输出", desc: "前端通过 API 拉取数据并驱动空域网络、图表和业务管理模块。" }
];

const STACK_CARDS = [
  { title: "前端层", desc: "原生 HTML / CSS / JavaScript 驱动高密度驾驶舱与业务页面。" },
  { title: "服务层", desc: "FastAPI 提供任务、告警、配置、分析与导出接口。" },
  { title: "存储层", desc: "SQLite 落地任务记录、告警事件和场景配置，实现历史可追溯。" },
  { title: "分析层", desc: "围绕低空经济场景完成趋势分析、风险评分与预测矩阵生成。" }
];

const EXECUTION_PATH = [
  { title: "载入实时态势", desc: "前端请求 /api/dashboard 装载当前场景下的总览与分析数据。" },
  { title: "观察任务与风险", desc: "结合任务表、通道排行和热力矩阵快速定位运行瓶颈。" },
  { title: "调整并保存参数", desc: "通过滑块与配置保存接口固化新的推演参数。" },
  { title: "新增告警并导出结果", desc: "通过表单写入异常记录，再导出当前运行报告形成闭环。" }
];

const SCENARIOS = [
  { id: "baseline", name: "基线稳态", description: "常规工作日网络，任务峰值集中在通勤与午间。" },
  { id: "storm", name: "天气扰动", description: "风切变增强，局部通道限速，系统进入避让模式。" },
  { id: "festival", name: "峰值保障", description: "文旅与商圈热区抬升，系统偏向高频弹性运力。" }
];

const state = {
  scenario: "baseline",
  networkLoad: 100,
  weatherShock: 36,
  districtFilter: ""
};

const sidebarStats = document.querySelector("#sidebarStats");
const orbitalView = document.querySelector("#orbitalView");
const flowTicker = document.querySelector("#flowTicker");
const heroMetrics = document.querySelector("#heroMetrics");
const gaugeCluster = document.querySelector("#gaugeCluster");
const demandMatrix = document.querySelector("#demandMatrix");
const radarView = document.querySelector("#radarView");
const pulseGrid = document.querySelector("#pulseGrid");
const scenarioChips = document.querySelector("#scenarioChips");
const airspaceMap = document.querySelector("#airspaceMap");
const eventFeed = document.querySelector("#eventFeed");
const trafficBars = document.querySelector("#trafficBars");
const riskLine = document.querySelector("#riskLine");
const pressureHeatmap = document.querySelector("#pressureHeatmap");
const predictionCards = document.querySelector("#predictionCards");
const corridorRanking = document.querySelector("#corridorRanking");
const fleetPulse = document.querySelector("#fleetPulse");
const districtCards = document.querySelector("#districtCards");
const architectureLayersEl = document.querySelector("#architectureLayers");
const workflowStepsEl = document.querySelector("#workflowSteps");
const stackCardsEl = document.querySelector("#stackCards");
const useCaseTimelineEl = document.querySelector("#useCaseTimeline");
const aiSuggestion = document.querySelector("#aiSuggestion");
const networkLoadInput = document.querySelector("#networkLoad");
const weatherShockInput = document.querySelector("#weatherShock");
const networkLoadLabel = document.querySelector("#networkLoadLabel");
const weatherShockLabel = document.querySelector("#weatherShockLabel");
const peakHourLabel = document.querySelector("#peakHourLabel");
const riskAverageLabel = document.querySelector("#riskAverageLabel");
const timestampLabel = document.querySelector("#timestampLabel");
const systemSummaryCards = document.querySelector("#systemSummaryCards");
const latestConfigCard = document.querySelector("#latestConfigCard");
const taskTableBody = document.querySelector("#taskTableBody");
const alertRecordList = document.querySelector("#alertRecordList");
const taskDistrictFilter = document.querySelector("#taskDistrictFilter");
const alertDistrict = document.querySelector("#alertDistrict");
const alertSeverity = document.querySelector("#alertSeverity");
const alertTitle = document.querySelector("#alertTitle");
const alertDetail = document.querySelector("#alertDetail");
const alertForm = document.querySelector("#alertForm");
const saveConfigBtn = document.querySelector("#saveConfigBtn");
const exportReportBtn = document.querySelector("#exportReportBtn");
const refreshTasksBtn = document.querySelector("#refreshTasksBtn");
const focusView = new URLSearchParams(window.location.search).get("focus");

function formatNumber(num) {
  return Number(num).toLocaleString("zh-CN");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

function renderScenarioChips() {
  scenarioChips.innerHTML = SCENARIOS.map((scenario) => `
    <div class="scenario-chip ${state.scenario === scenario.id ? "active" : ""}" data-id="${scenario.id}">
      <strong>${scenario.name}</strong>
      <span>${scenario.description}</span>
    </div>
  `).join("");

  scenarioChips.querySelectorAll(".scenario-chip").forEach((el) => {
    el.addEventListener("click", async () => {
      state.scenario = el.dataset.id;
      await refreshDashboard();
    });
  });
}

function renderSidebar(summary, overview) {
  const items = [
    { label: "任务总数", value: summary.taskTotal },
    { label: "事件总数", value: summary.alertTotal },
    { label: "区域节点", value: summary.districtTotal },
    { label: "关键通道", value: summary.corridorTotal }
  ];
  sidebarStats.innerHTML = items.map((item) => `
    <div class="sidebar-stat">
      <span>${item.label}</span>
      <strong>${formatNumber(item.value)}</strong>
    </div>
  `).join("");
}

function renderHeroMetrics(overview) {
  const items = [
    { label: "飞行任务量", value: `${(overview.totalTraffic / 10000).toFixed(1)}万`, desc: "日级网络吞吐" },
    { label: "系统准点率", value: `${overview.systemOnTime}%`, desc: "联动调度结果" },
    { label: "风险脉冲值", value: overview.avgRisk, desc: "综合扰动强度" },
    { label: "平均容量压强", value: overview.avgPressure, desc: "区域运力负载" }
  ];
  heroMetrics.innerHTML = items.map((item) => `
    <article class="metric-card">
      <span>${item.label}</span>
      <strong>${item.value}</strong>
      <p>${item.desc}</p>
    </article>
  `).join("");
}

function gaugeSvg(value, color) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const ratio = clamp(value, 0, 100) / 100;
  const offset = circumference * (1 - ratio);
  return `
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="60" r="${radius}" stroke="rgba(255,255,255,0.06)" stroke-width="10" fill="none"></circle>
      <circle cx="60" cy="60" r="${radius}" stroke="${color}" stroke-width="10" fill="none"
        stroke-linecap="round" transform="rotate(-90 60 60)"
        stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"></circle>
      <text x="60" y="67" text-anchor="middle" fill="#edf7ff" font-size="24" font-family="Bahnschrift">${Math.round(value)}</text>
    </svg>
  `;
}

function renderGauges(data) {
  const items = [
    { label: "准点", value: data.overview.systemOnTime, color: "#67dcff" },
    { label: "绿色", value: data.overview.carbonGain * 4.2, color: "#69f1cb" },
    { label: "韧性", value: 100 - data.overview.avgRisk, color: "#f6c56e" }
  ];
  gaugeCluster.innerHTML = items.map((item) => `
    <div class="gauge-card">
      ${gaugeSvg(item.value, item.color)}
      <span>${item.label}</span>
      <strong>${item.value.toFixed(1)}</strong>
    </div>
  `).join("");
}

function renderTicker(data) {
  const items = [
    { label: "高风险城区", value: data.topDistrict.name },
    { label: "关键通道", value: data.topCorridor.name },
    { label: "峰值时段", value: `${String(data.peakHour.hour).padStart(2, "0")}:00` },
    { label: "当前场景", value: data.meta.scenario_name }
  ];
  flowTicker.innerHTML = items.map((item) => `
    <div class="ticker-card">
      <span>${item.label}</span>
      <strong>${item.value}</strong>
    </div>
  `).join("");
}

function renderOrbital(data) {
  const rings = [80, 130, 182];
  const nodes = data.districtStats.slice(0, 8).map((district, index) => {
    const angle = (Math.PI * 2 / 8) * index - Math.PI / 2;
    const radius = rings[index % 3];
    const x = 260 + Math.cos(angle) * radius;
    const y = 200 + Math.sin(angle) * radius;
    const fill = district.status === "high" ? "#ff8f8f" : district.status === "mid" ? "#f6c56e" : "#69f1cb";
    return `
      <g>
        <circle cx="${x}" cy="${y}" r="14" fill="${fill}" opacity="0.92"></circle>
        <circle cx="${x}" cy="${y}" r="24" fill="none" stroke="rgba(103,220,255,0.14)"></circle>
        <text x="${x + 18}" y="${y - 4}" fill="#edf7ff" font-size="12">${district.name}</text>
        <text x="${x + 18}" y="${y + 12}" fill="#8ca8c2" font-size="11">R ${district.riskScore}</text>
      </g>
    `;
  }).join("");

  const arcs = data.corridorStats.slice(0, 6).map((corridor, index) => {
    const r = 68 + index * 20;
    const start = 20 + index * 28;
    const end = start + 140;
    return `<path d="M ${260 + r * Math.cos(start * Math.PI / 180)} ${200 + r * Math.sin(start * Math.PI / 180)}
      A ${r} ${r} 0 0 1 ${260 + r * Math.cos(end * Math.PI / 180)} ${200 + r * Math.sin(end * Math.PI / 180)}"
      fill="none" stroke="${index % 2 === 0 ? "rgba(103,220,255,0.72)" : "rgba(246,197,110,0.72)"}" stroke-width="3"/>`;
  }).join("");

  orbitalView.innerHTML = `
    <svg viewBox="0 0 520 400">
      <defs>
        <radialGradient id="coreGlow" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stop-color="rgba(103,220,255,0.28)"></stop>
          <stop offset="100%" stop-color="rgba(103,220,255,0)"></stop>
        </radialGradient>
      </defs>
      <rect width="520" height="400" fill="url(#coreGlow)"></rect>
      ${rings.map((r) => `<circle cx="260" cy="200" r="${r}" fill="none" stroke="rgba(103,220,255,0.12)"></circle>`).join("")}
      <circle cx="260" cy="200" r="28" fill="#67dcff" opacity="0.86"></circle>
      <circle cx="260" cy="200" r="48" fill="none" stroke="rgba(246,197,110,0.24)"></circle>
      ${arcs}
      ${nodes}
    </svg>
  `;
}

function colorScale(value, max, hue = "cyan") {
  const ratio = clamp(value / max, 0.08, 1);
  if (hue === "gold") return `rgba(246, 197, 110, ${0.14 + ratio * 0.72})`;
  return `rgba(103, 220, 255, ${0.12 + ratio * 0.76})`;
}

function renderDemandMatrix(matrixData) {
  const max = Math.max(...matrixData.flatMap((row) => row.values));
  demandMatrix.innerHTML = matrixData.map((row) => `
    <div class="matrix-row">
      <div class="matrix-label">${row.label}</div>
      ${row.values.map((value) => `
        <div class="matrix-cell" data-value="${value}" style="background:${colorScale(value, max)}"></div>
      `).join("")}
    </div>
  `).join("");
}

function renderRadar(capability) {
  const entries = Object.entries(capability);
  const width = 300;
  const height = 250;
  const cx = 150;
  const cy = 125;
  const radius = 88;

  const levels = [0.25, 0.5, 0.75, 1].map((level) => {
    const pts = entries.map((_, index) => {
      const angle = (Math.PI * 2 / entries.length) * index - Math.PI / 2;
      return `${cx + Math.cos(angle) * radius * level},${cy + Math.sin(angle) * radius * level}`;
    }).join(" ");
    return `<polygon points="${pts}" fill="none" stroke="rgba(255,255,255,0.08)"></polygon>`;
  }).join("");

  const valuePoints = entries.map(([_, value], index) => {
    const angle = (Math.PI * 2 / entries.length) * index - Math.PI / 2;
    const r = radius * clamp(value, 0, 100) / 100;
    return `${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`;
  }).join(" ");

  const labels = entries.map(([label], index) => {
    const angle = (Math.PI * 2 / entries.length) * index - Math.PI / 2;
    const x = cx + Math.cos(angle) * (radius + 24);
    const y = cy + Math.sin(angle) * (radius + 24);
    return `<text x="${x}" y="${y}" text-anchor="middle" fill="#8ca8c2" font-size="12">${label}</text>`;
  }).join("");

  radarView.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}">
      ${levels}
      ${entries.map((_, index) => {
        const angle = (Math.PI * 2 / entries.length) * index - Math.PI / 2;
        return `<line x1="${cx}" y1="${cy}" x2="${cx + Math.cos(angle) * radius}" y2="${cy + Math.sin(angle) * radius}" stroke="rgba(255,255,255,0.08)"></line>`;
      }).join("")}
      <polygon points="${valuePoints}" fill="rgba(103,220,255,0.24)" stroke="#67dcff" stroke-width="3"></polygon>
      ${labels}
    </svg>
  `;
}

function renderPulseGrid(items) {
  pulseGrid.innerHTML = items.map((item) => `
    <div class="pulse-item">
      <span>${item.label}</span>
      <div class="pulse-bar"><i style="width:${item.value}%"></i></div>
      <span>${Math.round(item.value)}</span>
    </div>
  `).join("");
}

function renderMap(districtStats) {
  const positionMap = Object.fromEntries(DISTRICT_LAYOUT.map((item) => [item.name, item]));
  const lines = CORRIDOR_LINKS.map((corridor) => {
    const from = positionMap[corridor.from];
    const to = positionMap[corridor.to];
    return `
      <line class="network-line" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}"></line>
      <line class="network-pulse" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}"></line>
    `;
  }).join("");

  const nodes = districtStats.map((district) => `
    <g>
      <circle class="map-ring" cx="${district.x}" cy="${district.y}" r="${district.status === "high" ? 28 : district.status === "mid" ? 24 : 20}"></circle>
      <circle class="map-${district.status === "high" ? "node-high" : district.status === "mid" ? "node-mid" : "node-low"}" cx="${district.x}" cy="${district.y}" r="${district.status === "high" ? 11 : 9}"></circle>
      <text class="map-label" x="${district.x + 16}" y="${district.y - 4}">${district.name}</text>
      <text class="map-sub" x="${district.x + 16}" y="${district.y + 14}">风险 ${district.riskScore} / 压力 ${district.pressure}</text>
    </g>
  `).join("");

  airspaceMap.innerHTML = `
    <svg viewBox="0 0 820 520">
      <g opacity="0.14">
        <path d="M40 110 C180 70, 230 160, 420 120 S640 110, 780 180" stroke="#9ecfff" fill="none"></path>
        <path d="M60 330 C180 260, 320 380, 510 310 S670 290, 780 360" stroke="#9ecfff" fill="none"></path>
        <path d="M150 420 C250 300, 420 260, 690 420" stroke="#9ecfff" fill="none"></path>
      </g>
      ${lines}
      ${nodes}
    </svg>
  `;
}

function renderEvents(items) {
  eventFeed.innerHTML = items.map((item) => `
    <article class="event-item">
      <div class="event-topline">
        <span class="event-time">${item.time}</span>
        <span class="priority ${item.severity}">${item.severity === "high" ? "高优先" : item.severity === "mid" ? "中优先" : "低优先"}</span>
      </div>
      <p><strong>${item.title}</strong></p>
      <p>${item.detail}</p>
    </article>
  `).join("");
}

function renderTraffic(hourly) {
  const max = Math.max(...hourly.map((row) => row.traffic));
  trafficBars.innerHTML = hourly.map((row) => {
    const height = Math.max(12, row.traffic / max * 220);
    return `<div class="bar-col" title="${String(row.hour).padStart(2, "0")}:00 ${formatNumber(row.traffic)}"><div class="bar" style="height:${height}px"></div></div>`;
  }).join("");
}

function renderRisk(hourly) {
  const width = 620;
  const height = 260;
  const max = Math.max(...hourly.map((row) => row.risk));
  const points = hourly.map((row, index) => {
    const x = index / (hourly.length - 1) * width;
    const y = height - (row.risk / max) * 210 - 18;
    return `${x},${y}`;
  }).join(" ");

  riskLine.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
      <defs>
        <linearGradient id="riskFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(246,197,110,0.42)"></stop>
          <stop offset="100%" stop-color="rgba(246,197,110,0.02)"></stop>
        </linearGradient>
      </defs>
      <g opacity="0.16">
        <line x1="0" y1="60" x2="${width}" y2="60" stroke="#8da9c4"></line>
        <line x1="0" y1="130" x2="${width}" y2="130" stroke="#8da9c4"></line>
        <line x1="0" y1="200" x2="${width}" y2="200" stroke="#8da9c4"></line>
      </g>
      <polygon points="0,260 ${points} ${width},260" fill="url(#riskFill)"></polygon>
      <polyline points="${points}" fill="none" stroke="#f6c56e" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></polyline>
      ${hourly.map((row, index) => {
        const x = index / (hourly.length - 1) * width;
        const y = height - (row.risk / max) * 210 - 18;
        return `<circle cx="${x}" cy="${y}" r="3.2" fill="#fff0cc"></circle>`;
      }).join("")}
    </svg>
  `;
}

function renderHeatmap(heatmap) {
  const max = Math.max(...heatmap.flatMap((row) => row.values));
  pressureHeatmap.innerHTML = heatmap.map((row) => `
    <div class="heat-row">
      <div class="heat-label">${row.label}</div>
      ${row.values.map((value) => `<div class="heat-cell" data-value="${value}" style="background:${colorScale(value, max, "gold")}"></div>`).join("")}
    </div>
  `).join("");
}

function renderPredictions(items) {
  predictionCards.innerHTML = items.map((item) => `
    <article class="prediction-card">
      <div class="prediction-topline">
        <div>
          <p class="mini-label">${item.title}</p>
          <strong>${item.value}</strong>
        </div>
      </div>
      <p>${item.desc}</p>
      <em>${item.note}</em>
    </article>
  `).join("");
}

function renderCorridors(items) {
  corridorRanking.innerHTML = items.slice(0, 6).map((item, index) => `
    <article class="ranking-item">
      <div class="rank-topline">
        <div>
          <p class="mini-label">TOP ${index + 1}</p>
          <strong>${item.name}</strong>
        </div>
        <span class="chip">${item.mix}</span>
      </div>
      <p>活力指数 ${item.vitality}，任务流量 ${formatNumber(item.flow)}，平均延迟 ${item.avgDelay} 分钟，封控概率 ${item.closureProbability}% 。</p>
    </article>
  `).join("");
}

function renderFleetPulse(items) {
  fleetPulse.innerHTML = items.map((item) => `
    <div class="fleet-row">
      <span>${item.label}</span>
      <div class="fleet-wave">
        ${item.values.map((value) => `<i style="height:${value}px"></i>`).join("")}
      </div>
      <span>${item.tail}</span>
    </div>
  `).join("");
}

function renderDistricts(items) {
  districtCards.innerHTML = items.map((item) => `
    <article class="district-card">
      <div class="district-topline">
        <div>
          <p class="mini-label">${item.zone}</p>
          <strong>${item.name}</strong>
        </div>
        <span class="priority ${item.status}">风险 ${item.riskScore}</span>
      </div>
      <p>需求总量 ${formatNumber(item.demand)} 单，建议 ETA ${item.eta} 分钟，当前容量压力 ${item.pressure}。</p>
      <div class="district-meta">
        <div><span>活跃无人机</span>${item.active_drones}</div>
        <div><span>准点率</span>${item.onTimeRate}%</div>
        <div><span>事件数</span>${item.alerts}</div>
        <div><span>碳效提升</span>${item.carbon}</div>
      </div>
    </article>
  `).join("");
}

function renderArchitecture() {
  architectureLayersEl.innerHTML = ARCHITECTURE_LAYERS.map((item) => `
    <article class="layer-card">
      <div class="layer-tag">${item.tag}</div>
      <div>
        <strong>${item.title}</strong>
        <p>${item.desc}</p>
      </div>
    </article>
  `).join("");

  workflowStepsEl.innerHTML = WORKFLOW_STEPS.map((item) => `
    <article class="workflow-card">
      <strong>${item.title}</strong>
      <p>${item.desc}</p>
    </article>
  `).join("");

  stackCardsEl.innerHTML = STACK_CARDS.map((item) => `
    <article class="stack-card">
      <strong>${item.title}</strong>
      <p>${item.desc}</p>
    </article>
  `).join("");

  useCaseTimelineEl.innerHTML = EXECUTION_PATH.map((item) => `
    <article class="timeline-item">
      <strong>${item.title}</strong>
      <p>${item.desc}</p>
    </article>
  `).join("");
}

function renderSuggestion(data) {
  aiSuggestion.innerHTML = `
    当前高压区域位于 <strong>${data.topDistrict.name}</strong>，
    建议优先向 <strong>${data.topCorridor.name}</strong> 倾斜容量。
    若在 <strong>${String(data.peakHour.hour).padStart(2, "0")}:00</strong> 前完成跨区协同，
    系统准点率可稳定在 <strong>${data.overview.systemOnTime}%</strong> 左右，并压低事件流强度。
  `;
}

function renderMeta(data) {
  networkLoadLabel.textContent = `${state.networkLoad}%`;
  weatherShockLabel.textContent = `${state.weatherShock}`;
  peakHourLabel.textContent = `峰值 ${String(data.peakHour.hour).padStart(2, "0")}:00`;
  riskAverageLabel.textContent = `均值 ${data.overview.avgRisk}`;
  timestampLabel.textContent = `样本 ${formatNumber(data.meta.sample_size)}`;
}

function renderSystemSummary(summary) {
  const items = [
    { label: "任务记录", value: summary.taskTotal },
    { label: "告警记录", value: summary.alertTotal },
    { label: "区域节点", value: summary.districtTotal },
    { label: "关键通道", value: summary.corridorTotal }
  ];
  systemSummaryCards.innerHTML = items.map((item) => `
    <div class="summary-card">
      <span>${item.label}</span>
      <strong>${formatNumber(item.value)}</strong>
    </div>
  `).join("");

  const config = summary.latestConfig;
  latestConfigCard.innerHTML = config ? `
    <p class="mini-label">Latest Config</p>
    <div>场景：<strong>${config.scenario_id}</strong></div>
    <div>网络负载：<strong>${config.network_load}%</strong></div>
    <div>天气扰动：<strong>${config.weather_shock}</strong></div>
    <div>保存时间：<strong>${config.created_at}</strong></div>
  ` : "暂无配置记录";
}

function renderTaskTable(items) {
  taskTableBody.innerHTML = items.map((item) => `
    <tr>
      <td>${item.taskNo}</td>
      <td>${item.scheduleTime}</td>
      <td>${item.district}</td>
      <td>${item.corridor}</td>
      <td>${item.priority}</td>
      <td>${item.status}</td>
      <td>${item.etaMinutes} min</td>
      <td>${item.riskScore}</td>
      <td>${item.payloadType}</td>
      <td>${item.volume}</td>
    </tr>
  `).join("");
}

function renderAlertRecords(items) {
  alertRecordList.innerHTML = items.map((item) => `
    <div class="record-item">
      <span>${item.eventTime} / ${item.district} / ${item.source}</span>
      <strong>${item.title}</strong>
      <p>${item.detail}</p>
    </div>
  `).join("");
}

function fillDistrictSelectors(districtStats) {
  const options = ['<option value="">全部城区</option>'].concat(
    districtStats.map((item) => `<option value="${item.name}">${item.name}</option>`)
  ).join("");
  taskDistrictFilter.innerHTML = options;
  taskDistrictFilter.value = state.districtFilter;

  alertDistrict.innerHTML = districtStats.map((item) => `<option value="${item.name}">${item.name}</option>`).join("");
}

function applyFocusMode() {
  if (!focusView) return;
  document.querySelectorAll(".screen").forEach((section) => {
    if (section.id !== focusView) section.remove();
  });
}

async function refreshDashboard() {
  const dashboard = await fetchJSON(`/api/dashboard?scenario=${state.scenario}&network_load=${state.networkLoad}&weather_shock=${state.weatherShock}`);
  const summary = await fetchJSON("/api/system/summary");

  renderScenarioChips();
  renderSidebar(summary, dashboard.overview);
  renderHeroMetrics(dashboard.overview);
  renderGauges(dashboard);
  renderTicker(dashboard);
  renderOrbital(dashboard);
  renderDemandMatrix(dashboard.demandMatrix);
  renderRadar(dashboard.capability);
  renderPulseGrid(dashboard.pulseItems);
  renderMap(dashboard.districtStats);
  renderEvents(dashboard.events);
  renderTraffic(dashboard.hourly);
  renderRisk(dashboard.hourly);
  renderHeatmap(dashboard.heatmap);
  renderPredictions(dashboard.predictions);
  renderCorridors(dashboard.corridorStats);
  renderFleetPulse(dashboard.fleetSeries);
  renderDistricts(dashboard.districtStats);
  renderArchitecture();
  renderSuggestion(dashboard);
  renderMeta(dashboard);
  renderSystemSummary(summary);
  fillDistrictSelectors(dashboard.districtStats);
}

async function refreshTasks() {
  const params = new URLSearchParams({ limit: "12" });
  if (state.districtFilter) params.set("district", state.districtFilter);
  const taskData = await fetchJSON(`/api/tasks?${params.toString()}`);
  renderTaskTable(taskData.items);
}

async function refreshAlerts() {
  const alertData = await fetchJSON("/api/alerts?limit=10");
  renderAlertRecords(alertData.items);
}

async function saveScenarioConfig() {
  await fetchJSON("/api/scenario-config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scenario_id: state.scenario,
      network_load: state.networkLoad,
      weather_shock: state.weatherShock
    })
  });
  await refreshDashboard();
}

async function createAlert(event) {
  event.preventDefault();
  const payload = {
    district: alertDistrict.value,
    severity: alertSeverity.value,
    title: alertTitle.value.trim(),
    detail: alertDetail.value.trim()
  };
  if (!payload.title || !payload.detail) {
    alert("请先填写告警标题和详情");
    return;
  }
  await fetchJSON("/api/alerts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  alertForm.reset();
  await Promise.all([refreshDashboard(), refreshAlerts()]);
}

function exportReport() {
  window.open(`/api/export/report?scenario=${state.scenario}&network_load=${state.networkLoad}&weather_shock=${state.weatherShock}`, "_blank");
}

networkLoadInput.addEventListener("input", async (event) => {
  state.networkLoad = Number(event.target.value);
  await refreshDashboard();
});

weatherShockInput.addEventListener("input", async (event) => {
  state.weatherShock = Number(event.target.value);
  await refreshDashboard();
});

taskDistrictFilter.addEventListener("change", async (event) => {
  state.districtFilter = event.target.value;
  await refreshTasks();
});

refreshTasksBtn.addEventListener("click", refreshTasks);
saveConfigBtn.addEventListener("click", saveScenarioConfig);
exportReportBtn.addEventListener("click", exportReport);
alertForm.addEventListener("submit", createAlert);

applyFocusMode();

Promise.all([refreshDashboard(), refreshTasks(), refreshAlerts()]).catch((error) => {
  console.error(error);
  alert("系统启动失败，请确认 FastAPI 服务已经启动。");
});
