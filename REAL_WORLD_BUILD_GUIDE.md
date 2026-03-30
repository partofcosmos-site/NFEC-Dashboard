# REAL-WORLD BUILD: STEP-BY-STEP

This is NOT an animation. This is a technical blueprint to move your code into a physical robot chassis.

## 🛠 Step 1: The "Hardware Kit"
Order these exact parts if you want it to work with our code:
1. **Controller**: Raspberry Pi 4 (8GB) - *The "Brain"*
2. **Wheels**: 2x 12V DC Motors with Hall Effect Encoders - *The "Legs"*
3. **Driver**: L298N Dual H-Bridge Motor Driver - *The "Muscles"*
4. **Power**: 3S 11.1V LiPo Battery (2200mAh)
5. **Chassis**: Any basic 2WD robot kit.

## 🔌 Step 2: Wiring (The Electrical Bridge)
Connect the Raspberry Pi GPIO pins to the L298N Driver:
- **GPIO 17**: Left Motor Forward
- **GPIO 18**: Left Motor Reverse
- **GPIO 22**: Right Motor Forward
- **GPIO 23**: Right Motor Reverse

## 💻 Step 3: Deployment (Making the Code "Real")
You will move `server.py` and `nfec_brain.py` onto the Raspberry Pi.

### THE HARDWARE BRIDGE SCRIPT
Create `physical_driver.py` on your Pi to translate web commands to electrical voltage:

```python
import RPi.GPIO as GPIO
import requests
import time

GPIO.setmode(GPIO.BCM)
PINS = [17, 18, 22, 23]
for p in PINS: GPIO.setup(p, GPIO.OUT)

def drive_physical(cmd):
    if cmd == "go_to_coffee":
        GPIO.output(17, True) # Turn on Left Motor
        GPIO.output(22, True) # Turn on Right Motor
        time.sleep(2)         # Move for 2 seconds
        for p in PINS: GPIO.output(p, False) # Stop

# LINKING TO YOUR SERVER
while True:
    res = requests.get("http://localhost:5000/robot/next_command").json()
    if res['command']:
        drive_physical(res['command'])
    time.sleep(0.5)
```

## 🎯 Final result
When you click **"EXEC"** on your website UI, the `server.py` tells the `physical_driver.py` to move the **real metal motors**. 

**No animations—just real electricity and real Torque.**
