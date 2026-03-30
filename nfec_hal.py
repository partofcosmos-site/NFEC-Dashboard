"""
NFEC Hardware Abstraction Layer (HAL)
=====================================
If you want to build a real robot, you cannot have your high-level AI (like `nfec_brain.py`) 
talking directly to hardware pins. That is bad software architecture.

Real robots use a Hardware Abstraction Layer (HAL). This module acts as the "Spinal Cord". 
It takes high-level mathematical commands (like Linear Velocity V and Angular Velocity W) 
and translates them into physical electrical PWM (Pulse Width Modulation) signals for the motors.

This file demonstrates the exact logic you would use on a Raspberry Pi.
"""
import time
import math

# Try to import RPi.GPIO. Since you are developing on Windows, we mock it.
try:
    import RPi.GPIO as GPIO
    SIMULATED_HARDWARE = False
except ImportError:
    # --- MOCKED GPIO FOR VIRTUAL TESTING ---
    class MockGPIO:
        BCM = "BCM"
        OUT = "OUT"
        def setmode(self, mode): pass
        def setup(self, pin, mode): pass
        def output(self, pin, state): pass
        def PWM(self, pin, hz): return MockPWM()
    
    class MockPWM:
        def start(self, dc): pass
        def ChangeDutyCycle(self, dc): pass
    
    GPIO = MockGPIO()
    SIMULATED_HARDWARE = True


class NFECHardwareLayer:
    def __init__(self, wheelbase=0.64, wheel_radius=0.08):
        self.L = wheelbase
        self.R = wheel_radius
        
        # Physical Pin Defs (L298N Motor Driver)
        self.PINS = {
            "M1_IN1": 17, "M1_IN2": 18, "M1_ENA": 12, # Left Motor
            "M2_IN3": 22, "M2_IN4": 23, "M2_ENB": 13  # Right Motor
        }
        
        self._init_hardware()

    def _init_hardware(self):
        GPIO.setmode(GPIO.BCM)
        for pin in self.PINS.values():
            GPIO.setup(pin, GPIO.OUT)
        
        # PWM allows us to control the SPEED of the motor, not just ON/OFF.
        self.pwm_left = GPIO.PWM(self.PINS["M1_ENA"], 1000)
        self.pwm_right = GPIO.PWM(self.PINS["M2_ENB"], 1000)
        self.pwm_left.start(0)
        self.pwm_right.start(0)
        
        print(f"[HAL] Initialized. Simulated: {SIMULATED_HARDWARE}")

    def inverse_kinematics(self, linear_vel, angular_vel):
        """
        The Core Math: Converts desired Chassis Velocities into Wheel Velocities.
        V = Linear Velocity (meters/sec)
        W = Angular Velocity (radians/sec)
        """
        v_left = linear_vel - (angular_vel * self.L / 2)
        v_right = linear_vel + (angular_vel * self.L / 2)
        
        # Convert Wheel Velocities (m/s) to Motor RPM to PWM Duty Cycle (0-100%)
        # (This varies based on your specific physical motor specs. Assuming max speed is 1.0 m/s = 100% duty)
        pwm_l = max(-100, min(100, v_left * 100))
        pwm_r = max(-100, min(100, v_right * 100))
        
        return pwm_l, pwm_r

    def apply_cmd_vel(self, linear_v, angular_v):
        """
        Command Velocity: The standard robotics way to move.
        This function receives mathematical vectors and drives the physical pins.
        """
        pwmL, pwmR = self.inverse_kinematics(linear_v, angular_v)
        
        # Motor Direction Logic (H-Bridge)
        GPIO.output(self.PINS["M1_IN1"], pwmL >= 0)
        GPIO.output(self.PINS["M1_IN2"], pwmL < 0)
        
        GPIO.output(self.PINS["M2_IN3"], pwmR >= 0)
        GPIO.output(self.PINS["M2_IN4"], pwmR < 0)
        
        # Motor Power Level (PWM)
        self.pwm_left.ChangeDutyCycle(abs(pwmL))
        self.pwm_right.ChangeDutyCycle(abs(pwmR))
        
        print(f"[HAL] V:{linear_v:.2f} W:{angular_v:.2f} | MotorL:{pwmL:.1f}% MotorR:{pwmR:.1f}%")

if __name__ == "__main__":
    # Test the abstraction logic
    hal = NFECHardwareLayer()
    # E.g. Turn slightly right while moving forward
    hal.apply_cmd_vel(0.5, 0.2) 
