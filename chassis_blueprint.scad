// NFEC Full Robot Assembly - 3D Printable Blueprint
// Language: OpenSCAD

// Global Dimensions (in mm)
base_radius = 175;
base_thickness = 5;
motor_width = 25;
motor_length = 60;

// 1. THE CHASSIS BASE PLATE
module base_plate() {
    difference() {
        cylinder(h=base_thickness, r=base_radius, $fn=100);
        
        // Wheel Cutouts
        translate([0, base_radius - 20, -1]) cube([motor_length+10, motor_width+20, base_thickness+2], center=true);
        translate([0, -(base_radius - 20), -1]) cube([motor_length+10, motor_width+20, base_thickness+2], center=true);
            
        // Screw holes
        translate([40, 40, -1]) cylinder(h=10, r=2, $fn=20);
        translate([40, -40, -1]) cylinder(h=10, r=2, $fn=20);
        translate([-40, 40, -1]) cylinder(h=10, r=2, $fn=20);
        translate([-40, -40, -1]) cylinder(h=10, r=2, $fn=20);
    }
}

// 2. DC MOTOR MOUNTS (L-Brackets)
module motor_mount() {
    difference() {
        cube([motor_length, 5, 30], center=true); // Vertical wall
        translate([-15, 0, 5]) rotate([90,0,0]) cylinder(h=10, r=2, center=true, $fn=20); // Screw to motor
        translate([15, 0, 5]) rotate([90,0,0]) cylinder(h=10, r=2, center=true, $fn=20); // Screw to motor
    }
    translate([0, -15, -12.5]) cube([motor_length, 30, 5], center=true); // Base screw plate
}

// 3. LIDAR SENSOR MAST (Elevates LiDAR above the Raspberry Pi)
module lidar_mast() {
    difference() {
        cylinder(h=80, r=30, $fn=50); // Main pillar
        translate([0, 0, -1]) cylinder(h=82, r=25, $fn=50); // Hollow center for wiring
    }
    // Top Mounting Plate for RPLiDAR
    translate([0, 0, 80]) cylinder(h=5, r=40, $fn=50);
}

// 4. ELECTRONICS ENCLOSURE (Protects Raspberry Pi & L298N)
module electronics_box() {
    difference() {
        cube([100, 140, 45], center=true); // Outer box
        translate([0, 0, 5]) cube([95, 135, 45], center=true); // Hollow inside
        
        // Ventilation and Wiring slots
        translate([0, 70, 0]) cube([40, 10, 20], center=true);
        translate([0, -70, 0]) cube([40, 10, 20], center=true);
    }
}

// 5. CLIMBING STRUTS (The Leg Mechanics)
module climbing_strut() {
    cylinder(h=150, r=10, $fn=30); // Main leg brace
    translate([0, 0, 145]) sphere(r=15, $fn=30); // Rubber foot pad
    
    // Servo attachment joint at the top
    translate([0, 0, -10]) cube([30, 30, 20], center=true); 
}

// --- ASSEMBLE THE FULL ROBOT (For Visualizing) ---
color("DarkGray") base_plate();

// Attach Motor Mounts next to wheel cutouts
translate([0, 140, 15]) color("Silver") motor_mount();
translate([0, -140, 15]) rotate([0,0,180]) color("Silver") motor_mount();

// Attach Electronics Box in the center
translate([0, 0, 25]) color("DeepSkyBlue", 0.8) electronics_box();

// Attach LiDAR Mast over the Electronics
translate([0, 0, 45]) color("Black") lidar_mast();

// Attach Climbing Struts to the 4 corners
translate([100, 100, 0]) rotate([45, 45, 0]) color("Orange") climbing_strut();
translate([-100, 100, 0]) rotate([-45, 45, 0]) color("Orange") climbing_strut();
translate([100, -100, 0]) rotate([45, -45, 0]) color("Orange") climbing_strut();
translate([-100, -100, 0]) rotate([-45, -45, 0]) color("Orange") climbing_strut();

// Note: To 3D print these individually, you comment out the "Assemble" section 
// and call only the module you want to print, like: `motor_mount();`
