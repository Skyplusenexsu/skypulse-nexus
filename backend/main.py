from __future__ import annotations

import random
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, PlainTextResponse
from pydantic import BaseModel


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "skypulse.db"

DISTRICTS = [
    {"name": "浦江核心区", "x": 420, "y": 120, "zone": "Z-01", "active_drones": 436, "resilience": 0.91, "carbon": 1.36},
    {"name": "临港智造港", "x": 640, "y": 360, "zone": "Z-02", "active_drones": 508, "resilience": 0.88, "carbon": 1.44},
    {"name": "虹桥枢纽区", "x": 200, "y": 210, "zone": "Z-03", "active_drones": 472, "resilience": 0.87, "carbon": 1.34},
    {"name": "张江云谷", "x": 540, "y": 170, "zone": "Z-04", "active_drones": 523, "resilience": 0.89, "carbon": 1.42},
    {"name": "滨江金融带", "x": 470, "y": 245, "zone": "Z-05", "active_drones": 451, "resilience": 0.84, "carbon": 1.31},
    {"name": "苏河数创带", "x": 305, "y": 155, "zone": "Z-06", "active_drones": 428, "resilience": 0.86, "carbon": 1.29},
    {"name": "北外滩航运区", "x": 395, "y": 210, "zone": "Z-07", "active_drones": 446, "resilience": 0.82, "carbon": 1.28},
    {"name": "前滩会展区", "x": 505, "y": 310, "zone": "Z-08", "active_drones": 392, "resilience": 0.83, "carbon": 1.33},
    {"name": "大学创新圈", "x": 255, "y": 330, "zone": "Z-09", "active_drones": 338, "resilience": 0.8, "carbon": 1.22},
    {"name": "生态居住环", "x": 160, "y": 395, "zone": "Z-10", "active_drones": 302, "resilience": 0.79, "carbon": 1.18},
    {"name": "国际医疗港", "x": 618, "y": 220, "zone": "Z-11", "active_drones": 487, "resilience": 0.9, "carbon": 1.47},
    {"name": "智慧文旅岛", "x": 705, "y": 150, "zone": "Z-12", "active_drones": 368, "resilience": 0.81, "carbon": 1.26},
]

CORRIDORS = [
    {"name": "A1 医疗快线", "from": "国际医疗港", "to": "张江云谷", "mix": "医药与应急"},
    {"name": "A2 商务主航道", "from": "虹桥枢纽区", "to": "滨江金融带", "mix": "商务高时效"},
    {"name": "B1 跨江补给线", "from": "北外滩航运区", "to": "临港智造港", "mix": "补给与运力"},
    {"name": "B2 夜间配送线", "from": "生态居住环", "to": "浦江核心区", "mix": "夜间即时"},
    {"name": "C1 文旅观光线", "from": "智慧文旅岛", "to": "前滩会展区", "mix": "文旅消费"},
    {"name": "C2 枢纽接驳线", "from": "虹桥枢纽区", "to": "智慧文旅岛", "mix": "枢纽接驳"},
    {"name": "D1 冷链保障线", "from": "国际医疗港", "to": "临港智造港", "mix": "冷链专送"},
    {"name": "D2 应急抢修线", "from": "大学创新圈", "to": "滨江金融带", "mix": "应急抢修"},
]

SCENARIOS = {
    "baseline": {"name": "基线稳态", "load_boost": 1.0, "weather_boost": 1.0, "emergency_boost": 1.0},
    "storm": {"name": "天气扰动", "load_boost": 0.92, "weather_boost": 1.88, "emergency_boost": 1.35},
    "festival": {"name": "峰值保障", "load_boost": 1.24, "weather_boost": 1.08, "emergency_boost": 1.18},
}


class AlertCreate(BaseModel):
    district: str
    severity: str
    title: str
    detail: str


class ScenarioConfigCreate(BaseModel):
    scenario_id: str
    network_load: int
    weather_shock: int


app = FastAPI(title="SkyPulse Nexus API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def clamp(value: float, min_value: float, max_value: float) -> float:
    return max(min_value, min(max_value, value))


def init_db() -> None:
    DATA_DIR.mkdir(exist_ok=True)
    conn = get_conn()
    cur = conn.cursor()
    cur.executescript(
        """
        CREATE TABLE IF NOT EXISTS task_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_no TEXT UNIQUE NOT NULL,
            schedule_time TEXT NOT NULL,
            district TEXT NOT NULL,
            corridor TEXT NOT NULL,
            priority TEXT NOT NULL,
            status TEXT NOT NULL,
            eta_minutes REAL NOT NULL,
            risk_score REAL NOT NULL,
            payload_type TEXT NOT NULL,
            volume INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS alert_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_time TEXT NOT NULL,
            district TEXT NOT NULL,
            severity TEXT NOT NULL,
            title TEXT NOT NULL,
            detail TEXT NOT NULL,
            source TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS scenario_configs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            scenario_id TEXT NOT NULL,
            network_load INTEGER NOT NULL,
            weather_shock INTEGER NOT NULL,
            created_at TEXT NOT NULL
        );
        """
    )
    conn.commit()

    task_count = cur.execute("SELECT COUNT(*) FROM task_records").fetchone()[0]
    alert_count = cur.execute("SELECT COUNT(*) FROM alert_events").fetchone()[0]
    config_count = cur.execute("SELECT COUNT(*) FROM scenario_configs").fetchone()[0]
    if task_count == 0:
        seed_tasks(conn)
    if alert_count == 0:
        seed_alerts(conn)
    if config_count == 0:
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cur.execute(
            "INSERT INTO scenario_configs (scenario_id, network_load, weather_shock, created_at) VALUES (?, ?, ?, ?)",
            ("baseline", 100, 36, now),
        )
        conn.commit()
    conn.close()


def seed_tasks(conn: sqlite3.Connection) -> None:
    rand = random.Random(20260408)
    base_day = datetime.now().replace(minute=0, second=0, microsecond=0)
    base_day = base_day.replace(hour=0)
    priorities = ["P1", "P2", "P3"]
    statuses = ["待执行", "飞行中", "已完成", "复核中"]
    payloads = ["医药", "商务件", "冷链", "巡检设备", "即时零售"]

    tasks: list[tuple[Any, ...]] = []
    serial = 1
    for hour in range(24):
        commute = 1.35 if 7 <= hour <= 9 else 1.42 if 17 <= hour <= 20 else 1.0
        retail = 1.15 if 11 <= hour <= 13 else 1.0
        night = 0.52 if 1 <= hour <= 5 else 1.0
        count = int((18 + rand.randint(0, 8)) * commute * retail * night)
        for _ in range(count):
            district = rand.choice(DISTRICTS)
            corridor = rand.choice(CORRIDORS)
            minute = rand.randint(0, 59)
            schedule_time = (base_day + timedelta(hours=hour, minutes=minute)).strftime("%Y-%m-%d %H:%M:%S")
            base_risk = 18 + rand.random() * 38 + (15 if 15 <= hour <= 18 else 0)
            tasks.append(
                (
                    f"T{serial:05d}",
                    schedule_time,
                    district["name"],
                    corridor["name"],
                    rand.choice(priorities),
                    rand.choice(statuses),
                    round(7 + rand.random() * 8, 1),
                    round(base_risk, 1),
                    rand.choice(payloads),
                    rand.randint(60, 180),
                )
            )
            serial += 1

    conn.executemany(
        """
        INSERT INTO task_records
        (task_no, schedule_time, district, corridor, priority, status, eta_minutes, risk_score, payload_type, volume)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        tasks,
    )
    conn.commit()


def seed_alerts(conn: sqlite3.Connection) -> None:
    base_time = datetime.now().replace(second=0, microsecond=0)
    alerts = [
        ("浦江核心区", "high", "浦江核心区出现复合扰动", "网络负载和时段风险叠加，建议切换至高频调度模式。"),
        ("滨江金融带", "mid", "滨江金融带时延抬升", "通道 B2 出现阶段性拥堵，建议向 D2 倾斜运力。"),
        ("国际医疗港", "mid", "医疗任务密度提升", "医药与冷链任务并发增大，需要保障 A1 通道优先级。"),
        ("智慧文旅岛", "low", "文旅消费任务波动", "消费类任务处于上行阶段，建议维持当前配载。"),
    ]
    for idx, item in enumerate(alerts):
        event_time = (base_time - timedelta(minutes=idx * 18)).strftime("%Y-%m-%d %H:%M:%S")
        conn.execute(
            """
            INSERT INTO alert_events (event_time, district, severity, title, detail, source)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (event_time, item[0], item[1], item[2], item[3], "system"),
        )
    conn.commit()


def fetch_all_tasks() -> list[sqlite3.Row]:
    conn = get_conn()
    rows = conn.execute("SELECT * FROM task_records ORDER BY schedule_time ASC").fetchall()
    conn.close()
    return rows


def compute_dashboard(scenario_id: str, network_load: int, weather_shock: int) -> dict[str, Any]:
    scenario = SCENARIOS.get(scenario_id, SCENARIOS["baseline"])
    network_factor = network_load / 100
    weather_factor = 1 + weather_shock / 120

    tasks = fetch_all_tasks()
    district_lookup = {item["name"]: item for item in DISTRICTS}
    corridor_lookup = {item["name"]: item for item in CORRIDORS}

    hourly_rows: list[dict[str, Any]] = []
    for hour in range(24):
        hour_tasks = [row for row in tasks if datetime.fromisoformat(row["schedule_time"]).hour == hour]
        base_traffic = sum(row["volume"] for row in hour_tasks)
        base_risk = sum(row["risk_score"] for row in hour_tasks) / len(hour_tasks) if hour_tasks else 0
        hourly_rows.append(
            {
                "hour": hour,
                "traffic": round(base_traffic * scenario["load_boost"] * network_factor),
                "risk": round(base_risk * scenario["weather_boost"] * weather_factor / 1.28, 1),
                "energy": round(81 - (scenario["weather_boost"] - 1) * 4 - (network_factor - 1) * 6 - (0.2 if hour > 18 else 0), 1),
            }
        )

    district_stats: list[dict[str, Any]] = []
    for idx, district in enumerate(DISTRICTS):
        related = [row for row in tasks if row["district"] == district["name"]]
        demand = round(sum(row["volume"] for row in related) * scenario["load_boost"] * network_factor * (0.9 + (idx % 4) * 0.08))
        avg_task_risk = sum(row["risk_score"] for row in related) / len(related) if related else 22
        risk_score = round(avg_task_risk * scenario["weather_boost"] * weather_factor / 1.46, 1)
        pressure = round(demand / (district["active_drones"] * 26), 2)
        on_time_rate = round(max(82, 98 - risk_score / 8 - (network_factor - 1) * 8 + district["resilience"] * 4), 1)
        eta = round(8.5 + risk_score / 7 + pressure * 5, 1)
        alerts = max(1, round((risk_score / 10) * scenario["emergency_boost"]))
        status = "high" if risk_score >= 55 else "mid" if risk_score >= 36 else "low"
        district_stats.append(
            {
                **district,
                "demand": demand,
                "riskScore": risk_score,
                "pressure": pressure,
                "onTimeRate": on_time_rate,
                "eta": eta,
                "alerts": alerts,
                "status": status,
            }
        )

    corridor_stats: list[dict[str, Any]] = []
    for index, corridor in enumerate(CORRIDORS):
        related = [row for row in tasks if row["corridor"] == corridor["name"]]
        flow = round(sum(row["volume"] for row in related) * scenario["load_boost"] * network_factor * (0.9 + (index % 3) * 0.12))
        avg_delay = round((8 + index + weather_shock / 10.8 + (network_factor - 1) * 18), 1)
        closure = round(min(68, (6 + index * 2.8) * scenario["weather_boost"] + weather_shock / 3), 1)
        vitality = round(flow / 1000 - avg_delay * 1.7 + 50, 1)
        corridor_stats.append({**corridor, "flow": flow, "avgDelay": avg_delay, "closureProbability": closure, "vitality": vitality})
    corridor_stats.sort(key=lambda item: item["vitality"], reverse=True)

    total_traffic = sum(item["traffic"] for item in hourly_rows)
    avg_risk = round(sum(item["risk"] for item in hourly_rows) / len(hourly_rows), 1)
    avg_pressure = round(sum(item["pressure"] for item in district_stats) / len(district_stats), 2)
    system_on_time = round(sum(item["onTimeRate"] for item in district_stats) / len(district_stats), 1)
    peak_hour = max(hourly_rows, key=lambda item: item["traffic"])
    total_alerts = sum(item["alerts"] for item in district_stats)
    total_drones = sum(item["active_drones"] for item in district_stats)
    carbon_gain = round(sum(item["carbon"] for item in DISTRICTS) / len(DISTRICTS) * 12.8, 1)
    top_district = max(district_stats, key=lambda item: item["riskScore"])
    top_demand_district = max(district_stats, key=lambda item: item["demand"])
    top_corridor = corridor_stats[0]
    top_risk_hour = max(hourly_rows, key=lambda item: item["risk"])

    conn = get_conn()
    alert_rows = conn.execute(
        "SELECT id, event_time, district, severity, title, detail, source FROM alert_events ORDER BY event_time DESC LIMIT 8"
    ).fetchall()
    latest_config = conn.execute(
        "SELECT scenario_id, network_load, weather_shock, created_at FROM scenario_configs ORDER BY id DESC LIMIT 1"
    ).fetchone()
    conn.close()

    events = [
        {
            "id": row["id"],
            "time": datetime.fromisoformat(row["event_time"]).strftime("%H:%M"),
            "severity": row["severity"],
            "title": row["title"],
            "detail": row["detail"],
            "district": row["district"],
            "source": row["source"],
        }
        for row in alert_rows
    ]

    matrix_hours = [6, 9, 12, 15, 18, 21]
    demand_matrix = []
    for row_index, district in enumerate(district_stats[:6]):
        values = []
        for col_index, hour in enumerate(matrix_hours):
            pulse = hourly_rows[hour]["traffic"] / 1000
            values.append(round(district["demand"] / 900 + pulse * (0.86 + col_index * 0.08) + row_index * 1.8, 1))
        demand_matrix.append({"label": district["name"][:4], "values": values})

    heatmap = []
    heat_labels = ["06h", "09h", "12h", "15h", "18h", "21h"]
    for idx, label in enumerate(heat_labels):
        values = [round(district["pressure"] * 32 + idx * 4 + col * 2, 1) for col, district in enumerate(district_stats[:6])]
        heatmap.append({"label": label, "values": values})

    capability = {
        "安全": round(clamp(100 - avg_risk, 36, 96), 1),
        "效率": system_on_time,
        "韧性": round(clamp(92 - avg_pressure * 10, 35, 94), 1),
        "绿色": round(carbon_gain * 4.5, 1),
        "响应": round(clamp(100 - top_district["eta"] * 4.2, 30, 94), 1),
        "协同": round(clamp(76 + network_load / 6 - weather_shock / 7, 32, 95), 1),
    }

    pulse_items = [
        {"label": "空域吞吐", "value": round(clamp(total_traffic / 4000, 18, 98), 1)},
        {"label": "气象扰动", "value": round(clamp(weather_shock * 0.92, 8, 98), 1)},
        {"label": "运力余量", "value": round(clamp(100 - avg_pressure * 32, 12, 95), 1)},
        {"label": "事件耦合", "value": round(clamp(total_alerts * 4.6, 10, 98), 1)},
        {"label": "策略强度", "value": round(clamp(network_load * 0.72, 22, 98), 1)},
    ]

    fleet_series = [
        {"label": "主航道", "values": [6, 10, 14, 18, 24, 27, 22, 18, 16, 20, 24, 27, 23, 18], "tail": "A"},
        {"label": "补给线", "values": [5, 8, 12, 16, 21, 20, 18, 14, 16, 19, 22, 21, 18, 13], "tail": "B"},
        {"label": "应急线", "values": [4, 7, 9, 12, 18, 22, 25, 21, 18, 15, 13, 16, 19, 22], "tail": "C"},
        {"label": "夜航线", "values": [3, 4, 6, 8, 12, 16, 19, 22, 24, 21, 18, 14, 10, 6], "tail": "D"},
    ]

    predictions = [
        {"title": "需求增幅", "value": f"{network_load / 3.2:.1f}%", "desc": "未来 2 小时订单热度变化", "note": f"热点区 {top_demand_district['name']}"},
        {"title": "风险峰值", "value": f"{top_risk_hour['hour']:02d}:00", "desc": "脉冲最高时段", "note": "建议提前切换调度策略"},
        {"title": "拥堵通道", "value": top_corridor["name"], "desc": "综合活力与延迟后的高压通道", "note": f"延迟 {top_corridor['avgDelay']} 分钟"},
        {"title": "恢复韧性", "value": f"{max(88, 101 - avg_risk / 2):.1f}%", "desc": "异常后的预计恢复水平", "note": "适用于高压场景联动"},
    ]

    return {
        "meta": {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "scenario_id": scenario_id,
            "scenario_name": scenario["name"],
            "network_load": network_load,
            "weather_shock": weather_shock,
            "sample_size": round(total_traffic * 118),
        },
        "overview": {
            "totalTraffic": total_traffic,
            "avgRisk": avg_risk,
            "avgPressure": avg_pressure,
            "systemOnTime": system_on_time,
            "totalAlerts": total_alerts,
            "totalDrones": total_drones,
            "carbonGain": carbon_gain,
        },
        "peakHour": peak_hour,
        "topDistrict": top_district,
        "topCorridor": top_corridor,
        "hourly": hourly_rows,
        "districtStats": district_stats,
        "corridorStats": corridor_stats,
        "events": events,
        "demandMatrix": demand_matrix,
        "heatmap": heatmap,
        "capability": capability,
        "pulseItems": pulse_items,
        "fleetSeries": fleet_series,
        "predictions": predictions,
        "latestConfig": dict(latest_config) if latest_config else None,
    }


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/dashboard")
def dashboard(
    scenario: str = Query("baseline"),
    network_load: int = Query(100, ge=70, le=145),
    weather_shock: int = Query(36, ge=0, le=100),
) -> dict[str, Any]:
    return compute_dashboard(scenario, network_load, weather_shock)


@app.get("/api/tasks")
def tasks(limit: int = Query(12, ge=1, le=50), district: Optional[str] = None) -> dict[str, Any]:
    conn = get_conn()
    params: list[Any] = []
    sql = """
        SELECT task_no, schedule_time, district, corridor, priority, status, eta_minutes, risk_score, payload_type, volume
        FROM task_records
    """
    if district:
        sql += " WHERE district = ?"
        params.append(district)
    sql += " ORDER BY schedule_time DESC LIMIT ?"
    params.append(limit)
    rows = conn.execute(sql, params).fetchall()
    count = conn.execute("SELECT COUNT(*) FROM task_records").fetchone()[0]
    conn.close()
    return {
        "total": count,
        "items": [
            {
                "taskNo": row["task_no"],
                "scheduleTime": row["schedule_time"],
                "district": row["district"],
                "corridor": row["corridor"],
                "priority": row["priority"],
                "status": row["status"],
                "etaMinutes": row["eta_minutes"],
                "riskScore": row["risk_score"],
                "payloadType": row["payload_type"],
                "volume": row["volume"],
            }
            for row in rows
        ],
    }


@app.get("/api/alerts")
def alerts(limit: int = Query(12, ge=1, le=50)) -> dict[str, Any]:
    conn = get_conn()
    rows = conn.execute(
        "SELECT id, event_time, district, severity, title, detail, source FROM alert_events ORDER BY event_time DESC LIMIT ?",
        (limit,),
    ).fetchall()
    conn.close()
    return {
        "items": [
            {
                "id": row["id"],
                "eventTime": row["event_time"],
                "district": row["district"],
                "severity": row["severity"],
                "title": row["title"],
                "detail": row["detail"],
                "source": row["source"],
            }
            for row in rows
        ]
    }


@app.post("/api/alerts")
def create_alert(payload: AlertCreate) -> dict[str, Any]:
    if payload.severity not in {"low", "mid", "high"}:
        raise HTTPException(status_code=400, detail="severity must be low, mid, or high")
    event_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn = get_conn()
    cur = conn.execute(
        "INSERT INTO alert_events (event_time, district, severity, title, detail, source) VALUES (?, ?, ?, ?, ?, ?)",
        (event_time, payload.district, payload.severity, payload.title, payload.detail, "manual"),
    )
    conn.commit()
    conn.close()
    return {"id": cur.lastrowid, "message": "created"}


@app.get("/api/system/summary")
def system_summary() -> dict[str, Any]:
    conn = get_conn()
    task_total = conn.execute("SELECT COUNT(*) FROM task_records").fetchone()[0]
    alert_total = conn.execute("SELECT COUNT(*) FROM alert_events").fetchone()[0]
    latest_config = conn.execute(
        "SELECT scenario_id, network_load, weather_shock, created_at FROM scenario_configs ORDER BY id DESC LIMIT 1"
    ).fetchone()
    conn.close()
    return {
        "taskTotal": task_total,
        "alertTotal": alert_total,
        "districtTotal": len(DISTRICTS),
        "corridorTotal": len(CORRIDORS),
        "latestConfig": dict(latest_config) if latest_config else None,
    }


@app.post("/api/scenario-config")
def save_scenario_config(payload: ScenarioConfigCreate) -> dict[str, Any]:
    if payload.scenario_id not in SCENARIOS:
        raise HTTPException(status_code=400, detail="unknown scenario")
    created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn = get_conn()
    cur = conn.execute(
        "INSERT INTO scenario_configs (scenario_id, network_load, weather_shock, created_at) VALUES (?, ?, ?, ?)",
        (payload.scenario_id, payload.network_load, payload.weather_shock, created_at),
    )
    conn.commit()
    conn.close()
    return {"id": cur.lastrowid, "message": "saved"}


@app.get("/api/scenario-config/latest")
def latest_scenario_config() -> dict[str, Any]:
    conn = get_conn()
    row = conn.execute(
        "SELECT scenario_id, network_load, weather_shock, created_at FROM scenario_configs ORDER BY id DESC LIMIT 1"
    ).fetchone()
    conn.close()
    return {"item": dict(row) if row else None}


@app.get("/api/export/report")
def export_report(
    scenario: str = Query("baseline"),
    network_load: int = Query(100, ge=70, le=145),
    weather_shock: int = Query(36, ge=0, le=100),
) -> PlainTextResponse:
    data = compute_dashboard(scenario, network_load, weather_shock)
    report = (
        "SkyPulse Nexus 运行报告\n"
        f"生成时间：{data['meta']['timestamp']}\n"
        f"场景：{data['meta']['scenario_name']}\n"
        f"网络负载：{network_load}%\n"
        f"天气扰动：{weather_shock}\n"
        f"全网任务量：{data['overview']['totalTraffic']}\n"
        f"系统准点率：{data['overview']['systemOnTime']}%\n"
        f"风险脉冲均值：{data['overview']['avgRisk']}\n"
        f"关键通道：{data['topCorridor']['name']}\n"
        f"高风险城区：{data['topDistrict']['name']}\n"
        f"告警总量：{data['overview']['totalAlerts']}\n"
    )
    headers = {"Content-Disposition": "attachment; filename=skypulse-report.txt"}
    return PlainTextResponse(report, headers=headers)


@app.get("/", include_in_schema=False)
def index() -> FileResponse:
    return FileResponse(BASE_DIR / "index.html")


@app.get("/index.html", include_in_schema=False)
def index_html() -> FileResponse:
    return FileResponse(BASE_DIR / "index.html")


@app.get("/styles.css", include_in_schema=False)
def styles() -> FileResponse:
    return FileResponse(BASE_DIR / "styles.css")


@app.get("/app.js", include_in_schema=False)
def script() -> FileResponse:
    return FileResponse(BASE_DIR / "app.js")
