import os
import base64
from PIL import Image

src_img_path = r'C:\Users\rajesh\.gemini\antigravity\brain\6d1c7688-903c-4d1f-bed1-ad8fec2d59c5\.user_uploaded\media_1794827815472_34cd5a4c.jpg'
dest_public_dir = r'C:\Users\rajesh\OneDrive\Desktop\Nex_Academy\Nexelvoria_Academy_Frontend\public'

print(f"Opening source image: {src_img_path}")
img = Image.open(src_img_path)
print(f"Source image loaded: size={img.size}, mode={img.mode}")

if img.mode != 'RGB':
    img = img.convert('RGB')

# 1. Full resolution logo.png (1024x1024)
logo_png_path = os.path.join(dest_public_dir, 'logo.png')
img.save(logo_png_path, 'PNG', optimize=True)
print(f"Saved: {logo_png_path} ({os.path.getsize(logo_png_path)} bytes)")

# 2. android-chrome-512x512.png
img_512 = img.resize((512, 512), Image.Resampling.LANCZOS)
p512 = os.path.join(dest_public_dir, 'android-chrome-512x512.png')
img_512.save(p512, 'PNG', optimize=True)
print(f"Saved: {p512} ({os.path.getsize(p512)} bytes)")

# 3. android-chrome-192x192.png
img_192 = img.resize((192, 192), Image.Resampling.LANCZOS)
p192 = os.path.join(dest_public_dir, 'android-chrome-192x192.png')
img_192.save(p192, 'PNG', optimize=True)
print(f"Saved: {p192} ({os.path.getsize(p192)} bytes)")

# 4. apple-touch-icon.png (180x180)
img_180 = img.resize((180, 180), Image.Resampling.LANCZOS)
p180 = os.path.join(dest_public_dir, 'apple-touch-icon.png')
img_180.save(p180, 'PNG', optimize=True)
print(f"Saved: {p180} ({os.path.getsize(p180)} bytes)")

# 5. favicon-32x32.png
img_32 = img.resize((32, 32), Image.Resampling.LANCZOS)
p32 = os.path.join(dest_public_dir, 'favicon-32x32.png')
img_32.save(p32, 'PNG', optimize=True)
print(f"Saved: {p32} ({os.path.getsize(p32)} bytes)")

# 6. favicon-16x16.png
img_16 = img.resize((16, 16), Image.Resampling.LANCZOS)
p16 = os.path.join(dest_public_dir, 'favicon-16x16.png')
img_16.save(p16, 'PNG', optimize=True)
print(f"Saved: {p16} ({os.path.getsize(p16)} bytes)")

# 7. favicon.png (32x32 fallback)
pfav_png = os.path.join(dest_public_dir, 'favicon.png')
img_32.save(pfav_png, 'PNG', optimize=True)
print(f"Saved: {pfav_png} ({os.path.getsize(pfav_png)} bytes)")

# 8. favicon.ico with 16x16, 32x32, 48x48
pico = os.path.join(dest_public_dir, 'favicon.ico')
img.save(pico, format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])
print(f"Saved: {pico} ({os.path.getsize(pico)} bytes)")

# 9. favicon.svg replacing the old Vite icon so any legacy request gets the exact logo
with open(p32, 'rb') as f:
    b64_32 = base64.b64encode(f.read()).decode('utf-8')

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <image width="32" height="32" href="data:image/png;base64,{b64_32}" />
</svg>
'''
psvg = os.path.join(dest_public_dir, 'favicon.svg')
with open(psvg, 'w', encoding='utf-8') as f:
    f.write(svg_content)
print(f"Saved: {psvg} ({os.path.getsize(psvg)} bytes)")

print("\nAll favicon assets successfully generated from exact supplied image!")

