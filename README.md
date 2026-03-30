# NFEC GCS v2.0 | Neural-Flow Ground Control System

![NFEC Header](https://raw.githubusercontent.com/partofcosmos-site/NFEC-Dashboard/master/favicon.ico) *<!-- Replace with actual image link if available -->*

Industrial digital twin interface and robotic command center. This system integrates real-time 3D spatial telemetry, AI-driven intent resolution, and a high-fidelity HUD for monitoring and controlling NFEC autonomous units.

## 🚀 Features

- **Real-time 3D Digital Twin**: Built with Three.js, mirroring physical robotic movements and spatial orientation.
- **AI Intent Resolver**: Natural language command processing powered by the `nfec_ai` and `nfec_brain` modules.
- **Dynamic Telemetry**: Live monitoring of CPU/RAM, battery health, motor temperature, and signal strength.
- **Autonomous Navigation**: Reactive obstacle avoidance using simulated LIDAR data.

## 🛠 Tech Stack

- **Frontend**: HTML5, Vanilla CSS (GCS HUD Theme), Three.js
- **Backend**: Python 3.12, Flask, Psutil
- **Intelligence**: Custom Federated AI Core (`nfec_ai.py`)

## 📦 Setup & Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/partofcosmos-site/NFEC-Dashboard.git
   cd NFEC-Dashboard
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the Server**
   ```bash
   python server.py
   ```
   *The GCS interface will be available at `http://localhost:5000`*

## 📁 Project Structure

- `server.py`: Flask entry point and API mesh.
- `index.html`: GCS HUD Interface.
- `simulation.js`: Three.js digital twin logic.
- `nfec_brain.py`: Core system logic and state management.
- `nfec_ai.py`: Intent resolution and AI processing.

---
*System Status: LINE_ACTIVE*
