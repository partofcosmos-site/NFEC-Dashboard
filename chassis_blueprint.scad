// NFEC Robot Chassis - 3D Printable Blueprint
// Language: OpenSCAD
// You can copy this code into OpenSCAD (a free software) to instantly generate a 3D printable STL file of your robot's body.

// Variables (in mm)
base_radius = 175;   // 35cm diameter
base_thickness = 5;  // 5mm thick acrylic/3d print
motor_width = 25;
motor_length = 60;
wheel_radius = 40;

module base_plate() {
    difference() {
        // Main circular body
        cylinder(h=base_thickness, r=base_radius, $fn=100);
        
        // Cutout for Left Wheel
        translate([0, base_radius - 20, -1])
            cube([motor_length+10, motor_width+20, base_thickness+2], center=true);
            
        // Cutout for Right Wheel
        translate([0, -(base_radius - 20), -1])
            cube([motor_length+10, motor_width+20, base_thickness+2], center=true);
            
        // Drill holes for Raspberry Pi Mounting
        translate([30, 30, -1]) cylinder(h=10, r=1.5, $fn=20);
        translate([30, -30, -1]) cylinder(h=10, r=1.5, $fn=20);
        translate([-40, 30, -1]) cylinder(h=10, r=1.5, $fn=20);
        translate([-40, -30, -1]) cylinder(h=10, r=1.5, $fn=20);
    }
}

// Render the 3D Blueprint
color("DarkGray") base_plate();
