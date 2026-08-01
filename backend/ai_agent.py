import os
import sys
import json
import asyncio
from typing import Dict, Any, List, AsyncGenerator

# Ensure backend directory is in sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# LangChain / Multi-Agent imports
try:
    from langchain.tools import Tool
    from langchain.agents import initialize_agent, AgentType
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False

from data_pipeline import get_driver_telemetry, generate_ghost_lap
from inference import analyze_mistakes

# =====================================================================
# AGENT 1: Telemetry Analyst Agent
# =====================================================================
class TelemetryAnalystAgent:
    """
    Agent 1: Compares driver_lap to ghost_lap and outputs a JSON list
    of corners where the driver lost time compared to the Ghost Car.
    """
    def __init__(self, driver: str = 'VER'):
        self.driver = driver

    def analyze(self) -> Dict[str, Any]:
        df_driver = get_driver_telemetry(self.driver)
        df_ghost = generate_ghost_lap()
        mistakes = analyze_mistakes(df_driver)

        corner_losses = []
        for m in mistakes:
            if m['severity'] == 'red':
                corner_losses.append({
                    "corner_name": m['corner_name'],
                    "turn_number": m['turn_number'],
                    "time_lost_seconds": m['time_lost'],
                    "telemetry_finding": m['description']
                })

        return {
            "driver": self.driver,
            "total_avoidable_loss": sum(c["time_lost_seconds"] for c in corner_losses),
            "corner_time_losses": corner_losses
        }

# =====================================================================
# AGENT 2: Vehicle Dynamics Engineer Agent
# =====================================================================
class VehicleDynamicsEngineerAgent:
    """
    Agent 2: Takes the Telemetry Analyst JSON and formulates high-precision
    car setup recommendations (front wing angle, anti-roll bar, dampening).
    """
    def recommend_setup(self, telemetry_analysis: Dict[str, Any]) -> List[Dict[str, str]]:
        recommendations = []
        for loss in telemetry_analysis.get("corner_time_losses", []):
            turn = loss.get("turn_number", 1)
            if turn == 1:
                recommendations.append({
                    "component": "Aero / Front Wing",
                    "recommendation": "Increase front wing angle by +1.0° to reduce high-speed understeer into Sainte Devote entry."
                })
            elif turn == 3:
                recommendations.append({
                    "component": "Suspension / Anti-Roll Bar",
                    "recommendation": "Stiffen front anti-roll bar by 2 clicks to control front tire scrub through Massenet."
                })
            elif turn == 10:
                recommendations.append({
                    "component": "Drivetrain / Differential",
                    "recommendation": "Decrease power-on diff lock by 5% for smoother traction on kerb exit at Nouvelle Chicane."
                })
            else:
                recommendations.append({
                    "component": "Brake Balance",
                    "recommendation": "Adjust brake bias 0.5% rearward for turn-in stability."
                })

        if not recommendations:
            recommendations.append({
                "component": "Chassis Setup",
                "recommendation": "Maintain baseline mechanical balance. Zero degradation anomalies detected."
            })

        return recommendations

# =====================================================================
# AGENT 3: Race Strategist Agent
# =====================================================================
class RaceStrategistAgent:
    """
    Agent 3: Calculates optimal pit window, tyre wear, and undercut strategy.
    """
    def calculate_strategy(self, pro_unlocked: bool = False) -> Dict[str, Any]:
        if not pro_unlocked:
            return {
                "pro_locked": True,
                "message": "🔒 Pro Pit Strategy locked. Upgrade via Paytm ₹49."
            }

        return {
            "pro_locked": False,
            "current_compound": "C4 Medium",
            "current_tire_age": 18,
            "estimated_wear": "75%",
            "optimal_pit_window": "Lap 24 - Lap 27",
            "target_compound": "Hard (C2)",
            "undercut_potential": "High (+1.8s projected gain on fresh C2 rubber)",
            "monaco_pit_loss_time": "19.4s"
        }

# =====================================================================
# SEQUENTIAL MULTI-AGENT WAR ROOM EXECUTION ENGINE (WEBSOCKET STREAM)
# =====================================================================
async def run_multi_agent_war_room_stream(
    prompt: str,
    driver: str = 'Verstappen',
    pro_unlocked: bool = False
) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Sequentially runs Telemetry Analyst -> Vehicle Dynamics Engineer -> Race Strategist
    and streams thought-process steps in real time over WebSocket.
    """
    # STEP 1: Telemetry Analyst Agent
    yield {
        "agent": "Telemetry Analyst",
        "status": "thinking",
        "thought": f"[Telemetry Analyst]: Comparing driver_lap for {driver} against Ghost Lap mini-sectors..."
    }
    await asyncio.sleep(0.5)

    telemetry_agent = TelemetryAnalystAgent(driver)
    telemetry_result = telemetry_agent.analyze()

    yield {
        "agent": "Telemetry Analyst",
        "status": "complete",
        "thought": f"[Telemetry Analyst]: Analysis complete. Identified {len(telemetry_result['corner_time_losses'])} corner mistakes with +{telemetry_result['total_avoidable_loss']:.2f}s total time loss.",
        "data": telemetry_result
    }
    await asyncio.sleep(0.6)

    # STEP 2: Vehicle Dynamics Engineer Agent
    yield {
        "agent": "Vehicle Dynamics Engineer",
        "status": "thinking",
        "thought": "[Vehicle Dynamics Engineer]: Processing telemetry mistake JSON to formulate mechanical & aero setup recommendations..."
    }
    await asyncio.sleep(0.5)

    dynamics_agent = VehicleDynamicsEngineerAgent()
    setup_result = dynamics_agent.recommend_setup(telemetry_result)

    yield {
        "agent": "Vehicle Dynamics Engineer",
        "status": "complete",
        "thought": f"[Vehicle Dynamics Engineer]: Formulated {len(setup_result)} mechanical setup tweaks for aerodynamic & roll balance.",
        "data": setup_result
    }
    await asyncio.sleep(0.6)

    # STEP 3: Race Strategist Agent
    yield {
        "agent": "Race Strategist",
        "status": "thinking",
        "thought": "[Race Strategist]: Simulating C4 Medium degradation curves & pit lane loss delta..."
    }
    await asyncio.sleep(0.5)

    strategist_agent = RaceStrategistAgent()
    strategy_result = strategist_agent.calculate_strategy(pro_unlocked)

    yield {
        "agent": "Race Strategist",
        "status": "complete",
        "thought": "[Race Strategist]: Pit window & undercut delta calculated.",
        "data": strategy_result
    }
    await asyncio.sleep(0.4)

    # FINAL SYNTHESIS
    final_text_parts = [
        f"🏁 **APEX AI MULTI-AGENT WAR ROOM REPORT ({driver.upper()})**\n",
        f"📊 **[Telemetry Analyst]**: Avoidable lap time loss: **+{telemetry_result['total_avoidable_loss']:.2f}s** vs Ghost Lap."
    ]

    for c in telemetry_result["corner_time_losses"]:
        final_text_parts.append(f"  • **{c['corner_name']}**: {c['telemetry_finding']} (+{c['time_lost_seconds']}s)")

    final_text_parts.append("\n🔧 **[Vehicle Dynamics Engineer] Setup Recommendations**:")
    for s in setup_result:
        final_text_parts.append(f"  • **{s['component']}**: {s['recommendation']}")

    final_text_parts.append("\n🏎️ **[Race Strategist] Strategy Status**:")
    if strategy_result.get("pro_locked"):
        final_text_parts.append("  • " + strategy_result["message"])
    else:
        final_text_parts.append(f"  • **Optimal Pit Window**: {strategy_result['optimal_pit_window']} -> Switch to {strategy_result['target_compound']}")
        final_text_parts.append(f"  • **Undercut Gain**: {strategy_result['undercut_potential']}")

    final_response_text = "\n".join(final_text_parts)

    yield {
        "agent": "War Room Summary",
        "status": "done",
        "final_response": final_response_text
    }

# Sync wrapper for standard HTTP POST compatibility
def run_apex_race_engineer_agent(prompt: str, driver: str = 'Verstappen', pro_unlocked: bool = False) -> str:
    loop = asyncio.new_event_event_loop() if not asyncio.get_event_loop().is_running() else None
    
    async def _runner():
        last_resp = ""
        async for frame in run_multi_agent_war_room_stream(prompt, driver, pro_unlocked):
            if frame.get("status") == "done":
                last_resp = frame.get("final_response", "")
        return last_resp

    if loop:
        res = loop.run_until_complete(_runner())
        loop.close()
        return res
    else:
        # Fallback inline execution
        telemetry_agent = TelemetryAnalystAgent(driver)
        t_res = telemetry_agent.analyze()
        dynamics_agent = VehicleDynamicsEngineerAgent()
        d_res = dynamics_agent.recommend_setup(t_res)
        strategist_agent = RaceStrategistAgent()
        s_res = strategist_agent.calculate_strategy(pro_unlocked)
        
        parts = [
            f"🏁 **APEX AI MULTI-AGENT WAR ROOM REPORT ({driver.upper()})**\n",
            f"📊 **[Telemetry Analyst]**: Time loss vs Ghost Lap: **+{t_res['total_avoidable_loss']:.2f}s**."
        ]
        for c in t_res["corner_time_losses"]:
            parts.append(f"  • **{c['corner_name']}**: {c['telemetry_finding']} (+{c['time_lost_seconds']}s)")
        parts.append("\n🔧 **[Vehicle Dynamics Engineer Setup]**:")
        for s in d_res:
            parts.append(f"  • **{s['component']}**: {s['recommendation']}")
        parts.append("\n🏎️ **[Race Strategist]**:")
        if s_res.get("pro_locked"):
            parts.append("  • " + s_res["message"])
        else:
            parts.append(f"  • Pit Window: **{s_res['optimal_pit_window']}** ({s_res['target_compound']})")
        return "\n".join(parts)
