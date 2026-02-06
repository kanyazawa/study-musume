
from PIL import Image
import sys

def analyze_v2(input_path, tolerance=30):
    try:
        img = Image.open(input_path).convert("RGBA")
        width, height = img.size
        pixels = img.load()
        
        bg_ref = pixels[0, 0][:3]
        
        def is_black(px):
            return all(abs(px[i] - bg_ref[i]) <= tolerance for i in range(3))

        visited = set()
        regions = []
        
        for x in range(width):
            for y in range(height):
                if (x, y) not in visited and is_black(pixels[x, y]):
                    # BFS
                    q = [(x, y)]
                    visited.add((x, y))
                    size = 0
                    border = False
                    start_x, start_y = x, y
                    
                    idx = 0
                    while idx < len(q):
                        cx, cy = q[idx]
                        idx += 1
                        size += 1
                        
                        if cx == 0 or cx == width-1 or cy == 0 or cy == height-1:
                            border = True
                        
                        for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
                            nx, ny = cx + dx, cy + dy
                            if 0 <= nx < width and 0 <= ny < height:
                                if (nx, ny) not in visited:
                                    if is_black(pixels[nx, ny]):
                                        visited.add((nx, ny))
                                        q.append((nx, ny))
                    
                    if not border:
                        regions.append({"size": size, "x": start_x, "y": start_y})

        # Sort by size
        regions.sort(key=lambda r: r['size'], reverse=True)
        
        print(f"Non-border black regions found: {len(regions)}")
        for r in regions:
            if r['size'] > 10:
                print(f"Size: {r['size']} at ({r['x']}, {r['y']})")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    input_file = r"C:/Users/Hide2/.gemini/antigravity/brain/56a50dc2-cc27-4194-ac40-59861eb2c002/uploaded_image_1769170135489.jpg"
    analyze_v2(input_file)
