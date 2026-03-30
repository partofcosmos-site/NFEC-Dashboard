# NFEC Project: Bill of Materials & Budget Request

**Project:** Autonomous Neural-Flow Environmental Controller (NFEC)  
**Phase:** Hardware Prototyping Grant Request

To transition the NFEC architecture from a simulated digital twin to a physical reality, the following hardware components are required. The software architecture (HAL, PID Controllers, and Pathfinding SLAM) has already been built and verified in software.

## 1. Computing Core ("The Brain")
*The central processor running the `nfec_brain.py` and `server.py` scripts.*
*   **Raspberry Pi 4 Model B (8GB RAM)**: ~$75.00
*   **MicroSD Card (64GB, Application Class A2)**: ~$15.00
*   **5V 3A USB-C Power Supply**: ~$10.00
*   *Subtotal: ~$100.00*

## 2. Locomotion & Chassis ("The Body & Legs")
*Components required to execute the Differential Drive Kinematics defined in `nfec_hal.py`.*
*   **2WD Robot Chassis Kit (Acrylic or Aluminum)**: ~$25.00
*   **2x 12V DC Motors with Hall Effect Encoders**: ~$30.00 (Encoders are *critical* for PID control feedback)
*   **L298N Dual H-Bridge Motor Driver**: ~$6.00
*   **2x 65mm Rubber Wheels**: ~$10.00
*   **Caster Wheel (Omni-directional)**: ~$5.00
*   *Subtotal: ~$76.00*

## 3. Sensors & Perception ("The Eyes")
*Required for the A* Pathfinding and Artificial Potential Field obstacle avoidance.*
*   **RPLiDAR A1M8 (360 Degree Laser Range Scanner)**: ~$100.00
*   *Subtotal: ~$100.00*

## 4. Power & Distribution 
*   **3S 11.1V 2200mAh LiPo Battery**: ~$25.00
*   **LiPo Battery Balance Charger**: ~$20.00
*   **LM2596 DC-DC Buck Converter (Step down 12V to 5V for Pi)**: ~$5.00
*   *Subtotal: ~$50.00*

---
### **Total Requested Hardware Grant Budget: ~$326.00**

## Why This Grant Will Succeed
The majority of robotic projects fail due to underdeveloped software. The NFEC project has taken a software-first approach:
1.  **Digital Twin Verified:** The physical dimensions and mass are already mathematically defined in `nfec_robot.urdf`.
2.  **OS Ready:** The entire node structure, control loops, and API mesh are written, tested, and stored on GitHub.
3.  **Low Risk:** Once the hardware listed above is procured, it is simply a matter of plugging the exact GPIO pins mapped in our software to the physical motor driver.
