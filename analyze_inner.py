
from PIL import Image
import sys

def analyze_inner_colors(input_path, tolerance=60):
    try:
        img = Image.open(input_path).convert("RGBA")
        width, height = img.size
        pixels = img.load()
        
        bg_ref = pixels[0, 0][:3]
        print(f"Background Reference: {bg_ref}")
        
        def get_dist(c1, c2):
            return sum(abs(c1[i] - c2[i]) for i in range(3))

        # 1. Simulate Outer Flood Fill to identify "Inner" pixels
        visited = set()
        queue = [(0, 0), (width-1, 0), (0, height-1), (width-1, height-1)]
        
        # Valid starts
        queue = [p for p in queue if get_dist(pixels[p][:3], bg_ref) < tolerance]
        visited.update(queue)
        
        idx = 0
        while idx < len(queue):
            cx, cy = queue[idx]
            idx += 1
            
            for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
                nx, ny = cx + dx, cy + dy
                if 0 <= nx < width and 0 <= ny < height:
                    if (nx, ny) not in visited:
                        if get_dist(pixels[nx, ny][:3], bg_ref) < tolerance:
                            visited.add((nx, ny))
                            queue.append((nx, ny))
                            
        # 2. Analyze "Remaining" pixels that are "Similar" to BG
        inner_similars = []
        
        for x in range(width):
            for y in range(height):
                if (x, y) not in visited:
                    dist = get_dist(pixels[x, y][:3], bg_ref)
                    if dist < tolerance:
                        inner_similars.append(dist)

        # Output histogram
        if not inner_similars:
            print("No inner similar pixels found.")
        else:
            print(f"Found {len(inner_similars)} inner pixels similar to BG (dist < {tolerance})")
            from collections import Counter
            counts = Counter(inner_similars)
            for d in sorted(counts.keys()):
                print(f"Distance {d}: {counts[d]} pixels")

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    input_file = r"C:/Users/Hide2/.gemini/antigravity/brain/56a50dc2-cc27-4194-ac40-59861eb2c002/uploaded_image_1769172130406.jpg"
    analyze_inner_colors(input_file)
