deck_cols = 3;
deck_rows = 2;
spacing_x = 36;
spacing_y = 42;
oled_w    = 27;
oled_h    = 27;
glass_w   = 22;
glass_h   = 12;
btn_dia   = 12;
btn_inset = 4;

case_wall = 2.5;
case_h    = 16;
oled_ch   = 9;
btn_ch    = 4;
wall_tol  = 0.3;
screw_r   = 1.6;
screw_dx  = 8;
screw_dy  = 8;

usb_w     = 13;
usb_h     = 8;
usb_from_floor = 3;
usb_recess     = 8;

unit_cw   = spacing_x;
unit_rowA = 20;
unit_rowB = 34;
inner_w   = deck_cols * spacing_x + case_wall * 2;
inner_h   = deck_rows * spacing_y + case_wall * 2;

module rounded_square(w, h, r, $fn=48) {
    hull() {
        for (x = [r, w-r]) for (y = [r, h-r])
            translate([x, y, 0]) circle(r=r);
    }
}

module top_plate() {
    difference() {
        linear_extrude(case_wall)
            offset(r=6) rounded_square(inner_w, inner_h, 6);
        for (c=[0:deck_cols-1]) for (r=[0:deck_rows-1]) {
            let(x = case_wall + (c+0.5)*spacing_x,
                y = case_wall + r*spacing_y + unit_rowA) {
                translate([x - glass_w/2, y - glass_h/2, 0])
                    cube([glass_w, glass_h, case_wall+1]);
                translate([x - oled_w/2, y - oled_h/2, case_wall])
                    linear_extrude(oled_ch)
                        rounded_square(oled_w, oled_h, 2);
            }
        }
        for (c=[0:deck_cols-1]) for (r=[0:deck_rows-1]) {
            let(x = case_wall + (c+0.5)*spacing_x,
                y = case_wall + r*spacing_y + unit_rowB)
                translate([x, y, 0]) cylinder(d=btn_dia, h=case_wall+btn_ch+1);
        }
        for (x=[screw_dx, inner_w-screw_dx])
            for (y=[screw_dy, inner_h-screw_dy])
                translate([x, y, -1]) cylinder(d=screw_r*2, h=case_wall+3);
    }
}

module bottom_base() {
    difference() {
        union() {
            translate([0, 0, 0])
                linear_extrude(case_h - case_wall)
                    offset(r=6) rounded_square(inner_w, inner_h, 6);
            linear_extrude(case_h)
                offset(r=6) rounded_square(inner_w, inner_h, 6);
        }
        translate([case_wall+0.5, case_wall+0.5, case_wall])
            linear_extrude(case_h)
                offset(r=4) rounded_square(
                    inner_w-2*case_wall-1, inner_h-2*case_wall-1, 4);
        for (x=[screw_dx, inner_w-screw_dx])
            for (y=[screw_dy, inner_h-screw_dy])
                translate([x, y, -1]) cylinder(d=screw_r*2 + 4, h=case_h+2);
        let(ux = inner_w/2 - usb_w/2,
            uy = inner_h - usb_recess,
            uz = case_wall + usb_from_floor) {
            translate([ux, uy, uz])
                cube([usb_w, usb_recess + case_wall + 1, usb_h]);
        }
    }
}

part = 1;
if (part == 0) top_plate();
else           bottom_base();