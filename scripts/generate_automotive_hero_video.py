import math
import random
import subprocess
import os
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

def generate_video():
    W, H = 1920, 1080
    FPS = 30
    DURATION_SEC = 10
    TOTAL_FRAMES = FPS * DURATION_SEC  # 300 frames

    bg_path = '/Users/atchyuthkarri/.gemini/antigravity-ide/brain/996ba3d6-3824-45bd-81e5-2f93078a8785/automotive_night_hero_1793620001929.jpg'
    bottle_path = 'public/images/saudagar_noir_matte.png'
    output_mp4 = 'public/videos/SAUDAGAR_Automotive_Noir_Night_1080p.mp4'

    print("Loading base assets...")
    # Load and scale background to 1920x1080
    base_bg = Image.open(bg_path).convert('RGB')
    base_bg = base_bg.resize((W, H), Image.Resampling.LANCZOS)

    # Load perfume bottle
    bottle_orig = Image.open(bottle_path).convert('RGBA')
    
    # Scale bottle to fit perfectly centered in the 1080p frame
    # Bottle height ~ 680px for luxury hero presence
    target_bottle_h = 670
    scale = target_bottle_h / bottle_orig.height
    target_bottle_w = int(bottle_orig.width * scale)
    bottle = bottle_orig.resize((target_bottle_w, target_bottle_h), Image.Resampling.LANCZOS)

    bottle_x = (W - target_bottle_w) // 2
    # Place bottle in vertical optical center, resting on the reflective wet asphalt
    bottle_y = (H - target_bottle_h) // 2 + 35

    # 1. Create realistic wet asphalt ground reflection of the bottle
    flipped_bottle = bottle.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
    # Crop to lower half of bottle for asphalt reflection
    refl_w, refl_h = flipped_bottle.size
    refl_layer = Image.new('RGBA', (refl_w, refl_h), (0, 0, 0, 0))
    refl_pixels = flipped_bottle.load()
    target_refl = refl_layer.load()

    # Create wet asphalt vertical fade & ripple distortion
    for y in range(refl_h):
        # Fade reflection out deeper into the ground
        fade = max(0.0, 1.0 - (y / (refl_h * 0.75)))
        alpha_mult = fade * 0.32  # 32% maximum reflection intensity on wet black tarmac
        for x in range(refl_w):
            r, g, b, a = refl_pixels[x, y]
            if a > 0:
                target_refl[x, y] = (int(r * 0.85), int(g * 0.85), int(b * 0.9), int(a * alpha_mult))

    refl_layer = refl_layer.filter(ImageFilter.GaussianBlur(radius=3.5))

    # 2. Contact shadow beneath the flacon base
    shadow_w = int(target_bottle_w * 0.95)
    shadow_h = 36
    shadow_layer = Image.new('RGBA', (shadow_w, shadow_h), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow_layer)
    shadow_draw.ellipse([4, 4, shadow_w - 4, shadow_h - 4], fill=(0, 0, 0, 230))
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(radius=8))

    # 3. Deterministic seamless rain particles
    random.seed(42)
    NUM_RAIN = 450
    rain_particles = []
    for i in range(NUM_RAIN):
        rain_particles.append({
            'x': random.uniform(0, W + 200),
            'start_y': random.uniform(-100, H + 100),
            'speed': random.uniform(800, 1400), # pixels per second
            'length': random.uniform(16, 38),
            'thickness': random.choice([1, 1, 1, 2]),
            'alpha': random.randint(40, 130)
        })

    # 4. Ripple rings on wet asphalt (lower third of the screen: y > 600)
    NUM_RIPPLES = 22
    ripples = []
    for i in range(NUM_RIPPLES):
        ripples.append({
            'x': random.uniform(60, W - 60),
            'y': random.uniform(660, H - 40),
            'phase_offset': random.uniform(0, 1), # 0 to 1 cycle
            'max_r': random.uniform(14, 32)
        })

    # Setup ffmpeg process
    cmd = [
        'ffmpeg',
        '-y',
        '-f', 'rawvideo',
        '-vcodec', 'rawvideo',
        '-s', f'{W}x{H}',
        '-pix_fmt', 'rgb24',
        '-r', str(FPS),
        '-i', '-',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-preset', 'fast',
        '-crf', '18',
        '-movflags', '+faststart',
        output_mp4
    ]

    print("Launching ffmpeg rendering pipeline...")
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)

    try:
        for f in range(TOTAL_FRAMES):
            t = f / TOTAL_FRAMES  # normalized 0.0 to 1.0 (seamless loop)
            current_time = f / FPS

            # Start from base background
            frame_img = base_bg.copy()

            # Dynamic lighting layer: Subtle shimmering city lights & moving headlight sweep
            # Light sweep moves across the background road from left to right seamlessly
            headlight_x = (W * (t * 1.5)) % (W + 800) - 400
            
            # Subtle breathing shimmer on distant city lights (harmonic oscillation)
            city_shimmer = 1.0 + 0.04 * math.sin(t * 2 * math.pi * 3)
            
            # Rain overlay layer
            rain_overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
            rain_draw = ImageDraw.Draw(rain_overlay)

            # Draw seamless looping rain particles
            for r in rain_particles:
                # Modulo arithmetic guarantees seamless wrap-around
                total_fall = r['speed'] * DURATION_SEC
                curr_y = (r['start_y'] + t * total_fall) % (H + 150) - 50
                # Slight wind drift angle (-12 degrees)
                curr_x = (r['x'] - t * total_fall * 0.18) % (W + 200) - 100
                
                # Draw rain streak
                x2 = curr_x - 3
                y2 = curr_y + r['length']
                rain_draw.line(
                    [(curr_x, curr_y), (x2, y2)],
                    fill=(210, 220, 235, r['alpha']),
                    width=r['thickness']
                )

            # Draw subtle water ripple rings on the asphalt
            for rip in ripples:
                # Cycle repeats exactly 3 times in 10 seconds for seamless loop
                rip_cycle = (t * 4 + rip['phase_offset']) % 1.0
                curr_radius = rip_cycle * rip['max_r']
                curr_alpha = int(max(0, (1.0 - rip_cycle) * 70))
                if curr_alpha > 0 and curr_radius > 1:
                    # Elliptical ripple matching asphalt perspective (compressed vertically)
                    rx = curr_radius
                    ry = curr_radius * 0.32
                    rain_draw.ellipse(
                        [rip['x'] - rx, rip['y'] - ry, rip['x'] + rx, rip['y'] + ry],
                        outline=(220, 200, 160, curr_alpha),
                        width=1
                    )

            # Subtle wet headlight reflection sweep on the asphalt
            sweep_alpha = int(22 + 10 * math.sin(t * 2 * math.pi))
            rain_draw.ellipse(
                [headlight_x - 300, 720, headlight_x + 300, 960],
                fill=(230, 185, 110, sweep_alpha)
            )

            # Composite rain & environmental effects onto background
            frame_img.paste(rain_overlay, (0, 0), rain_overlay)

            # Composite the wet asphalt reflection of the bottle below it
            refl_pos_y = bottle_y + target_bottle_h - 12
            frame_img.paste(refl_layer, (bottle_x, refl_pos_y), refl_layer)

            # Composite contact shadow
            shadow_pos_x = bottle_x + (target_bottle_w - shadow_w) // 2
            shadow_pos_y = bottle_y + target_bottle_h - 18
            frame_img.paste(shadow_layer, (shadow_pos_x, shadow_pos_y), shadow_layer)

            # Composite the central, rock-solid stationary perfume bottle
            frame_img.paste(bottle, (bottle_x, bottle_y), bottle)

            # Subtle studio lighting highlight sweep across gold cap (pure seamless loop)
            # The cap is at the top of the bottle
            glint_phase = math.sin(t * 2 * math.pi * 2)
            if glint_phase > 0.4:
                glint_alpha = int((glint_phase - 0.4) / 0.6 * 65)
                glint_overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
                g_draw = ImageDraw.Draw(glint_overlay)
                # Cap area: around bottle_x + target_bottle_w/2, bottle_y + 40
                cap_center_x = bottle_x + target_bottle_w // 2
                cap_center_y = bottle_y + 45
                g_draw.ellipse(
                    [cap_center_x - 35, cap_center_y - 15, cap_center_x + 35, cap_center_y + 15],
                    fill=(255, 235, 170, glint_alpha)
                )
                g_overlay_blurred = glint_overlay.filter(ImageFilter.GaussianBlur(radius=6))
                frame_img.paste(g_overlay_blurred, (0, 0), g_overlay_blurred)

            # Pipe RGB raw bytes to ffmpeg
            proc.stdin.write(frame_img.tobytes())

            if (f + 1) % 60 == 0:
                print(f"Rendered {f + 1}/{TOTAL_FRAMES} frames ({(f + 1)/TOTAL_FRAMES*100:.0f}%)...")

        proc.stdin.close()
        proc.wait()
        print(f"SUCCESS: Video exported to {output_mp4}!")

    except Exception as e:
        print("Error during video generation:", e)
        if proc:
            proc.kill()
        sys.exit(1)

if __name__ == '__main__':
    generate_video()
