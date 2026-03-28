"""
NFEC Robot Controller - Runs INSIDE Webots
Polls the Flask server for commands and drives the robot to waypoints.
Uses: GPS (position), Compass (heading), 2x RotationalMotor (differential drive)
"""

from controller import Robot
import math
import urllib.request
import urllib.error
import json

# ─── Waypoint Map ───────────────────────────────────────────
# These match the landmark positions in nfec_room.wbt
WAYPOINTS = {
    "brew_coffee":    (1.3, -1.3),   # Near the red CoffeeMachine box
    "dim_lights":     (-1.3, 1.3),   # Near the yellow LightSwitch box
    "activate_focus": (-1.3, -1.3),  # Near the blue Desk
    "return_home":    (0.0, 0.0),    # Center of the room
}

ARRIVAL_THRESHOLD = 0.15   # How close (meters) counts as "arrived"
MAX_SPEED = 2.0            # Motor velocity cap (low to prevent tumbling)
SERVER_URL = "http://127.0.0.1:5000"

# ─── Helper: Fetch from Flask ───────────────────────────────
def fetch_next_command():
    """Ask the Flask server if there is a pending command."""
    try:
        req = urllib.request.Request(f"{SERVER_URL}/robot/next_command")
        with urllib.request.urlopen(req, timeout=1) as resp:
            data = json.loads(resp.read().decode())
            return data.get("command", None)
    except Exception:
        return None

def report_status(x, z, status_text):
    """Send current robot position and status back to Flask."""
    try:
        payload = json.dumps({"x": round(x, 3), "z": round(z, 3), "status": status_text})
        req = urllib.request.Request(
            f"{SERVER_URL}/robot/status",
            data=payload.encode(),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        urllib.request.urlopen(req, timeout=1)
    except Exception:
        pass

# ─── Navigation Logic ──────────────────────────────────────
def get_bearing(compass_values):
    """Convert compass readings to a heading angle in radians."""
    return math.atan2(compass_values[0], compass_values[2])

def navigate_to(robot, gps, compass, left_motor, right_motor, target_x, target_z, timestep):
    """
    Drive toward (target_x, target_z) using proportional steering.
    Returns True when the robot arrives within ARRIVAL_THRESHOLD.
    """
    pos = gps.getValues()
    x, z = pos[0], pos[2]

    dx = target_x - x
    dz = target_z - z
    distance = math.sqrt(dx * dx + dz * dz)

    if distance < ARRIVAL_THRESHOLD:
        left_motor.setVelocity(0)
        right_motor.setVelocity(0)
        return True  # Arrived!

    # Desired angle toward the target
    target_angle = math.atan2(dx, dz)

    # Current heading from compass
    compass_vals = compass.getValues()
    current_angle = get_bearing(compass_vals)

    # Angle error (normalized to [-pi, pi])
    angle_error = target_angle - current_angle
    if angle_error > math.pi:
        angle_error -= 2 * math.pi
    elif angle_error < -math.pi:
        angle_error += 2 * math.pi

    # Proportional steering
    if abs(angle_error) > 0.3:
        # Rotate in place slowly
        turn_speed = MAX_SPEED * 0.2
        left_motor.setVelocity(-turn_speed * (1 if angle_error > 0 else -1))
        right_motor.setVelocity(turn_speed * (1 if angle_error > 0 else -1))
    else:
        # Drive forward with gentle steering correction
        steer = angle_error * 1.5
        left_motor.setVelocity(MAX_SPEED * max(0.0, 1 - steer))
        right_motor.setVelocity(MAX_SPEED * max(0.0, 1 + steer))

    return False  # Still navigating


# ═══════════════════════════════════════════════════════════
#  MAIN CONTROL LOOP
# ═══════════════════════════════════════════════════════════
robot = Robot()
timestep = int(robot.getBasicTimeStep())

# Initialize devices
gps = robot.getDevice("gps")
gps.enable(timestep)

compass = robot.getDevice("compass")
compass.enable(timestep)

left_motor = robot.getDevice("left_motor")
right_motor = robot.getDevice("right_motor")
left_motor.setPosition(float('inf'))  # Velocity control mode
right_motor.setPosition(float('inf'))
left_motor.setVelocity(0)
right_motor.setVelocity(0)

# State
current_target = None
target_coords = None
poll_counter = 0

print("[NFEC-Bot] Controller initialized. Waiting for commands from Dashboard...")

while robot.step(timestep) != -1:
    pos = gps.getValues()
    x, z = pos[0], pos[2]

    # Poll the server every ~1 second (every 30 steps at 32ms timestep)
    poll_counter += 1
    if poll_counter >= 30:
        poll_counter = 0

        if current_target is None:
            # Robot is idle, check for a new command
            cmd = fetch_next_command()
            if cmd and cmd in WAYPOINTS:
                current_target = cmd
                target_coords = WAYPOINTS[cmd]
                print(f"[NFEC-Bot] Received command: {cmd} -> Navigating to {target_coords}")
                report_status(x, z, f"Navigating to {cmd}")
            else:
                report_status(x, z, "Idle")

    # If we have a target, navigate toward it
    if current_target is not None and target_coords is not None:
        arrived = navigate_to(robot, gps, compass, left_motor, right_motor,
                              target_coords[0], target_coords[1], timestep)
        if arrived:
            print(f"[NFEC-Bot] Arrived at {current_target}!")
            report_status(x, z, f"Completed: {current_target}")
            current_target = None
            target_coords = None
