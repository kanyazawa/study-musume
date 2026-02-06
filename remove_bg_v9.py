
from PIL import Image
import sys

def remove_bg_v9(input_path, output_path, outer_tolerance=60, inner_tolerance=10):
    try:
        img = Image.open(input_path).convert("RGBA")
        width, height = img.size
        pixels = img.load()
        
        # Get background color from top-left
        bg_ref = pixels[0, 0][:3]
        print(f"Background Reference: {bg_ref}")
        
        # Helper for color distance
        def get_dist(c1, c2):
            return sum(abs(c1[i] - c2[i]) for i in range(3))
            
        # 1. Outer Flood Fill (Loose Tolerance)
        visited = set()
        queue = [(0, 0), (width-1, 0), (0, height-1), (width-1, height-1)]
        
        # Validate corners
        queue = [p for p in queue if get_dist(pixels[p][:3], bg_ref) < outer_tolerance*3]
        visited.update(queue)
        
        processed_mask = Image.new("L", (width, height), 255) # 255=Opaque
        mask_pixels = processed_mask.load()

        idx = 0
        while idx < len(queue):
            cx, cy = queue[idx]
            idx += 1
            
            mask_pixels[cx, cy] = 0
            pixels[cx, cy] = (0, 0, 0, 0)
            
            for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
                nx, ny = cx + dx, cy + dy
                if 0 <= nx < width and 0 <= ny < height:
                    if (nx, ny) not in visited:
                        if get_dist(pixels[nx, ny][:3], bg_ref) < outer_tolerance*3:
                            visited.add((nx, ny))
                            queue.append((nx, ny))

        print("Outer background removed.")

        # 2. Inner Scan (Ultra Strict Tolerance)
        # Based on analysis, hair gaps should be VERY close to BG (Dist < 10).
        # Clothes are likely Dist > 30.
        removed_inner_count = 0
        
        for x in range(width):
            for y in range(height):
                if mask_pixels[x, y] == 0:
                    continue
                    
                dist = get_dist(pixels[x, y][:3], bg_ref)
                
                # STRICT filter for inner holes
                if dist < inner_tolerance:
                    mask_pixels[x, y] = 0
                    pixels[x, y] = (0, 0, 0, 0)
                    removed_inner_count += 1
                    
        print(f"Removed {removed_inner_count} inner pixels with strict tolerance < {inner_tolerance}.")
        
        img.putalpha(processed_mask)
        img.save(output_path, "PNG")
        print(f"Successfully saved to {output_path}")

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    input_file = r"C:/Users/Hide2/.gemini/antigravity/brain/56a50dc2-cc27-4194-ac40-59861eb2c002/uploaded_image_1769172130406.jpg"
    output_file = r"c:/Users/Hide2/.gemini/study-musume/src/assets/images/character_casual_v9.png"
    
    remove_bg_v9(input_file, output_file)
