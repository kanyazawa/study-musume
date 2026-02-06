
from PIL import Image, ImageDraw
import sys

def analyze_black_regions(input_path, tolerance=30):
    try:
        img = Image.open(input_path).convert("RGBA")
        width, height = img.size
        pixels = img.load()
        
        # 1. Identify all "Black" pixels
        bg_ref = pixels[0, 0][:3] # Assuming top-left is background
        print(f"Background Reference: {bg_ref}")
        
        visited = set()
        black_regions = []
        
        def is_black(px):
            return all(abs(px[i] - bg_ref[i]) <= tolerance for i in range(3))

        # BFS to find connected components of black pixels
        for x in range(width):
            for y in range(height):
                if (x, y) not in visited and is_black(pixels[x, y]):
                    # Found a new black region
                    component = []
                    q = [(x, y)]
                    visited.add((x, y))
                    component.append((x, y))
                    
                    is_connected_to_border = False
                    
                    idx = 0
                    while idx < len(q):
                        cx, cy = q[idx]
                        idx += 1
                        
                        # Check border connectivity
                        if cx == 0 or cx == width-1 or cy == 0 or cy == height-1:
                            is_connected_to_border = True
                        
                        for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
                            nx, ny = cx + dx, cy + dy
                            if 0 <= nx < width and 0 <= ny < height:
                                if (nx, ny) not in visited:
                                    if is_black(pixels[nx, ny]):
                                        visited.add((nx, ny))
                                        q.append((nx, ny))
                                        component.append((nx, ny))
                    
                    black_regions.append({
                        "size": len(component),
                        "connected_to_border": is_connected_to_border,
                        "sample_coord": component[0]
                    })

        print(f"Total Black Regions found: {len(black_regions)}")
        for i, region in enumerate(black_regions):
            print(f"Region {i}: Size={region['size']}, Border={region['connected_to_border']}, Sample={region['sample_coord']}")

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    input_file = r"C:/Users/Hide2/.gemini/antigravity/brain/56a50dc2-cc27-4194-ac40-59861eb2c002/uploaded_image_1769170135489.jpg"
    analyze_black_regions(input_file)
