from flask import Flask, request, jsonify, send_file
from nfec_brain import execute_command, robot_state, command_queue, systems_health
import psutil
import time

BOOT_TIME = time.time()

app = Flask(__name__)

# ─── NAVIGATION ROUTES ──────────────────────────────────────
@app.route('/')
def dashboard():
    return send_file('index.html')

@app.route('/index.css')
def serve_css():
    return send_file('index.css', mimetype='text/css')

@app.route('/simulation.js')
def serve_sim():
    return send_file('simulation.js', mimetype='application/javascript')

# ─── API ENDPOINTS ──────────────────────────────────────────
@app.route('/command', methods=['POST'])
def receive_command():
    data = request.json
    cmd_string = data.get('command', '')
    output_message = execute_command(cmd_string)
    return jsonify({
        "message": output_message,
        "state": robot_state
    })

@app.route('/telemetry')
def telemetry():
    from nfec_brain import update_telemetry
    update_telemetry(1.5) # Simulate live health updates
    uptime_seconds = int(time.time() - BOOT_TIME)
    mins, secs = divmod(uptime_seconds, 60)
    hours, mins = divmod(mins, 60)
    return jsonify({
        "host": {
            "cpu": psutil.cpu_percent(),
            "ram": psutil.virtual_memory().percent,
            "uptime": f"{hours:02d}:{mins:02d}:{secs:02d}"
        },
        "systems": systems_health,
        "robot": robot_state
    })

# ─── ROBOT COMMUNICATION ────────────────────────────────────
robot_position = {"x": 0, "z": 0, "status": "Waiting", "battery": 100}

@app.route('/robot/next_command')
def next_command():
    if command_queue:
        cmd = command_queue.pop(0)
        return jsonify({"command": cmd})
    return jsonify({"command": None})

@app.route('/robot/status', methods=['POST'])
def robot_status_update():
    data = request.json
    robot_position["x"] = data.get("x", 0)
    robot_position["z"] = data.get("z", 0)
    status = data.get("status", "Unknown")
    robot_position["status"] = status
    
    # Update AI Brain logic
    if "AVOIDING_HAZARD" in status:
        robot_state["collision_risk"] = "CRITICAL"
    elif "Navigating" in status:
        robot_state["collision_risk"] = "MODERATE"
    else:
        robot_state["collision_risk"] = "LOW"

    # Sync brain systems with robot reported state
    systems_health["battery"] = data.get("battery", systems_health["battery"])
    return jsonify({"ok": True})

@app.route('/robot/position')
def get_robot_position():
    return jsonify({
        "pos": robot_position,
        "health": systems_health
    })

if __name__ == '__main__':
    print("NFEC GCS v2.0 - Server Mesh Online")
    app.run(port=5000, debug=True)
